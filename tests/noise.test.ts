import { describe, it, expect } from "vitest";
import {
  computeFinalNoiseRadius,
  computeHoofbeatNoiseRadius,
  createNoiseBus,
  distance2D,
  isWithinNoiseRadius,
  NOISE_CUTOFF_RADIUS_M,
} from "../src/systems/noise";
import { Gait } from "../src/entities/unicorn";

describe("noise system", () => {
  it("절사: 서행+풀밭(6*0.5=3)은 완전 무음(0) (GDD B4 예시)", () => {
    expect(computeFinalNoiseRadius(6, 0.5)).toBe(0);
  });

  it("3m 초과는 절사되지 않는다", () => {
    expect(computeFinalNoiseRadius(6, 0.6)).toBeCloseTo(3.6);
  });

  it("흙 위 서행은 6m 그대로", () => {
    expect(computeFinalNoiseRadius(6, 1.0)).toBe(6);
  });

  it("computeHoofbeatNoiseRadius: 질주+자갈 = 40*1.5=60", () => {
    expect(computeHoofbeatNoiseRadius(Gait.Gallop, 1.5)).toBe(60);
  });

  it("computeHoofbeatNoiseRadius: 서행+풀 = 0(무음)", () => {
    expect(computeHoofbeatNoiseRadius(Gait.Walk, 0.5)).toBe(0);
  });

  it("distance2D 계산", () => {
    expect(distance2D(0, 0, 3, 4)).toBe(5);
  });

  it("isWithinNoiseRadius: 반경 안/밖 판정", () => {
    const ev = { x: 0, z: 0, radius: 10, time: 0 };
    expect(isWithinNoiseRadius(ev, 5, 0)).toBe(true);
    expect(isWithinNoiseRadius(ev, 11, 0)).toBe(false);
  });

  it("NoiseBus: 구독자에게 이벤트 전파", () => {
    const bus = createNoiseBus();
    const received: number[] = [];
    const unsub = bus.subscribe((e) => received.push(e.radius));
    bus.emit({ x: 0, z: 0, radius: 10, time: 1 });
    expect(received).toEqual([10]);
    unsub();
    bus.emit({ x: 0, z: 0, radius: 10, time: 2 });
    expect(received).toEqual([10]); // 구독 해제 후에는 수신 안 함
  });

  it("NoiseBus: radius=0 이벤트는 전파하지 않는다", () => {
    const bus = createNoiseBus();
    const received: number[] = [];
    bus.subscribe((e) => received.push(e.radius));
    bus.emit({ x: 0, z: 0, radius: 0, time: 1 });
    expect(received).toEqual([]);
  });

  it("NOISE_CUTOFF_RADIUS_M은 3이다", () => {
    expect(NOISE_CUTOFF_RADIUS_M).toBe(3);
  });
});
