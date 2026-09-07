// 높이맵으로부터 정점 색상이 입혀진 지형 메시를 생성한다 (GDD B10, C).
// 파스텔 초원 팔레트 + 채도 높은 그림자(보라/적색 계열은 그림자 톤으로 은은하게 섞음).

import * as THREE from "three";
import type { Heightmap } from "../gen/heightmap";
import { getHeight } from "../gen/heightmap";
import { Material, createMaterialContext, getMaterial } from "../gen/material";

const MATERIAL_COLOR: Record<Material, THREE.Color> = {
  [Material.Grass]: new THREE.Color(0x9fe2a0), // 파스텔 초원
  [Material.Dirt]: new THREE.Color(0xe6d2a6), // 파스텔 흙
  [Material.Gravel]: new THREE.Color(0xcfc6dc), // 파스텔 회보라 자갈
  [Material.ShallowWater]: new THREE.Color(0x9fd6e6), // 파스텔 하늘색 여울
  [Material.DeepWater]: new THREE.Color(0x4a6fa5), // 짙은 물색(채도 높은 그림자 계열)
};

/** 파스텔 팔레트에 채도 높은 보라/적색 그림자를 섞어 GDD B10 톤 규칙을 반영한다. */
function applyShadowTint(color: THREE.Color, height: number, maxHeight: number): THREE.Color {
  const shadowColor = new THREE.Color(0x6a2a6a); // 채도 높은 보라 그림자
  const t = 1 - height / maxHeight; // 낮을수록 그림자 강하게
  const result = color.clone();
  result.lerp(shadowColor, Math.max(0, Math.min(0.12, t * 0.12)));
  return result;
}

export interface TerrainMeshOptions {
  /** 다운샘플링 스텝: 512 그리드 전체를 쓰면 무겁기 때문에 기본 4로 촘촘함 절충 */
  step?: number;
  seed: string | number;
}

/**
 * 높이맵으로부터 THREE.BufferGeometry 기반 지형 메시를 만든다.
 * 정점 색상은 재질 판정 규칙(B4)에 따라 결정된다.
 */
export function createTerrainMesh(
  map: Heightmap,
  opts: TerrainMeshOptions
): THREE.Mesh {
  const step = opts.step ?? 4;
  const size = map.size;
  const segCount = Math.floor((size - 1) / step);

  const geometry = new THREE.PlaneGeometry(
    size,
    size,
    segCount,
    segCount
  );
  geometry.rotateX(-Math.PI / 2);

  const materialCtx = createMaterialContext(map, opts.seed);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(position.count * 3);

  const vertsPerRow = segCount + 1;
  for (let row = 0; row < vertsPerRow; row++) {
    for (let col = 0; col < vertsPerRow; col++) {
      const gx = Math.min(size - 1, col * step);
      const gy = Math.min(size - 1, row * step);
      const h = getHeight(map, gx, gy);
      const idx = row * vertsPerRow + col;

      position.setY(idx, h);

      const mat = getMaterial(materialCtx, gx, gy);
      const baseColor = MATERIAL_COLOR[mat];
      const tinted = applyShadowTint(baseColor, h, 60);
      colors[idx * 3] = tinted.r;
      colors[idx * 3 + 1] = tinted.g;
      colors[idx * 3 + 2] = tinted.b;
    }
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
    metalness: 0.0,
  });

  const mesh = new THREE.Mesh(geometry, material);
  // 지형 원점을 (0,0)이 남서 모서리가 되도록 이동
  mesh.position.set(size / 2, 0, size / 2);
  return mesh;
}

/** 파스텔 하늘색과 부드러운 노란 조명을 위한 씬 배경/라이트 헬퍼. */
export function createPastelLighting(): THREE.Light[] {
  const hemi = new THREE.HemisphereLight(0xfff6d8, 0xbfe8a0, 2.6);
  const sun = new THREE.DirectionalLight(0xfff2c0, 2.2);
  sun.position.set(100, 150, 50);
  return [hemi, sun];
}
