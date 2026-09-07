import { describe, it, expect } from "vitest";
import {
  createInitialStaminaState,
  updateStamina,
  getMaxAllowedGait,
  clampGaitByStamina,
  getCameraShakeMultiplier,
  STAMINA_MAX,
  STAMINA_MIN,
} from "../src/entities/stamina";
import { Gait } from "../src/entities/unicorn";

describe("stamina system", () => {
  it("초기값은 100, 미고갈 상태", () => {
    const s = createInitialStaminaState();
    expect(s.value).toBe(STAMINA_MAX);
    expect(s.depleted).toBe(false);
  });

  it("질주 1초 = -12", () => {
    const s = updateStamina(createInitialStaminaState(), Gait.Gallop, 1);
    expect(s.value).toBeCloseTo(88);
  });

  it("구보 1초 = -3", () => {
    const s = updateStamina(createInitialStaminaState(), Gait.Canter, 1);
    expect(s.value).toBeCloseTo(97);
  });

  it("속보 이하는 1초당 +8, 최대 100 clamp", () => {
    const s = updateStamina(createInitialStaminaState(), Gait.Trot, 1);
    expect(s.value).toBe(STAMINA_MAX);
  });

  it("0 이하로 내려가지 않는다(clamp)", () => {
    let s = createInitialStaminaState();
    for (let i = 0; i < 20; i++) s = updateStamina(s, Gait.Gallop, 1);
    expect(s.value).toBe(STAMINA_MIN);
    expect(s.depleted).toBe(true);
  });

  it("고갈 후 최대 보법은 속보로 제한된다", () => {
    let s = createInitialStaminaState();
    for (let i = 0; i < 20; i++) s = updateStamina(s, Gait.Gallop, 1);
    expect(getMaxAllowedGait(s)).toBe(Gait.Trot);
  });

  it("미고갈 상태 최대 보법은 질주", () => {
    const s = createInitialStaminaState();
    expect(getMaxAllowedGait(s)).toBe(Gait.Gallop);
  });

  it("clampGaitByStamina: 고갈 시 질주 요청을 속보로 제한", () => {
    let s = createInitialStaminaState();
    for (let i = 0; i < 20; i++) s = updateStamina(s, Gait.Gallop, 1);
    expect(clampGaitByStamina(Gait.Gallop, s)).toBe(Gait.Trot);
    expect(clampGaitByStamina(Gait.Walk, s)).toBe(Gait.Walk);
  });

  it("회복 중 0을 벗어나면 depleted 해제", () => {
    let s = createInitialStaminaState();
    for (let i = 0; i < 20; i++) s = updateStamina(s, Gait.Gallop, 1);
    expect(s.depleted).toBe(true);
    s = updateStamina(s, Gait.Walk, 1);
    expect(s.depleted).toBe(false);
  });

  it("카메라 흔들림: 30 이하부터 1.5배, 초과는 1배", () => {
    expect(getCameraShakeMultiplier({ value: 30, depleted: false })).toBe(1.5);
    expect(getCameraShakeMultiplier({ value: 31, depleted: false })).toBe(1);
    expect(getCameraShakeMultiplier({ value: 0, depleted: true })).toBe(1.5);
  });
});
