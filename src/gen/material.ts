// 지형 재질 판정 (GDD B4).
// h<0.12 물(경로 위는 여울, 그 외 깊은 물) / 보장 경로 3 m 이내 흙 /
// s>0.8 또는 n>0.9 자갈 / 나머지 풀 (초원이 기준선이 되도록 완화)
// M0 범위: "보장 경로"는 남서(0,0) -> 북동(size,size) 직선으로 단순화한다.

import type { Heightmap } from "./heightmap";
import { getNormalizedHeight, getSlope } from "./heightmap";
import { SimplexNoise2D } from "./simplex";
import { createRng } from "../core/rng";

export enum Material {
  Grass = "grass",
  Dirt = "dirt",
  Gravel = "gravel",
  ShallowWater = "shallow_water",
  DeepWater = "deep_water",
}

/** 소음 배율 (GDD B4). 깊은 물은 통과 불가이므로 배율 정의는 하되 사용되지 않는다. */
export const MATERIAL_NOISE_MULTIPLIER: Record<Material, number> = {
  [Material.Grass]: 0.5,
  [Material.Dirt]: 1.0,
  [Material.Gravel]: 1.5,
  [Material.ShallowWater]: 2.0,
  [Material.DeepWater]: Infinity,
};

/**
 * 점 (x, y)와 남서->북동 대각선 사이의 수직 거리(m)를 계산한다.
 * 직선: y = x (grid가 정사각형이라고 가정).
 */
export function distanceToGuaranteedPath(
  x: number,
  y: number,
  size: number
): number {
  // 직선 x - y = 0 에 대한 점과 직선 사이 거리 공식: |x - y| / sqrt(2)
  return Math.abs(x - y) / Math.SQRT2;
}

export interface MaterialContext {
  map: Heightmap;
  /** 보조 노이즈 생성기 (자갈 판정용, n 값) */
  auxNoise: SimplexNoise2D;
}

export function createMaterialContext(
  map: Heightmap,
  seed: string | number
): MaterialContext {
  const rng = createRng(`${seed}:aux-material`);
  return { map, auxNoise: new SimplexNoise2D(rng) };
}

/**
 * (x, y) 지점의 재질을 판정한다 (GDD B4 규칙, M0에서는 직선 경로로 근사).
 */
export function getMaterial(ctx: MaterialContext, x: number, y: number): Material {
  const { map, auxNoise } = ctx;
  const h = getNormalizedHeight(map, x, y);
  const s = getSlope(map, x, y);
  const n = (auxNoise.noise2D(x * 0.05, y * 0.05) + 1) / 2; // [0,1] 정규화

  const onPath = distanceToGuaranteedPath(x, y, map.size) <= 3;

  if (h < 0.12) {
    return onPath ? Material.ShallowWater : Material.DeepWater;
  }
  if (onPath) {
    return Material.Dirt;
  }
  if (s > 0.8 || n > 0.9) {
    return Material.Gravel;
  }
  return Material.Grass;
}

/** 깊은 물인지 여부 (통과 불가 판정에 사용). */
export function isImpassable(material: Material): boolean {
  return material === Material.DeepWater;
}
