import { describe, it, expect } from "vitest";
import {
  createInitialHpState,
  applyDamage,
  applyHeal,
  isGameOver,
  getGallopDurationMultiplier,
  BodyPart,
  HP_MAX,
} from "../src/entities/hp";

describe("hp system", () => {
  it("초기 hp는 3, lostParts는 비어있다", () => {
    const s = createInitialHpState();
    expect(s.hp).toBe(HP_MAX);
    expect(s.lostParts.size).toBe(0);
  });

  it("피해 1: hp 3->2, 꼬리 잃음", () => {
    const s = applyDamage(createInitialHpState(), 1);
    expect(s.hp).toBe(2);
    expect(s.lostParts.has(BodyPart.Tail)).toBe(true);
  });

  it("피해 누적: hp 3->1(꼬리+갈기 잃음)", () => {
    let s = createInitialHpState();
    s = applyDamage(s, 1);
    s = applyDamage(s, 1);
    expect(s.hp).toBe(1);
    expect(s.lostParts.has(BodyPart.Tail)).toBe(true);
    expect(s.lostParts.has(BodyPart.Mane)).toBe(true);
  });

  it("마녀 접촉(피해 2)은 hp-2, 부위 2개 추가", () => {
    const s = applyDamage(createInitialHpState(), 2);
    expect(s.hp).toBe(1);
    expect(s.lostParts.has(BodyPart.Tail)).toBe(true);
    expect(s.lostParts.has(BodyPart.Mane)).toBe(true);
  });

  it("hp 0 도달 시 All 부위 추가, 게임오버", () => {
    let s = createInitialHpState();
    s = applyDamage(s, 3);
    expect(s.hp).toBe(0);
    expect(s.lostParts.has(BodyPart.All)).toBe(true);
    expect(isGameOver(s)).toBe(true);
  });

  it("hp는 0 미만으로 내려가지 않는다", () => {
    const s = applyDamage(createInitialHpState(), 10);
    expect(s.hp).toBe(0);
  });

  it("회복은 hp만 올리고 lostParts는 유지된다", () => {
    let s = createInitialHpState();
    s = applyDamage(s, 1); // hp=2, tail lost
    s = applyHeal(s, 1); // hp=3
    expect(s.hp).toBe(3);
    expect(s.lostParts.has(BodyPart.Tail)).toBe(true); // 흉터는 남는다
  });

  it("회복은 3을 넘지 않는다", () => {
    const s = applyHeal(createInitialHpState(), 5);
    expect(s.hp).toBe(HP_MAX);
  });

  it("갈기 손실 시 질주 지속시간 배율은 0.5", () => {
    let s = createInitialHpState();
    s = applyDamage(s, 2); // tail+mane lost
    expect(getGallopDurationMultiplier(s)).toBe(0.5);
  });

  it("갈기 온전 시 배율은 1", () => {
    let s = createInitialHpState();
    s = applyDamage(s, 1); // tail만 lost
    expect(getGallopDurationMultiplier(s)).toBe(1);
  });
});
