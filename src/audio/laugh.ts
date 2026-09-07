// 처녀 웃음 합성 (GDD B12).
// 톱니파(220~330Hz, 5Hz 랜덤 비브라토) + 포먼트 대역통과 3개(700/1200/2600Hz).
// M-1 검증 대상: "사람으로 들리는지"

export const LAUGH_FORMANTS = [700, 1200, 2600];

export interface LaughOptions {
  /** 기본 주파수(Hz), 220~330 범위 */
  baseFrequency?: number;
  /** 비브라토 속도(Hz), 기본 5 */
  vibratoRate?: number;
  /** 비브라토 깊이(Hz) */
  vibratoDepth?: number;
  /** 지속 시간(초) */
  duration?: number;
}

/**
 * 처녀 웃음 소리를 재생한다. 톱니파 오실레이터 + 비브라토 LFO + 3개의 포먼트 대역통과 필터 병렬 합성.
 */
export function playMaidenLaugh(
  ctx: AudioContext,
  destination: AudioNode,
  opts: LaughOptions = {}
): void {
  const {
    baseFrequency = 260,
    vibratoRate = 5,
    vibratoDepth = 15,
    duration = 1.2,
  } = opts;

  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = baseFrequency;

  // 비브라토: LFO가 오실레이터 주파수를 변조
  const vibrato = ctx.createOscillator();
  vibrato.frequency.value = vibratoRate;
  const vibratoGain = ctx.createGain();
  vibratoGain.gain.value = vibratoDepth;
  vibrato.connect(vibratoGain).connect(osc.frequency);
  vibrato.start();
  vibrato.stop(ctx.currentTime + duration);

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.5, ctx.currentTime);
  masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  // 3개의 포먼트 대역통과 필터를 병렬로 연결해 사람 목소리 같은 공명을 만든다.
  for (const freq of LAUGH_FORMANTS) {
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = freq;
    bandpass.Q.value = 5;
    osc.connect(bandpass).connect(masterGain);
  }

  masterGain.connect(destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}
