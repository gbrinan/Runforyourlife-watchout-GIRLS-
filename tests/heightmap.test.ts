import { describe, it, expect } from "vitest";
import {
  generateHeightmap,
  getHeight,
  getSlope,
  getNormalizedHeight,
  HEIGHTMAP_MAX_HEIGHT,
} from "../src/gen/heightmap";

describe("heightmap", () => {
  it("같은 시드는 같은 높이맵을 생성한다", () => {
    const a = generateHeightmap("seed-1", 32);
    const b = generateHeightmap("seed-1", 32);
    expect(Array.from(a.data)).toEqual(Array.from(b.data));
  });

  it("다른 시드는 다른 높이맵을 생성한다", () => {
    const a = generateHeightmap("seed-1", 32);
    const b = generateHeightmap("seed-2", 32);
    expect(Array.from(a.data)).not.toEqual(Array.from(b.data));
  });

  it("모든 높이는 0~maxHeight 범위 안에 있다", () => {
    const map = generateHeightmap("bounds-test", 64);
    for (const h of map.data) {
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(HEIGHTMAP_MAX_HEIGHT);
    }
  });

  it("size는 요청한 값과 같다", () => {
    const map = generateHeightmap("size-test", 128);
    expect(map.size).toBe(128);
    expect(map.data.length).toBe(128 * 128);
  });

  it("getHeight는 범위 밖 좌표에 대해 0을 반환한다", () => {
    const map = generateHeightmap("oob-test", 16);
    expect(getHeight(map, -1, 0)).toBe(0);
    expect(getHeight(map, 0, -1)).toBe(0);
    expect(getHeight(map, 16, 0)).toBe(0);
    expect(getHeight(map, 0, 16)).toBe(0);
  });

  it("getNormalizedHeight는 0~1 범위를 반환한다", () => {
    const map = generateHeightmap("norm-test", 32);
    for (let y = 0; y < 32; y += 4) {
      for (let x = 0; x < 32; x += 4) {
        const n = getNormalizedHeight(map, x, y);
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(1);
      }
    }
  });

  it("getSlope는 음수가 아니다", () => {
    const map = generateHeightmap("slope-test", 32);
    for (let y = 0; y < 31; y++) {
      for (let x = 0; x < 31; x++) {
        expect(getSlope(map, x, y)).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
