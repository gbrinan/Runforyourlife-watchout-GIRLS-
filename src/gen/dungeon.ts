// 던전 오프닝 미니 미로 생성기 (GDD B18). 시드 기반 결정론적 3~5개 방 + 복도.
// 순수 로직: 좌표/치수만 계산하고 렌더링은 별도 모듈이 담당한다.

import { createRng, randInt, randRange } from "../core/rng";

export const DUNGEON_MIN_ROOMS = 3;
export const DUNGEON_MAX_ROOMS = 5;
export const ROOM_MIN_SIZE = 8;
export const ROOM_MAX_SIZE = 15;
export const CEILING_HEIGHT_M = 2.2;
export const CORRIDOR_WIDTH_M = 2;

export interface DungeonRoom {
  id: number;
  /** 방 중심 좌표(m) */
  x: number;
  z: number;
  width: number;
  depth: number;
}

export interface DungeonCorridor {
  /** 연결하는 두 방의 id */
  fromRoomId: number;
  toRoomId: number;
}

export interface DungeonDoor {
  /** 문이 위치한 방 id(마지막 방의 바깥벽에 배치) */
  roomId: number;
  x: number;
  z: number;
}

export interface DungeonLayout {
  rooms: DungeonRoom[];
  corridors: DungeonCorridor[];
  door: DungeonDoor;
  /** 유니콘 시작 위치(첫 방 중앙) */
  startX: number;
  startZ: number;
}

/**
 * 시드로부터 결정론적 던전 레이아웃을 생성한다.
 * 방들은 일직선(동쪽 방향)으로 순차 배치되고 각 방은 복도로 연결되어
 * 항상 모든 방이 연결된다(체인 구조). 마지막 방의 동쪽 바깥벽에 문을 둔다.
 */
export function generateDungeon(seed: string | number): DungeonLayout {
  const rng = createRng(`${seed}:dungeon`);
  const roomCount = randInt(rng, DUNGEON_MIN_ROOMS, DUNGEON_MAX_ROOMS);

  const rooms: DungeonRoom[] = [];
  const corridors: DungeonCorridor[] = [];

  let cursorX = 0;
  for (let i = 0; i < roomCount; i++) {
    const width = randRange(rng, ROOM_MIN_SIZE, ROOM_MAX_SIZE);
    const depth = randRange(rng, ROOM_MIN_SIZE, ROOM_MAX_SIZE);
    // 이전 방과 겹치지 않도록 복도 폭만큼 간격을 두고 동쪽으로 배치
    const centerX = cursorX + width / 2;
    const centerZ = 0;
    rooms.push({ id: i, x: centerX, z: centerZ, width, depth });
    cursorX += width + CORRIDOR_WIDTH_M * 3; // 다음 방까지의 간격(복도 포함)

    if (i > 0) {
      corridors.push({ fromRoomId: i - 1, toRoomId: i });
    }
  }

  const lastRoom = rooms[rooms.length - 1];
  const door: DungeonDoor = {
    roomId: lastRoom.id,
    x: lastRoom.x + lastRoom.width / 2, // 동쪽 바깥벽
    z: lastRoom.z,
  };

  return {
    rooms,
    corridors,
    door,
    startX: rooms[0].x,
    startZ: rooms[0].z,
  };
}

/** 그래프 순회로 모든 방이 첫 방에서부터 연결되어 있는지 검증한다. */
export function isFullyConnected(layout: DungeonLayout): boolean {
  if (layout.rooms.length === 0) return false;
  const adjacency = new Map<number, number[]>();
  for (const room of layout.rooms) adjacency.set(room.id, []);
  for (const c of layout.corridors) {
    adjacency.get(c.fromRoomId)?.push(c.toRoomId);
    adjacency.get(c.toRoomId)?.push(c.fromRoomId);
  }

  const visited = new Set<number>();
  const stack = [layout.rooms[0].id];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const next of adjacency.get(current) ?? []) {
      if (!visited.has(next)) stack.push(next);
    }
  }
  return visited.size === layout.rooms.length;
}

/** 문이 실제로 방 목록 중 하나(마지막 방)의 바깥벽에 존재하는지 검증한다. */
export function hasValidDoor(layout: DungeonLayout): boolean {
  const room = layout.rooms.find((r) => r.id === layout.door.roomId);
  if (!room) return false;
  // 문 x좌표가 방의 동쪽 바깥벽과 일치하는지(오차 허용)
  const expectedX = room.x + room.width / 2;
  return Math.abs(layout.door.x - expectedX) < 1e-6;
}

/** 두 지점 사이의 거리(m). 메아리 지연 계산 등에 사용. */
export function distanceToDoor(x: number, z: number, door: DungeonDoor): number {
  return Math.hypot(door.x - x, door.z - z);
}
