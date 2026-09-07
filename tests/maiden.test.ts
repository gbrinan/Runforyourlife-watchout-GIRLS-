import { describe, it, expect } from "vitest";
import {
  createInitialMaidenState,
  updateMaiden,
  canSeePlayer,
  capSimultaneousChasers,
  MaidenState,
  ATTACK_COOLDOWN_S,
  LOST_SEARCH_DURATION_S,
  MAX_SIMULTANEOUS_CHASERS,
} from "../src/entities/maiden";

describe("maiden FSM", () => {
  it("초기 상태는 배회", () => {
    const m = createInitialMaidenState(0, 0);
    expect(m.state).toBe(MaidenState.Wander);
  });

  it("배회 중 소리를 들으면 경계로 전환", () => {
    let m = createInitialMaidenState(0, 0);
    m = updateMaiden(m, { dt: 0.1, player: { x: 100, z: 100 }, heardNoise: { x: 5, z: 5 } });
    expect(m.state).toBe(MaidenState.Alert);
    expect(m.targetX).toBe(5);
  });

  it("canSeePlayer: 범위 밖이면 false", () => {
    expect(canSeePlayer({ x: 0, z: 0 }, 0, { x: 0, z: 100 })).toBe(false);
  });

  it("canSeePlayer: 정면 원뿔 안이면 true", () => {
    // facingYaw=0은 +z 방향을 바라본다고 가정(atan2(dx,dz) 규약과 일치)
    expect(canSeePlayer({ x: 0, z: 0 }, 0, { x: 0, z: 10 })).toBe(true);
  });

  it("canSeePlayer: 원뿔 밖(측면)이면 false", () => {
    expect(canSeePlayer({ x: 0, z: 0 }, 0, { x: 10, z: 0 })).toBe(false);
  });

  it("경계 상태에서 시야 확보 시 추격으로 전환", () => {
    let m = createInitialMaidenState(0, 0);
    m = { ...m, state: MaidenState.Alert, targetX: 0, targetZ: 5 };
    m = updateMaiden(m, { dt: 0.1, player: { x: 0, z: 5 }, facingYaw: 0 });
    expect(m.state).toBe(MaidenState.Chase);
  });

  it("추격 상태에서 접촉 거리 이내면 공격으로 전환하고 쿨다운 설정", () => {
    let m = createInitialMaidenState(0, 0);
    m = { ...m, state: MaidenState.Chase };
    m = updateMaiden(m, { dt: 0.1, player: { x: 1, z: 0 }, facingYaw: Math.PI / 2 });
    expect(m.state).toBe(MaidenState.Attack);
    expect(m.attackCooldown).toBe(ATTACK_COOLDOWN_S);
  });

  it("추격 중 시야를 잃으면 상실 상태로 전환되고 수색 타이머 설정", () => {
    let m = createInitialMaidenState(0, 0);
    m = { ...m, state: MaidenState.Chase, targetX: 3, targetZ: 3 };
    // 플레이어가 시야 범위 밖(100m)에 있어 sees=false
    m = updateMaiden(m, { dt: 0.1, player: { x: 100, z: 100 }, facingYaw: 0 });
    expect(m.state).toBe(MaidenState.Lost);
    expect(m.lostTimer).toBe(LOST_SEARCH_DURATION_S);
  });

  it("상실 상태에서 시간 초과 시 배회로 복귀", () => {
    let m = createInitialMaidenState(0, 0);
    m = { ...m, state: MaidenState.Lost, lostTimer: 0.05, targetX: 0, targetZ: 0 };
    m = updateMaiden(m, { dt: 0.1, player: { x: 100, z: 100 } });
    expect(m.state).toBe(MaidenState.Wander);
  });

  it("공격 쿨다운 종료 후 시야 있으면 추격 재개", () => {
    let m = createInitialMaidenState(0, 0);
    m = { ...m, state: MaidenState.Attack, attackCooldown: 0.05 };
    m = updateMaiden(m, { dt: 0.1, player: { x: 0, z: 5 }, facingYaw: 0 });
    expect(m.state).toBe(MaidenState.Chase);
  });

  it("capSimultaneousChasers: 4명 초과분은 배회로 강제 전환", () => {
    const maidens = Array.from({ length: 6 }, (_, i) =>
      createInitialMaidenState(i, i)
    ).map((m) => ({ ...m, state: MaidenState.Chase }));
    const capped = capSimultaneousChasers(maidens);
    const chasing = capped.filter((m) => m.state === MaidenState.Chase);
    expect(chasing.length).toBe(MAX_SIMULTANEOUS_CHASERS);
  });
});
