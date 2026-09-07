// 소음 이벤트 버스 (GDD B4). 순수 로직: DOM/오디오에 의존하지 않는다.
// 모든 소리는 (위치, 반경) 이벤트다. 최종 반경 = 보법 반경 x 지형 배율,
// 결과가 3m 미만이면 0으로 절사(완전 무음).

import { Gait, GAIT_NOISE_RADIUS } from "../entities/unicorn";

export interface NoiseEvent {
  x: number;
  z: number;
  /** 최종 반경(m). 0이면 무음(리스너에게 전달하지 않는다). */
  radius: number;
  /** 이벤트 발생 시각(초 단위, 임의 기준). 리스너가 최신성 판단에 사용 가능. */
  time: number;
  /** 이벤트 종류(선택). 처녀 AI가 반응 방식을 다르게 하고 싶을 때 사용. */
  kind?: string;
}

export type NoiseListener = (event: NoiseEvent) => void;

/** 최소 유효 반경(m). 미만이면 절사되어 이벤트가 발생하지 않는다 (GDD B4). */
export const NOISE_CUTOFF_RADIUS_M = 3;

/**
 * 최종 소음 반경을 계산한다: 보법 반경 x 재질 배율.
 * 결과가 NOISE_CUTOFF_RADIUS_M 미만이면 0을 반환한다(완전 무음).
 */
export function computeFinalNoiseRadius(
  baseRadius: number,
  materialMultiplier: number
): number {
  const radius = baseRadius * materialMultiplier;
  return radius <= NOISE_CUTOFF_RADIUS_M ? 0 : radius;
}

/** 보법 발굽 소음의 최종 반경을 계산한다 (GDD B3, B4). */
export function computeHoofbeatNoiseRadius(
  gait: Gait,
  materialMultiplier: number
): number {
  return computeFinalNoiseRadius(GAIT_NOISE_RADIUS[gait], materialMultiplier);
}

/**
 * 간단한 발행-구독 노이즈 이벤트 버스.
 * 순수 함수형 코드베이스와 어울리도록 클래스가 아닌 팩토리 함수로 제공한다.
 */
export interface NoiseBus {
  emit(event: NoiseEvent): void;
  subscribe(listener: NoiseListener): () => void;
}

export function createNoiseBus(): NoiseBus {
  const listeners = new Set<NoiseListener>();
  return {
    emit(event: NoiseEvent) {
      if (event.radius <= 0) return; // 무음 이벤트는 전파하지 않는다
      for (const listener of listeners) listener(event);
    },
    subscribe(listener: NoiseListener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** 두 좌표 사이의 평면 거리(m). */
export function distance2D(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(ax - bx, az - bz);
}

/** 리스너가 주어진 위치에서 이벤트를 들을 수 있는지(반경 안인지) 판정한다. */
export function isWithinNoiseRadius(
  event: NoiseEvent,
  listenerX: number,
  listenerZ: number
): boolean {
  return distance2D(event.x, event.z, listenerX, listenerZ) <= event.radius;
}
