// 유니콘 이동 상태기계 (GDD B3). 4단 보법, 가감속, 질주 슬라이드, 회전 상한.
// 순수 로직만 담당하며 Three.js/DOM에 의존하지 않아 테스트 가능하다.

export enum Gait {
  Walk = "walk",
  Trot = "trot",
  Canter = "canter",
  Gallop = "gallop",
}

const GAIT_ORDER: Gait[] = [Gait.Walk, Gait.Trot, Gait.Canter, Gait.Gallop];

/** 보법별 목표 속도(m/s) (GDD B3). */
export const GAIT_SPEED: Record<Gait, number> = {
  [Gait.Walk]: 1.5,
  [Gait.Trot]: 3.0,
  [Gait.Canter]: 5.0,
  [Gait.Gallop]: 8.0,
};

/** 보법별 소음 반경(m) (GDD B3). */
export const GAIT_NOISE_RADIUS: Record<Gait, number> = {
  [Gait.Walk]: 6,
  [Gait.Trot]: 14,
  [Gait.Canter]: 24,
  [Gait.Gallop]: 40,
};

/** 보법별 회전 속도 상한(도/초). 서행/속보는 제약 없음(Infinity)으로 취급. */
export const GAIT_TURN_RATE_CAP_DEG: Record<Gait, number> = {
  [Gait.Walk]: Infinity,
  [Gait.Trot]: Infinity,
  [Gait.Canter]: 90,
  [Gait.Gallop]: 45,
};

export const GAIT_TRANSITION_DURATION = 0.6; // 초, 선형 가감속 (GDD B3)
export const GALLOP_STOP_SLIDE_DISTANCE = 1.5; // m, 질주->정지 미끄러짐 (GDD B3)

export interface UnicornState {
  gait: Gait;
  /** 현재 실제 속도(m/s). 목표 속도로 선형 보간된다. */
  currentSpeed: number;
  /** 목표 보법으로 전환 중인지 여부와 남은 시간 */
  transitionRemaining: number;
  /** 이전 보법(전환 중 보간 시작점) */
  fromGait: Gait;
  /** 질주 중 정지 명령을 받아 미끄러지고 있는 중인지 */
  sliding: boolean;
  slideRemainingDistance: number;
}

export function createInitialUnicornState(): UnicornState {
  return {
    gait: Gait.Walk,
    currentSpeed: 0,
    transitionRemaining: 0,
    fromGait: Gait.Walk,
    sliding: false,
    slideRemainingDistance: 0,
  };
}

function gaitIndex(g: Gait): number {
  return GAIT_ORDER.indexOf(g);
}

/** Shift 탭: 보법 한 단계 상승 (GDD B3). 이미 질주면 변화 없음. */
export function upshiftGait(state: UnicornState): UnicornState {
  const idx = gaitIndex(state.gait);
  if (idx >= GAIT_ORDER.length - 1) return state;
  const nextGait = GAIT_ORDER[idx + 1];
  return {
    ...state,
    fromGait: state.gait,
    gait: nextGait,
    transitionRemaining: GAIT_TRANSITION_DURATION,
    sliding: false,
  };
}

/**
 * Ctrl 탭: 보법 한 단계 하강 (GDD B3).
 * 질주 중이었다면(fromGait이 gallop) 먼저 미끄러짐(1.5m)이 발생한다.
 */
export function downshiftGait(state: UnicornState): UnicornState {
  const idx = gaitIndex(state.gait);
  if (idx <= 0) return state;
  const wasGallop = state.gait === Gait.Gallop;
  const nextGait = GAIT_ORDER[idx - 1];
  return {
    ...state,
    fromGait: state.gait,
    gait: nextGait,
    transitionRemaining: GAIT_TRANSITION_DURATION,
    sliding: wasGallop,
    slideRemainingDistance: wasGallop ? GALLOP_STOP_SLIDE_DISTANCE : 0,
  };
}

/**
 * 시간 dt(초) 만큼 상태를 갱신한다. 슬라이드 중이면 슬라이드가 먼저 소모된다.
 * 반환값: 새 상태와 이번 프레임에 이동한 거리(m).
 */
export function updateUnicornState(
  state: UnicornState,
  dt: number
): { state: UnicornState; distanceMoved: number } {
  const targetSpeed = GAIT_SPEED[state.gait];
  let currentSpeed = state.currentSpeed;
  let transitionRemaining = state.transitionRemaining;
  let sliding = state.sliding;
  let slideRemainingDistance = state.slideRemainingDistance;
  let distanceMoved = 0;

  if (sliding) {
    // 미끄러지는 동안은 감속하며 slideRemainingDistance만큼 이동 후 정지
    const fromSpeed = GAIT_SPEED[Gait.Gallop];
    const slideDuration = (2 * GALLOP_STOP_SLIDE_DISTANCE) / fromSpeed; // 등감속 가정
    const step = Math.min(dt, slideDuration);
    const fraction = slideDuration > 0 ? step / slideDuration : 1;
    const moveThisStep = fromSpeed * step * (1 - fraction / 2);
    distanceMoved += Math.min(moveThisStep, slideRemainingDistance);
    slideRemainingDistance = Math.max(0, slideRemainingDistance - moveThisStep);
    currentSpeed = fromSpeed * (1 - fraction);
    if (slideRemainingDistance <= 0) {
      sliding = false;
      currentSpeed = 0;
    }
  }

  if (transitionRemaining > 0) {
    const fromSpeed = GAIT_SPEED[state.fromGait];
    const step = Math.min(dt, transitionRemaining);
    const t0 = 1 - transitionRemaining / GAIT_TRANSITION_DURATION;
    const t1 = 1 - (transitionRemaining - step) / GAIT_TRANSITION_DURATION;
    const speedAtT0 = fromSpeed + (targetSpeed - fromSpeed) * t0;
    const speedAtT1 = fromSpeed + (targetSpeed - fromSpeed) * t1;
    const avgSpeed = (speedAtT0 + speedAtT1) / 2;
    if (!sliding) {
      distanceMoved += avgSpeed * step;
    }
    currentSpeed = speedAtT1;
    transitionRemaining = Math.max(0, transitionRemaining - dt);
  } else if (!sliding) {
    currentSpeed = targetSpeed;
    distanceMoved += targetSpeed * dt;
  }

  return {
    state: {
      ...state,
      currentSpeed,
      transitionRemaining,
      sliding,
      slideRemainingDistance,
    },
    distanceMoved,
  };
}

/** 현재 보법의 회전 속도 상한을 dt(초) 동안 각도(도) 기준으로 반환한다. */
export function getMaxTurnDegrees(state: UnicornState, dt: number): number {
  const cap = GAIT_TURN_RATE_CAP_DEG[state.gait];
  return cap === Infinity ? Infinity : cap * dt;
}

/** 카메라 헤드 높이(m)와 FOV(도) (GDD B3). */
export const CAMERA_HEAD_HEIGHT_M = 1.6;
export const CAMERA_FOV_DEG = 100;
