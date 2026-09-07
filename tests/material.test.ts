import { describe, it, expect } from "vitest";
import { generateHeightmap } from "../src/gen/heightmap";
import {
  createMaterialContext,
  getMaterial,
  distanceToGuaranteedPath,
  isImpassable,
  Material,
  MATERIAL_NOISE_MULTIPLIER,
} from "../src/gen/material";

describe("material", () => {
  it("distanceToGuaranteedPath는 대각선 위에서 0을 반환한다", () => {
    expect(distanceToGuaranteedPath(10, 10, 100)).toBeCloseTo(0);
    expect(distanceToGuaranteedPath(50, 50, 100)).toBeCloseTo(0);
  });

  it("distanceToGuaranteedPath는 대각선에서 멀수록 커진다", () => {
    const near = distanceToGuaranteedPath(10, 12, 100);
    const far = distanceToGuaranteedPath(10, 50, 100);
    expect(far).toBeGreaterThan(near);
  });

  it("같은 좌표에서 항상 같은 재질을 반환한다 (결정론)", () => {
    const map = generateHeightmap("material-det", 64);
    const ctx = createMaterialContext(map, "material-det");
    const m1 = getMaterial(ctx, 20, 30);
    const m2 = getMaterial(ctx, 20, 30);
    expect(m1).toBe(m2);
  });

  it("보장 경로(대각선) 근처 저지대는 여울(shallow water)이다", () => {
    const size = 64;
    const map = generateHeightmap("path-test", size);
    // 높이맵 값을 인위적으로 조작해 저지대를 만든다
    for (let i = 0; i < map.data.length; i++) map.data[i] = 1; // h가 매우 낮음
    const ctx = createMaterialContext(map, "path-test");
    const onPath = getMaterial(ctx, 32, 32); // 대각선 위
    expect(onPath).toBe(Material.ShallowWater);
  });

  it("보장 경로에서 먼 저지대는 깊은 물이며 통과 불가다", () => {
    const size = 64;
    const map = generateHeightmap("deepwater-test", size);
    for (let i = 0; i < map.data.length; i++) map.data[i] = 1;
    const ctx = createMaterialContext(map, "deepwater-test");
    const offPath = getMaterial(ctx, 5, 60); // 대각선에서 멀리 떨어짐
    expect(offPath).toBe(Material.DeepWater);
    expect(isImpassable(offPath)).toBe(true);
  });

  it("보장 경로 위(저지대 아님)는 흙(dirt)이다", () => {
    const size = 64;
    const map = generateHeightmap("dirt-test", size);
    for (let i = 0; i < map.data.length; i++) map.data[i] = 30; // 중간 높이(물 아님)
    const ctx = createMaterialContext(map, "dirt-test");
    const onPath = getMaterial(ctx, 32, 32);
    expect(onPath).toBe(Material.Dirt);
  });

  it("소음 배율 값이 GDD B4와 일치한다", () => {
    expect(MATERIAL_NOISE_MULTIPLIER[Material.Grass]).toBe(0.5);
    expect(MATERIAL_NOISE_MULTIPLIER[Material.Dirt]).toBe(1.0);
    expect(MATERIAL_NOISE_MULTIPLIER[Material.Gravel]).toBe(1.5);
    expect(MATERIAL_NOISE_MULTIPLIER[Material.ShallowWater]).toBe(2.0);
  });
});
