// 프로시저럴 높이맵 생성 (GDD B13).
// 512x512 그리드, 1 m 셀, 진폭 0~60 m.

import { createRng } from "../core/rng";
import { SimplexNoise2D } from "./simplex";

export const HEIGHTMAP_SIZE = 512;
export const HEIGHTMAP_MAX_HEIGHT = 60;

export interface Heightmap {
  size: number;
  /** row-major Float32Array, 길이 size*size. 값 범위 0~HEIGHTMAP_MAX_HEIGHT */
  data: Float32Array;
}

/**
 * 시드로부터 결정론적 높이맵을 생성한다.
 * 같은 시드는 항상 같은 높이맵을 만든다.
 */
export function generateHeightmap(
  seed: string | number,
  size: number = HEIGHTMAP_SIZE,
  maxHeight: number = HEIGHTMAP_MAX_HEIGHT
): Heightmap {
  const rng = createRng(seed);
  const noise = new SimplexNoise2D(rng);
  const data = new Float32Array(size * size);

  // 노이즈 좌표 스케일: 그리드 전체가 몇 개의 "언덕"을 포함하도록 조정
  const scale = 1 / 96;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = noise.fbm(x * scale, y * scale, 5, 2, 0.5); // [-1, 1]
      const normalized = (n + 1) / 2; // [0, 1]
      data[y * size + x] = normalized * maxHeight;
    }
  }

  return { size, data };
}

/** (x, y) 셀의 높이를 반환한다. 범위 밖이면 0. */
export function getHeight(map: Heightmap, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= map.size || y >= map.size) return 0;
  return map.data[Math.floor(y) * map.size + Math.floor(x)];
}

/**
 * (x, y) 지점의 경사(인접 셀 높이차 / 1 m)를 계산한다 (GDD B4, B13).
 * 경계에서는 안쪽 이웃만 사용한다.
 */
export function getSlope(map: Heightmap, x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const h = getHeight(map, xi, yi);
  const hx = xi + 1 < map.size ? getHeight(map, xi + 1, yi) : h;
  const hy = yi + 1 < map.size ? getHeight(map, xi, yi + 1) : h;
  const dx = Math.abs(hx - h);
  const dy = Math.abs(hy - h);
  return Math.max(dx, dy);
}

/** 높이를 0~1로 정규화한 값을 반환한다 (재질 판정용). */
export function getNormalizedHeight(
  map: Heightmap,
  x: number,
  y: number,
  maxHeight: number = HEIGHTMAP_MAX_HEIGHT
): number {
  return getHeight(map, x, y) / maxHeight;
}
