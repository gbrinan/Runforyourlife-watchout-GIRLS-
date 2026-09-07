import { describe, it, expect } from "vitest";
import {
  createInitialUnicornState,
  upshiftGait,
  downshiftGait,
  updateUnicornState,
  getMaxTurnDegrees,
  Gait,
  GAIT_SPEED,
  GAIT_TRANSITION_DURATION,
  GALLOP_STOP_SLIDE_DISTANCE,
} from "../src/entities/unicorn";

describe("unicorn gait state machine", () => {
  it("초기 상태는 서행이다", () => {
    const s = createInitialUnicornState();
    expect(s.gait).toBe(Gait.Walk);
    expect(s.currentSpeed).toBe(0);
  });

  it("upshiftGait는 보법을 한 단계 올린다", () => {
    let s = createInitialUnicornState();
    s = upshiftGait(s);
    expect(s.gait).toBe(Gait.Trot);
    s = upshiftGait(s);
    expect(s.gait).toBe(Gait.Canter);
    s = upshiftGait(s);
    expect(s.gait).toBe(Gait.Gallop);
  });

  it("질주에서 더 올릴 수 없다", () => {
    let s = createInitialUnicornState();
    s = upshiftGait(upshiftGait(upshiftGait(s)));
    const before = s.gait;
    s = upshiftGait(s);
    expect(s.gait).toBe(before);
  });

  it("downshiftGait는 보법을 한 단계 내린다", () => {
    let s = createInitialUnicornState();
    s = upshiftGait(upshiftGait(s)); // canter
    s = downshiftGait(s);
    expect(s.gait).toBe(Gait.Trot);
  });

  it("서행에서 더 내릴 수 없다", () => {
    let s = createInitialUnicornState();
    s = downshiftGait(s);
    expect(s.gait).toBe(Gait.Walk);
  });

  it("질주에서 하강하면 미끄러짐이 발생한다", () => {
    let s = createInitialUnicornState();
    s = upshiftGait(upshiftGait(upshiftGait(s))); // gallop
    s = downshiftGait(s); // -> canter, but sliding
    expect(s.sliding).toBe(true);
    expect(s.slideRemainingDistance).toBe(GALLOP_STOP_SLIDE_DISTANCE);
  });

  it("질주가 아닌 상태에서 하강하면 미끄러지지 않는다", () => {
    let s = createInitialUnicornState();
    s = upshiftGait(s); // trot
    s = downshiftGait(s); // walk
    expect(s.sliding).toBe(false);
  });

  it("보법 전환은 0.6초 선형 가속으로 목표 속도에 도달한다", () => {
    let s = createInitialUnicornState();
    s = upshiftGait(s); // walk -> trot, target 3.0
    // 전환 시간만큼 여러 스텝으로 나눠 진행
    const dt = 0.1;
    let steps = 0;
    while (s.transitionRemaining > 0 && steps < 100) {
      const result = updateUnicornState(s, dt);
      s = result.state;
      steps++;
    }
    expect(s.currentSpeed).toBeCloseTo(GAIT_SPEED[Gait.Trot], 1);
    expect(steps).toBeGreaterThanOrEqual(Math.floor(GAIT_TRANSITION_DURATION / dt));
  });

  it("정상 주행 중에는 목표 속도만큼 이동한다", () => {
    let s = createInitialUnicornState();
    // 전환 없이 이미 목표 속도에 도달한 상태를 시뮬레이션
    const result = updateUnicornState(s, 10); // walk, target 1.5, 충분히 긴 시간
    expect(result.state.currentSpeed).toBeCloseTo(GAIT_SPEED[Gait.Walk], 5);
  });

  it("미끄러지는 동안 총 이동 거리가 GALLOP_STOP_SLIDE_DISTANCE에 근접한다", () => {
    let s = createInitialUnicornState();
    s = upshiftGait(upshiftGait(upshiftGait(s))); // gallop
    // 충분히 오래 질주 상태를 진행시켜 전환을 끝낸다
    for (let i = 0; i < 20; i++) {
      s = updateUnicornState(s, 0.1).state;
    }
    s = downshiftGait(s); // canter로 하강 -> sliding
    let totalDistance = 0;
    for (let i = 0; i < 50; i++) {
      const result = updateUnicornState(s, 0.05);
      s = result.state;
      totalDistance += result.distanceMoved;
      if (!s.sliding) break;
    }
    expect(totalDistance).toBeGreaterThan(0);
    expect(totalDistance).toBeLessThanOrEqual(GALLOP_STOP_SLIDE_DISTANCE + 0.5);
  });

  it("getMaxTurnDegrees는 구보/질주에서 상한이 있다", () => {
    let s = createInitialUnicornState();
    s = upshiftGait(upshiftGait(s)); // canter
    expect(getMaxTurnDegrees(s, 1)).toBe(90);
    s = upshiftGait(s); // gallop
    expect(getMaxTurnDegrees(s, 1)).toBe(45);
  });

  it("getMaxTurnDegrees는 서행/속보에서 무제한이다", () => {
    const s = createInitialUnicornState(); // walk
    expect(getMaxTurnDegrees(s, 1)).toBe(Infinity);
  });
});
