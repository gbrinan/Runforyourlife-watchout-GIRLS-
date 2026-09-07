// 처녀(힐) AI 상태기계 (GDD B5). 배회/경계/추격/공격/상실.
// 순수 함수형: dt 기반 update, Three.js/DOM에 의존하지 않는다.

export enum MaidenState {
  Wander = "wander",
  Alert = "alert",
  Chase = "chase",
  Attack = "attack",
  Lost = "lost",
}

export const MAIDEN_SPEED: Record<MaidenState, number> = {
  [MaidenState.Wander]: 1.2,
  [MaidenState.Alert]: 3.0,
  [MaidenState.Chase]: 4.5,
  [MaidenState.Attack]: 0, // 공격 중에는 이동하지 않는다
  [MaidenState.Lost]: 3.0, // 마지막 위치 주변 수색(경계와 동일 속도로 근사)
};

/** 힐 걸음 간격(초) (GDD B5). */
export const MAIDEN_STEP_INTERVAL: Record<MaidenState, number> = {
  [MaidenState.Wander]: 0.6,
  [MaidenState.Alert]: 0.45,
  [MaidenState.Chase]: 0.3,
  [MaidenState.Attack]: 0.3,
  [MaidenState.Lost]: 0.45,
};

export const CHASE_VIEW_RANGE_M = 25;
export const CHASE_VIEW_CONE_DEG = 90;
export const ATTACK_RANGE_M = 1.5;
export const ATTACK_COOLDOWN_S = 3;
export const LOST_SEARCH_DURATION_S = 20;
export const MAX_SIMULTANEOUS_CHASERS = 4;

export interface MaidenAIState {
  x: number;
  z: number;
  state: MaidenState;
  /** 마지막으로 감지된(추적 대상) 위치. Alert/Lost 상태에서 목적지로 사용. */
  targetX: number;
  targetZ: number;
  /** Lost 상태에서 남은 수색 시간(초) */
  lostTimer: number;
  /** Attack 이후 쿨다운 남은 시간(초) */
  attackCooldown: number;
}

export function createInitialMaidenState(x: number, z: number): MaidenAIState {
  return {
    x,
    z,
    state: MaidenState.Wander,
    targetX: x,
    targetZ: z,
    lostTimer: 0,
    attackCooldown: 0,
  };
}

export interface PlayerContext {
  x: number;
  z: number;
  /** 플레이어가 바라보는 방향(라디안). 시야 원뿔 판정에 사용(단순화를 위해 처녀->플레이어 각도로 계산). */
  yaw?: number;
}

export interface NoiseHint {
  x: number;
  z: number;
}

/**
 * 플레이어가 시야 원뿔(전방 90도, 25m) 안에 있는지 판정한다.
 * 단순화를 위해 지형 차폐(레이캐스트)는 생략하고 거리+각도만 사용한다.
 */
export function canSeePlayer(
  maiden: { x: number; z: number },
  facingYaw: number,
  player: PlayerContext
): boolean {
  const dx = player.x - maiden.x;
  const dz = player.z - maiden.z;
  const dist = Math.hypot(dx, dz);
  if (dist > CHASE_VIEW_RANGE_M) return false;
  if (dist === 0) return true;
  // 처녀가 바라보는 방향(facingYaw)과 플레이어 방향 사이 각도차
  const angleToPlayer = Math.atan2(dx, dz);
  let diff = Math.abs(angleToPlayer - facingYaw);
  diff = ((diff + Math.PI) % (2 * Math.PI)) - Math.PI; // -pi..pi 정규화
  diff = Math.abs(diff);
  return diff <= (CHASE_VIEW_CONE_DEG / 2) * (Math.PI / 180);
}

function moveToward(
  x: number,
  z: number,
  targetX: number,
  targetZ: number,
  speed: number,
  dt: number
): { x: number; z: number; arrived: boolean } {
  const dx = targetX - x;
  const dz = targetZ - z;
  const dist = Math.hypot(dx, dz);
  const step = speed * dt;
  if (dist <= step || dist === 0) {
    return { x: targetX, z: targetZ, arrived: true };
  }
  const ratio = step / dist;
  return { x: x + dx * ratio, z: z + dz * ratio, arrived: false };
}

export interface MaidenUpdateInput {
  dt: number;
  player: PlayerContext;
  /** 이번 프레임에 들려온 가장 가까운/최신 노이즈(없으면 undefined) */
  heardNoise?: NoiseHint;
  /** 현재 동시 추격 중인 처녀 수(자기 자신 포함 이전 프레임 기준). 4명 초과분은 배회로 강제 전환. */
  activeChaserCount?: number;
  /** 처녀가 바라보는 방향(라디안). 기본은 목표 지점을 향한다고 가정. */
  facingYaw?: number;
}

/**
 * 처녀 AI 상태를 dt만큼 갱신한다 (GDD B5).
 * 상태 전이:
 * wander -> alert (소리를 들으면 그 위치로)
 * alert -> chase (시야 확보, 원뿔+거리)
 * alert -> wander (소리도 없고 시야도 없으면 목표 도달 후 복귀)
 * chase -> attack (접촉 거리 이내)
 * chase -> lost (시야를 잃으면 마지막 위치에서 수색 시작)
 * lost -> chase (다시 시야 확보)
 * lost -> wander (수색 시간 초과)
 * attack -> chase (쿨다운 종료 후에도 시야 있으면 재추격)
 */
export function updateMaiden(
  maiden: MaidenAIState,
  input: MaidenUpdateInput
): MaidenAIState {
  const { dt, player, heardNoise } = input;
  const facingYaw =
    input.facingYaw ?? Math.atan2(maiden.targetX - maiden.x, maiden.targetZ - maiden.z);
  const activeChaserCount = input.activeChaserCount ?? 0;

  let { state, targetX, targetZ, lostTimer, attackCooldown } = maiden;

  if (attackCooldown > 0) {
    attackCooldown = Math.max(0, attackCooldown - dt);
  }

  const sees = canSeePlayer(maiden, facingYaw, player);
  const distToPlayer = Math.hypot(player.x - maiden.x, player.z - maiden.z);

  switch (state) {
    case MaidenState.Wander:
      if (heardNoise) {
        state = MaidenState.Alert;
        targetX = heardNoise.x;
        targetZ = heardNoise.z;
      }
      break;

    case MaidenState.Alert: {
      if (sees && activeChaserCount < MAX_SIMULTANEOUS_CHASERS) {
        state = MaidenState.Chase;
        targetX = player.x;
        targetZ = player.z;
        break;
      }
      if (heardNoise) {
        targetX = heardNoise.x;
        targetZ = heardNoise.z;
      }
      const moved = moveToward(maiden.x, maiden.z, targetX, targetZ, MAIDEN_SPEED[state], dt);
      if (moved.arrived && !heardNoise) {
        state = MaidenState.Wander;
      }
      return { ...maiden, x: moved.x, z: moved.z, state, targetX, targetZ, lostTimer, attackCooldown };
    }

    case MaidenState.Chase: {
      if (distToPlayer <= ATTACK_RANGE_M && attackCooldown <= 0) {
        state = MaidenState.Attack;
        attackCooldown = ATTACK_COOLDOWN_S;
        return { ...maiden, state, attackCooldown, targetX: player.x, targetZ: player.z };
      }
      if (!sees && activeChaserCount >= 0) {
        if (!sees) {
          state = MaidenState.Lost;
          lostTimer = LOST_SEARCH_DURATION_S;
          targetX = maiden.targetX; // 마지막으로 알려진 위치 유지(직전 target)
          targetZ = maiden.targetZ;
          break;
        }
      }
      targetX = player.x;
      targetZ = player.z;
      const moved = moveToward(maiden.x, maiden.z, targetX, targetZ, MAIDEN_SPEED[state], dt);
      return { ...maiden, x: moved.x, z: moved.z, state, targetX, targetZ, lostTimer, attackCooldown };
    }

    case MaidenState.Attack:
      // 쿨다운이 끝나면 다시 시야를 확인해 추격을 이어가거나 상실로 전환한다.
      if (attackCooldown <= 0) {
        state = sees ? MaidenState.Chase : MaidenState.Lost;
        if (state === MaidenState.Lost) lostTimer = LOST_SEARCH_DURATION_S;
      }
      return { ...maiden, state, lostTimer, attackCooldown };

    case MaidenState.Lost: {
      if (sees && activeChaserCount < MAX_SIMULTANEOUS_CHASERS) {
        state = MaidenState.Chase;
        targetX = player.x;
        targetZ = player.z;
        return { ...maiden, state, targetX, targetZ, lostTimer: 0, attackCooldown };
      }
      lostTimer = Math.max(0, lostTimer - dt);
      const moved = moveToward(maiden.x, maiden.z, targetX, targetZ, MAIDEN_SPEED[state], dt);
      if (lostTimer <= 0) {
        state = MaidenState.Wander;
        return { ...maiden, x: moved.x, z: moved.z, state, lostTimer: 0, attackCooldown };
      }
      return { ...maiden, x: moved.x, z: moved.z, state, targetX, targetZ, lostTimer, attackCooldown };
    }
  }

  // Wander 및 wander로 막 전환된 case의 기본 이동 처리
  if (state === MaidenState.Wander) {
    return { ...maiden, state, targetX, targetZ, lostTimer, attackCooldown };
  }

  return { ...maiden, state, targetX, targetZ, lostTimer, attackCooldown };
}

/** 동시 추격 처녀 수를 4명으로 제한한다. 초과분은 배회로 강제 전환. */
export function capSimultaneousChasers(maidens: MaidenAIState[]): MaidenAIState[] {
  let chaserCount = 0;
  return maidens.map((m) => {
    if (m.state === MaidenState.Chase) {
      chaserCount++;
      if (chaserCount > MAX_SIMULTANEOUS_CHASERS) {
        return { ...m, state: MaidenState.Wander };
      }
    }
    return m;
  });
}
