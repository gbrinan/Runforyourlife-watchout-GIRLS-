import { describe, it, expect } from "vitest";
import {
  createInitialHornLightState,
  canActivateHornLight,
  activateHornLight,
  updateHornLight,
  isHornLightOn,
  HORN_LIGHT_DURATION_S,
  HORN_LIGHT_COOLDOWN_S,
} from "../src/entities/hornlight";

describe("horn light", () => {
  it("초기 상태는 꺼짐, 활성화 가능", () => {
    const s = createInitialHornLightState();
    expect(isHornLightOn(s)).toBe(false);
    expect(canActivateHornLight(s)).toBe(true);
  });

  it("활성화하면 3초 점등", () => {
    let s = activateHornLight(createInitialHornLightState());
    expect(s.activeRemaining).toBe(HORN_LIGHT_DURATION_S);
    expect(isHornLightOn(s)).toBe(true);
  });

  it("점등 중에는 재활성화 불가", () => {
    let s = activateHornLight(createInitialHornLightState());
    const before = s.activeRemaining;
    s = activateHornLight(s);
    expect(s.activeRemaining).toBe(before);
  });

  it("점등 종료 후 쿨다운 시작", () => {
    let s = activateHornLight(createInitialHornLightState());
    s = updateHornLight(s, HORN_LIGHT_DURATION_S + 0.01);
    expect(isHornLightOn(s)).toBe(false);
    expect(s.cooldownRemaining).toBeCloseTo(HORN_LIGHT_COOLDOWN_S, 1);
  });

  it("쿨다운 중에는 활성화 불가", () => {
    let s = activateHornLight(createInitialHornLightState());
    s = updateHornLight(s, HORN_LIGHT_DURATION_S + 0.01);
    expect(canActivateHornLight(s)).toBe(false);
  });

  it("쿨다운 종료 후 다시 활성화 가능", () => {
    let s = activateHornLight(createInitialHornLightState());
    s = updateHornLight(s, HORN_LIGHT_DURATION_S + HORN_LIGHT_COOLDOWN_S + 0.01);
    expect(canActivateHornLight(s)).toBe(true);
  });
});
