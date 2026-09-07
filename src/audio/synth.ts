// Web Audio 합성 프리미티브 (GDD B12). 에셋 파일 없이 런타임 합성.
// 이 모듈은 실제 AudioContext에 의존하므로 vitest 커버리지 대상에서는 제외한다
// (순수 로직은 hooves.ts로 분리됨).

export interface NoiseBurstOptions {
  /** 지속 시간(초) */
  duration: number;
  /** 대역통과 중심 주파수(Hz) */
  bandpassFreq: number;
  /** 대역통과 Q값 */
  q?: number;
  /** 게인(0~1) */
  gain?: number;
}

/** 화이트 노이즈 버퍼를 생성한다. */
export function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * 노이즈 버스트를 재생한다 (힐 발소리, 유니콘 발굽 노이즈 성분 등).
 * GDD B12: 노이즈 버스트 + 대역통과 필터.
 */
export function playNoiseBurst(
  ctx: AudioContext,
  destination: AudioNode,
  opts: NoiseBurstOptions
): void {
  const { duration, bandpassFreq, q = 8, gain = 0.5 } = opts;
  const source = ctx.createBufferSource();
  source.buffer = createNoiseBuffer(ctx, duration);

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = bandpassFreq;
  bandpass.Q.value = q;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  source.connect(bandpass).connect(gainNode).connect(destination);
  source.start();
  source.stop(ctx.currentTime + duration);
}

export interface DecayingSineOptions {
  /** 기본 주파수(Hz) */
  frequency: number;
  /** 감쇠 시간(초) */
  duration: number;
  /** 게인(0~1) */
  gain?: number;
  /** 로우패스 컷오프(Hz), 재질별 필터링용 */
  lowpassFreq?: number;
}

/**
 * 감쇠하는 사인파를 재생한다 (유니콘 발굽의 40~120Hz 성분, 심장소리 등).
 */
export function playDecayingSine(
  ctx: AudioContext,
  destination: AudioNode,
  opts: DecayingSineOptions
): void {
  const { frequency, duration, gain = 0.6, lowpassFreq } = opts;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = frequency;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  let lastNode: AudioNode = osc;
  if (lowpassFreq !== undefined) {
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = lowpassFreq;
    lastNode.connect(lowpass);
    lastNode = lowpass;
  }

  lastNode.connect(gainNode).connect(destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

/** 재질별 로우패스 컷오프 (GDD B12: 유니콘 발굽). */
export const HOOF_LOWPASS_BY_MATERIAL: Record<string, number> = {
  grass: 800,
  dirt: 2000,
  gravel: 6000,
  shallow_water: 4000, // 하이패스가 이상적이나 프로토타입에서는 로우패스 근사
};

/**
 * 유니콘 발굽 소리 = 40~120Hz 사인 감쇠 60ms + 노이즈 버스트 20ms.
 */
export function playHoofbeat(
  ctx: AudioContext,
  destination: AudioNode,
  material: string,
  baseFrequency = 60
): void {
  const lowpass = HOOF_LOWPASS_BY_MATERIAL[material] ?? 800;
  playDecayingSine(ctx, destination, {
    frequency: baseFrequency,
    duration: 0.06,
    gain: 0.7,
    lowpassFreq: lowpass,
  });
  const gravelBoost = material === "gravel" ? 2 : 1;
  playNoiseBurst(ctx, destination, {
    duration: 0.02,
    bandpassFreq: lowpass,
    q: 6,
    gain: 0.3 * gravelBoost,
  });
}

/** 간단한 LFO(저주파 발진기)를 생성해 파라미터를 변조한다 (바람, 새 등). */
export function createLFO(
  ctx: AudioContext,
  frequency: number,
  target: AudioParam,
  depth: number
): OscillatorNode {
  const lfo = ctx.createOscillator();
  lfo.frequency.value = frequency;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = depth;
  lfo.connect(lfoGain).connect(target);
  lfo.start();
  return lfo;
}
