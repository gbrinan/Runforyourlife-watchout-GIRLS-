// 스태미너 시스템 (GDD B3). 0~100. 질주 -12/s, 구보 -3/s, 속보 이하 +8/s.
// 0이 되면 최대 보법이 속보로 제한된다. 순수 로직만 담당한다.

import { Gait } from "./unicorn";

export const STAMINA_MAX = 100;
export const STAMINA_MIN = 0;
export const GALLOP_DRAIN_PER_SEC = 12;
export const CANTER_DRAIN_PER_SEC = 3;
export const RECOVERY_PER_SEC = 8; // 속보 이하에서 회복
/** 스태미너가 이 값 이하이면 카메라 흔들림 1.5배 (GDD B3). */
export const CAMERA_SHAKE_THRESHOLD = 30;
export const CAMERA_SHAKE_MULTIPLIER = 1.5;

export interface StaminaState {
  value: number;
  /** 0에 도달해 속보로 제한된 적이 있는지(재충전 후에도 UI 표시용으로 유지 가능) */
  depleted: boolean;
}

export function createInitialStaminaState(): StaminaState {
  return { value: STAMINA_MAX, depleted: false };
}

/** 보법별 스태미너 초당 변화량(+회복/-소모). */
export function staminaDeltaPerSecond(gait: Gait): number {
  switch (gait) {
    case Gait.Gallop:
      return -GALLOP_DRAIN_PER_SEC;
    case Gait.Canter:
      return -CANTER_DRAIN_PER_SEC;
    default:
      return RECOVERY_PER_SEC;
  }
}

/**
 * dt(초) 동안 스태미너를 갱신한다. 0~100 범위로 clamp.
 * 값이 0에 도달하면 depleted=true로 표시하고, 회복이 시작되면(양의 델타) 다시 false로 되돌린다.
 */
export function updateStamina(state: StaminaState, gait: Gait, dt: number): StaminaState {
  const delta = staminaDeltaPerSecond(gait) * dt;
  const nextValue = Math.max(STAMINA_MIN, Math.min(STAMINA_MAX, state.value + delta));
  let depleted = state.depleted;
  if (nextValue <= STAMINA_MIN) {
    depleted = true;
  } else if (delta > 0 && nextValue > STAMINA_MIN) {
    // 회복 중이며 0을 벗어났다면 제한 해제. 다만 완전히 100 회복까지 기다릴 필요는 없다.
    depleted = false;
  }
  return { value: nextValue, depleted };
}

/** 현재 스태미너 상태에서 허용되는 최대 보법을 반환한다 (GDD B3). */
export function getMaxAllowedGait(state: StaminaState): Gait {
  return state.depleted ? Gait.Trot : Gait.Gallop;
}

/** 요청한 보법이 스태미너 제한을 넘는 경우 허용되는 최대 보법으로 낮춘다. */
export function clampGaitByStamina(requestedGait: Gait, state: StaminaState): Gait {
  const order = [Gait.Walk, Gait.Trot, Gait.Canter, Gait.Gallop];
  const maxGait = getMaxAllowedGait(state);
  const maxIdx = order.indexOf(maxGait);
  const reqIdx = order.indexOf(requestedGait);
  return reqIdx > maxIdx ? maxGait : requestedGait;
}

/** 카메라 흔들림 배율을 반환한다 (GDD B3: 30 이하부터 1.5배). */
export function getCameraShakeMultiplier(state: StaminaState): number {
  return state.value <= CAMERA_SHAKE_THRESHOLD ? CAMERA_SHAKE_MULTIPLIER : 1;
}
