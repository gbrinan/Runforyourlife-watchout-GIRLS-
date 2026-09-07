import { describe, it, expect } from "vitest";
import { Gait } from "../src/entities/unicorn";
import {
  GAIT_RHYTHMS,
  getHoofbeatsInInterval,
  computeBobOffsetMeters,
  GAIT_BOB_AMPLITUDE_CM,
} from "../src/audio/hooves";

describe("hooves timing", () => {
  it("서행은 4박, 주기 1.0s를 가진다", () => {
    const rhythm = GAIT_RHYTHMS[Gait.Walk];
    expect(rhythm.period).toBe(1.0);
    expect(rhythm.beatOffsets.length).toBe(4);
  });

  it("속보는 2박, 주기 0.6s를 가진다", () => {
    const rhythm = GAIT_RHYTHMS[Gait.Trot];
    expect(rhythm.period).toBe(0.6);
    expect(rhythm.beatOffsets.length).toBe(2);
  });

  it("구보는 3박, 주기 0.5s를 가진다", () => {
    const rhythm = GAIT_RHYTHMS[Gait.Canter];
    expect(rhythm.period).toBe(0.5);
    expect(rhythm.beatOffsets.length).toBe(3);
  });

  it("질주는 4박 불균등, 주기 0.42s를 가진다", () => {
    const rhythm = GAIT_RHYTHMS[Gait.Gallop];
    expect(rhythm.period).toBeCloseTo(0.42);
    expect(rhythm.beatOffsets.length).toBe(4);
    // 불균등: 값이 모두 달라야 한다
    const uniqueOffsets = new Set(rhythm.beatOffsets.map((v) => v.toFixed(4)));
    expect(uniqueOffsets.size).toBe(4);
  });

  it("getHoofbeatsInInterval은 한 사이클 안에서 박자 수만큼 반환한다", () => {
    const beats = getHoofbeatsInInterval(Gait.Walk, 0, 1.0);
    expect(beats.length).toBe(4);
  });

  it("getHoofbeatsInInterval은 여러 사이클을 넘어가도 정확하다", () => {
    const beats = getHoofbeatsInInterval(Gait.Trot, 0, 1.8); // 3 cycles of 0.6s
    expect(beats.length).toBe(6);
  });

  it("getHoofbeatsInInterval은 경과시간이 감소하면 빈 배열을 반환한다", () => {
    const beats = getHoofbeatsInInterval(Gait.Walk, 1.0, 0.5);
    expect(beats).toEqual([]);
  });

  it("getHoofbeatsInInterval은 구간을 겹치지 않게 반환한다 (누적 호출 시 중복 없음)", () => {
    const b1 = getHoofbeatsInInterval(Gait.Walk, 0, 0.5);
    const b2 = getHoofbeatsInInterval(Gait.Walk, 0.5, 1.0);
    const combined = [...b1, ...b2];
    const full = getHoofbeatsInInterval(Gait.Walk, 0, 1.0);
    expect(combined.length).toBe(full.length);
  });

  it("computeBobOffsetMeters는 보법별 진폭 범위 안에서 값을 반환한다", () => {
    for (const gait of [Gait.Walk, Gait.Trot, Gait.Canter, Gait.Gallop]) {
      const maxAmpM = GAIT_BOB_AMPLITUDE_CM[gait] / 100;
      for (let t = 0; t < 2; t += 0.1) {
        const bob = computeBobOffsetMeters(gait, t);
        expect(bob).toBeGreaterThanOrEqual(0);
        expect(bob).toBeLessThanOrEqual(maxAmpM + 1e-9);
      }
    }
  });

  it("bob 진폭은 GDD 표(2/5/8/12cm)와 일치한다", () => {
    expect(GAIT_BOB_AMPLITUDE_CM[Gait.Walk]).toBe(2);
    expect(GAIT_BOB_AMPLITUDE_CM[Gait.Trot]).toBe(5);
    expect(GAIT_BOB_AMPLITUDE_CM[Gait.Canter]).toBe(8);
    expect(GAIT_BOB_AMPLITUDE_CM[Gait.Gallop]).toBe(12);
  });
});
