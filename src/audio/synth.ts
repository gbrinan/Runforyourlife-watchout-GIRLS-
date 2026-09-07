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

// --- 유니콘 목소리 합성 (GDD B17) ---
// 평소(소년): 톱니파 260~330Hz + 포먼트(800/1400/2800Hz) + 짧은 비브라토.
// 위기(아저씨): 기본 주파수 110~130Hz + 포먼트(600/1000/2400Hz) + 거친 노이즈, 80ms 피치 글라이드.

export interface VoiceOptions {
  duration?: number;
  gain?: number;
}

/** 소년 목소리(평소)를 재생한다. 히힝(울음), 감탄 등에 사용. */
export function playBoyVoice(
  ctx: AudioContext,
  destination: AudioNode,
  opts: VoiceOptions = {}
): void {
  const { duration = 0.5, gain = 0.5 } = opts;
  const frequency = 260 + Math.random() * 70; // 260~330Hz
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);

  const vibrato = ctx.createOscillator();
  vibrato.frequency.value = 6;
  const vibratoGain = ctx.createGain();
  vibratoGain.gain.value = 8;
  vibrato.connect(vibratoGain).connect(osc.frequency);
  vibrato.start();
  vibrato.stop(ctx.currentTime + duration);

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(gain, ctx.currentTime);
  masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  for (const freq of [800, 1400, 2800]) {
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = freq;
    bandpass.Q.value = 6;
    osc.connect(bandpass).connect(masterGain);
  }
  masterGain.connect(destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

/**
 * 위기의 아저씨 목소리를 재생한다 (GDD B17).
 * 소년 목소리(260~330Hz)에서 아저씨(110~130Hz)로 80ms 안에 피치 글라이드하며
 * 포먼트를 아래로(600/1000/2400Hz), 노이즈를 섞는다.
 */
export function playCrisisVoice(
  ctx: AudioContext,
  destination: AudioNode,
  opts: VoiceOptions = {}
): void {
  const { duration = 0.6, gain = 0.6 } = opts;
  const startFreq = 260 + Math.random() * 70;
  const manFreq = 110 + Math.random() * 20; // 110~130Hz

  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(manFreq, ctx.currentTime + 0.08); // 80ms 글라이드

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(gain, ctx.currentTime);
  masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  for (const freq of [600, 1000, 2400]) {
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = freq;
    bandpass.Q.value = 5;
    osc.connect(bandpass).connect(masterGain);
  }

  // 거친 노이즈를 섞는다 (숨소리/공포).
  const noiseGainNode = ctx.createGain();
  noiseGainNode.gain.setValueAtTime(gain * 0.4, ctx.currentTime);
  noiseGainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = createNoiseBuffer(ctx, duration);
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 1000;
  noiseFilter.Q.value = 1;
  noiseSource.connect(noiseFilter).connect(noiseGainNode).connect(masterGain);
  noiseSource.start();
  noiseSource.stop(ctx.currentTime + duration);

  masterGain.connect(destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

/**
 * 던전 메아리: 원음을 delay 2개(문 방향으로 지연·패닝)로 복제해 재생한다 (GDD B18).
 * PannerNode로 방향(문 쪽)을 표현하고, delayTime은 문까지 거리에 비례한다.
 */
export function playEchoTowardDoor(
  ctx: AudioContext,
  destination: AudioNode,
  doorDirection: { x: number; y: number; z: number },
  distanceToDoor: number,
  playOriginal: (dest: AudioNode) => void
): void {
  playOriginal(destination);

  const speedOfSoundFactor = 0.02; // 거리에 비례한 지연(초/미터), 과장된 게임용 근사
  const delays = [0.15, 0.32];
  for (const baseDelay of delays) {
    const delayTime = baseDelay + distanceToDoor * speedOfSoundFactor;
    const delayNode = ctx.createDelay(5);
    delayNode.delayTime.value = Math.min(4.9, delayTime);

    const panner = ctx.createPanner();
    panner.panningModel = "HRTF";
    panner.distanceModel = "inverse";
    panner.positionX.value = doorDirection.x;
    panner.positionY.value = doorDirection.y;
    panner.positionZ.value = doorDirection.z;

    const echoGain = ctx.createGain();
    echoGain.gain.value = 0.35;

    delayNode.connect(panner).connect(echoGain).connect(destination);
    playOriginal(delayNode);
  }
}
