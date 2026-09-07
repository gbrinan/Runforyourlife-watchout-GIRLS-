// 처녀(힐) 로우폴리 프로시저럴 메시 (GDD B5, B13).
// 실루엣과 빨간 눈만 명확하면 충분하다: 상자 몸통 + 원뿔 드레스 + 구체 눈 2개.

import * as THREE from "three";

export interface MaidenMesh {
  group: THREE.Group;
  leftEye: THREE.Mesh;
  rightEye: THREE.Mesh;
}

const BODY_HEIGHT_M = 1.7;
const DRESS_HEIGHT_M = 1.1;
const DRESS_RADIUS_M = 0.5;
const HEAD_RADIUS_M = 0.18;

/** 처녀 로우폴리 메시를 생성한다. group.position을 이동시켜 배치한다. */
export function createMaidenMesh(): MaidenMesh {
  const group = new THREE.Group();

  const dressGeo = new THREE.ConeGeometry(DRESS_RADIUS_M, DRESS_HEIGHT_M, 8);
  const dressMat = new THREE.MeshStandardMaterial({ color: 0x2a1f33, roughness: 0.9 });
  const dress = new THREE.Mesh(dressGeo, dressMat);
  dress.position.y = DRESS_HEIGHT_M / 2;
  group.add(dress);

  const bodyGeo = new THREE.BoxGeometry(0.3, BODY_HEIGHT_M - DRESS_HEIGHT_M, 0.2);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd9c7b8, roughness: 0.8 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = DRESS_HEIGHT_M + (BODY_HEIGHT_M - DRESS_HEIGHT_M) / 2;
  group.add(body);

  const eyeGeo = new THREE.SphereGeometry(0.04, 6, 6);
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 2,
  });
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  const rightEye = new THREE.Mesh(eyeGeo.clone(), eyeMat.clone());
  const eyeY = BODY_HEIGHT_M - 0.1;
  leftEye.position.set(-0.06, eyeY, 0.11);
  rightEye.position.set(0.06, eyeY, 0.11);
  group.add(leftEye, rightEye);

  return { group, leftEye, rightEye };
}

/** 메시 위치를 (x, groundY, z)로 갱신한다. */
export function updateMaidenMeshPosition(
  mesh: MaidenMesh,
  x: number,
  groundY: number,
  z: number,
  facingYaw: number
): void {
  mesh.group.position.set(x, groundY, z);
  mesh.group.rotation.y = facingYaw;
}
