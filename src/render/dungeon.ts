// 던전 오프닝 렌더링 (GDD B18). 어두운 상자 지오메트리 + 뿔의 빛 + 미약한 앰비언트.

import * as THREE from "three";
import type { DungeonLayout, DungeonRoom } from "../gen/dungeon";
import { CEILING_HEIGHT_M } from "../gen/dungeon";

const WALL_COLOR = 0x1a1410;
const FLOOR_COLOR = 0x0f0d0a;
const DOOR_COLOR = 0x5a3a1e;

export interface DungeonScene {
  group: THREE.Group;
  doorMesh: THREE.Mesh;
  hornLight: THREE.PointLight;
  ambient: THREE.AmbientLight;
}

function buildRoomBox(room: DungeonRoom): THREE.Group {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: WALL_COLOR, side: THREE.BackSide });
  const floorMat = new THREE.MeshStandardMaterial({ color: FLOOR_COLOR });

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(room.width, CEILING_HEIGHT_M, room.depth),
    wallMat
  );
  box.position.set(room.x, CEILING_HEIGHT_M / 2, room.z);
  group.add(box);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(room.width, room.depth), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(room.x, 0, room.z);
  group.add(floor);

  return group;
}

/** 던전 레이아웃으로부터 어두운 씬 요소를 생성한다. */
export function createDungeonScene(layout: DungeonLayout): DungeonScene {
  const group = new THREE.Group();
  for (const room of layout.rooms) {
    group.add(buildRoomBox(room));
  }

  const doorGeo = new THREE.BoxGeometry(0.2, CEILING_HEIGHT_M * 0.9, 1.2);
  const doorMat = new THREE.MeshStandardMaterial({ color: DOOR_COLOR });
  const doorMesh = new THREE.Mesh(doorGeo, doorMat);
  doorMesh.position.set(layout.door.x, (CEILING_HEIGHT_M * 0.9) / 2, layout.door.z);
  group.add(doorMesh);

  const ambient = new THREE.AmbientLight(0xffffff, 0.12); // 미약한 앰비언트(GDD B18: 없음에 가까움)
  const hornLight = new THREE.PointLight(0xfff6d8, 0, 15); // 평소 꺼짐(강도 0), Q키로 3초 점등
  group.add(ambient, hornLight);

  return { group, doorMesh, hornLight, ambient };
}

/** 문을 부순 뒤 씬에서 제거한다. */
export function breakDoor(scene: DungeonScene): void {
  scene.doorMesh.visible = false;
  scene.doorMesh.parent?.remove(scene.doorMesh);
}
