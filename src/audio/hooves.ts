// 유니콘 발굽 리듬의 순수 타이밍 로직 (GDD B3, B12).
// AudioContext에 의존하지 않으므로 vitest로 완전히 테스트 가능하다.

import { Gait } from "../entities/unicorn";

/** 보법별 발굽 리듬 정의: 박자 개수와 각 박자 사이의 간격 비율(주기 대비). */
export interface GaitRhythm {
  /** 한 사이클(주기) 길이(초) */
  period: number;
  /** 각 박자가 사이클 내에서 발생하는 시각(초), period 미만 오름차순 */
  beatOffsets: number[];
}

// GDD B3 표:
// 서행: 4박, 주기 1.0s, 균등 -> 0, 0.25, 0.5, 0.75
// 속보: 2박(대각), 주기 0.6s -> 0, 0.3
// 구보: 3박, 주기 0.5s -> 균등 0, 0.1667, 0.3333 (3박 균등 근사)
// 질주: 4박 불균등(0-0.1-0.2-0.45), 주기 0.42s
export const GAIT_RHYTHMS: Record<Gait, GaitRhythm> = {
  [Gait.Walk]: { period: 1.0, beatOffsets: [0, 0.25, 0.5, 0.75] },
  [Gait.Trot]: { period: 0.6, beatOffsets: [0, 0.3] },
  [Gait.Canter]: { period: 0.5, beatOffsets: [0, 0.1667, 0.3333] },
  [Gait.Gallop]: { period: 0.42, beatOffsets: [0, 0.1, 0.2, 0.45 * (0.42 / 0.42)] },
};

/**
 * 질주 리듬은 GDD 표기가 "0-0.1-0.2-0.45"로, 마지막 값이 주기(0.42)를 넘는다.
 * 비율로 해석해 실제 주기(0.42s) 안에 스케일링한다: 0, 0.1, 0.2, 0.45 -> 최대값 0.45 기준 정규화.
 */
function scaledGallopOffsets(period: number): number[] {
  const raw = [0, 0.1, 0.2, 0.45];
  const maxRaw = raw[raw.length - 1];
  return raw.map((v) => (v / maxRaw) * period);
}
GAIT_RHYTHMS[Gait.Gallop].beatOffsets = scaledGallopOffsets(
  GAIT_RHYTHMS[Gait.Gallop].period
);

/**
 * 주어진 경과 시간(elapsed, 초) 동안 발생해야 할 발굽 박자 시각들의 목록을 반환한다.
 * lastElapsed(이전 프레임까지 경과) ~ elapsed(현재 프레임까지 경과) 구간에서
 * 새로 지나간 박자만 반환한다. 사이클을 여러 번 넘어가도 정확히 계산한다.
 */
export function getHoofbeatsInInterval(
  gait: Gait,
  lastElapsed: number,
  elapsed: number
): number[] {
  if (elapsed <= lastElapsed) return [];
  const rhythm = GAIT_RHYTHMS[gait];
  const { period, beatOffsets } = rhythm;
  const beats: number[] = [];

  const startCycle = Math.floor(lastElapsed / period);
  const endCycle = Math.floor(elapsed / period);

  for (let cycle = startCycle; cycle <= endCycle; cycle++) {
    for (const offset of beatOffsets) {
      const t = cycle * period + offset;
      if (t > lastElapsed && t <= elapsed) {
        beats.push(t);
      }
    }
  }
  return beats;
}

/** 보법별 카메라 bob 진폭(cm) (GDD B3). */
export const GAIT_BOB_AMPLITUDE_CM: Record<Gait, number> = {
  [Gait.Walk]: 2,
  [Gait.Trot]: 5,
  [Gait.Canter]: 8,
  [Gait.Gallop]: 12,
};

/**
 * 발굽 박자에 동기화된 카메라 bob 오프셋(미터)을 계산한다.
 * 각 박자에서 사인 형태로 위아래로 흔들리도록 phase를 사이클 진행률로 계산한다.
 */
export function computeBobOffsetMeters(gait: Gait, elapsed: number): number {
  const rhythm = GAIT_RHYTHMS[gait];
  const amplitudeM = GAIT_BOB_AMPLITUDE_CM[gait] / 100;
  const phase = (elapsed % rhythm.period) / rhythm.period; // 0~1
  // 한 사이클에 박자 수만큼의 봉우리가 생기도록.
  const beatCount = rhythm.beatOffsets.length;
  return amplitudeM * Math.abs(Math.sin(phase * beatCount * Math.PI));
}
