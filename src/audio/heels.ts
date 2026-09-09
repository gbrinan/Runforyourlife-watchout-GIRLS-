// 힐(처녀) 발소리 루프 (GDD B12).
// 노이즈 버스트 15ms + 대역통과 2~4kHz(Q8) + 재질별 짧은 공명.
// M-1 실험에서는 3D 오디오(PannerNode HRTF)로 접근하는 느낌을 낸다.

import { playNoiseBurst, playDecayingSine } from "./synth";

export interface HeelClickOptions {
  /** 재생 간격(초). GDD B5: 배회 0.6s, 경계 0.45s, 추격 0.3s */
  interval: number;
  /** 대역통과 중심 주파수(Hz), 기본 3kHz (2~4kHz 범위) */
  bandpassFreq?: number;
}

/** 힐 클릭 한 번을 재생한다. */
export function playHeelClick(
  ctx: AudioContext,
  destination: AudioNode,
  bandpassFreq = 3000
): void {
  playNoiseBurst(ctx, destination, {
    duration: 0.03,
    bandpassFreq,
    q: 2,
    gain: 0.8,
  });
  playDecayingSine(ctx,destination,{frequency:1450,duration:.09,gain:.3});
}

/**
 * 힐 소리 루프를 시작한다. PannerNode를 사용해 3D 위치를 반영한다.
 * 반환된 함수를 호출하면 루프가 정지된다.
 */
export function startHeelLoop(
  ctx: AudioContext,
  destination: AudioNode,
  opts: HeelClickOptions,
  getPosition: () => { x: number; y: number; z: number }
): () => void {
  const panner = ctx.createPanner();
  panner.panningModel = "HRTF";
  panner.distanceModel = "inverse";
  panner.refDistance = 1;
  panner.connect(destination);

  let stopped = false;
  let handle: ReturnType<typeof setTimeout> | undefined;

  const tick = () => {
    if (stopped) return;
    const pos = getPosition();
    if (panner.positionX) {
      panner.positionX.value = pos.x;
      panner.positionY.value = pos.y;
      panner.positionZ.value = pos.z;
    }
    playHeelClick(ctx, panner);
    handle = setTimeout(tick, opts.interval * 1000);
  };
  tick();

  return () => {
    stopped = true;
    if (handle) clearTimeout(handle);
    panner.disconnect();
  };
}

/**
 * 접근 애니메이션: 30m -> 3m로 duration(초) 동안 선형 이동하는 위치 제공자를 만든다.
 * M-1 데모용 (m1.html의 "힐 소리" 버튼).
 */
export function createApproachPositionProvider(
  startDistance: number,
  endDistance: number,
  duration: number
): () => { x: number; y: number; z: number } {
  const startTime = Date.now();
  return () => {
    const elapsed = (Date.now() - startTime) / 1000;
    const t = Math.min(1, elapsed / duration);
    const distance = startDistance + (endDistance - startDistance) * t;
    // 정면(-z 방향)에서 다가오는 것으로 가정
    return { x: 0, y: 0, z: -distance };
  };
}
