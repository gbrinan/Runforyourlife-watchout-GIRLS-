import { describe, it, expect } from "vitest";
import { createRng, hashSeed, combineSeed, randInt, randRange } from "../src/core/rng";

describe("rng", () => {
  it("같은 시드는 같은 시퀀스를 만든다", () => {
    const a = createRng("hello");
    const b = createRng("hello");
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("다른 시드는 다른 시퀀스를 만든다", () => {
    const a = createRng("hello");
    const b = createRng("world");
    const seqA = Array.from({ length: 5 }, () => a());
    const seqB = Array.from({ length: 5 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });

  it("값은 항상 0 이상 1 미만이다", () => {
    const rng = createRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("hashSeed는 결정론적이다", () => {
    expect(hashSeed("abc")).toBe(hashSeed("abc"));
    expect(hashSeed("abc")).not.toBe(hashSeed("abd"));
  });

  it("combineSeed는 n에 따라 다른 시드를 만든다", () => {
    expect(combineSeed("S", 1)).not.toBe(combineSeed("S", 2));
    expect(combineSeed("S", 1)).toBe(combineSeed("S", 1));
  });

  it("randRange는 범위 안의 값을 반환한다", () => {
    const rng = createRng("range-test");
    for (let i = 0; i < 100; i++) {
      const v = randRange(rng, 5, 10);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThan(10);
    }
  });

  it("randInt는 min과 max를 포함하는 정수를 반환한다", () => {
    const rng = createRng("int-test");
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const v = randInt(rng, 1, 3);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(3);
      seen.add(v);
    }
    expect(seen.has(1)).toBe(true);
    expect(seen.has(3)).toBe(true);
  });
});
