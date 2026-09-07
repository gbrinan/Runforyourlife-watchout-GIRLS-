// 뿔의 빛 능력 (GDD B7, B18). 3초 조명, 이후 5초 쿨다운. 순수 로직.

export const HORN_LIGHT_DURATION_S = 3;
export const HORN_LIGHT_COOLDOWN_S = 5;
/** 15m 내 처녀에게 시야 확보로 간주된다 (GDD B4). */
export const HORN_LIGHT_VISIBILITY_RADIUS_M = 15;

export interface HornLightState {
  /** 남은 점등 시간(초). 0이면 꺼짐. */
  activeRemaining: number;
  /** 남은 쿨다운 시간(초). 0이면 재사용 가능. */
  cooldownRemaining: number;
}

export function createInitialHornLightState(): HornLightState {
  return { activeRemaining: 0, cooldownRemaining: 0 };
}

export function canActivateHornLight(state: HornLightState): boolean {
  return state.activeRemaining <= 0 && state.cooldownRemaining <= 0;
}

/** Q 입력 처리: 사용 가능하면 점등을 시작한다. */
export function activateHornLight(state: HornLightState): HornLightState {
  if (!canActivateHornLight(state)) return state;
  return { activeRemaining: HORN_LIGHT_DURATION_S, cooldownRemaining: 0 };
}

/**
 * dt(초)만큼 상태를 갱신한다. 점등이 끝나면 쿨다운이 시작되며,
 * 한 번의 갱신에서 초과된 dt는 쿨다운 소모로 이어진다(긴 프레임 스텝 대응).
 */
export function updateHornLight(state: HornLightState, dt: number): HornLightState {
  let { activeRemaining, cooldownRemaining } = state;
  let remainingDt = dt;

  if (activeRemaining > 0) {
    const consumed = Math.min(activeRemaining, remainingDt);
    activeRemaining -= consumed;
    remainingDt -= consumed;
    if (activeRemaining <= 0) {
      cooldownRemaining = HORN_LIGHT_COOLDOWN_S;
    }
  }

  if (activeRemaining <= 0 && cooldownRemaining > 0 && remainingDt > 0) {
    cooldownRemaining = Math.max(0, cooldownRemaining - remainingDt);
  }

  return { activeRemaining, cooldownRemaining };
}

export function isHornLightOn(state: HornLightState): boolean {
  return state.activeRemaining > 0;
}
