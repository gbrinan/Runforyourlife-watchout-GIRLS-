import { describe, it, expect } from "vitest";
import {
  generateDungeon,
  isFullyConnected,
  hasValidDoor,
  distanceToDoor,
  DUNGEON_MIN_ROOMS,
  DUNGEON_MAX_ROOMS,
  ROOM_MIN_SIZE,
  ROOM_MAX_SIZE,
} from "../src/gen/dungeon";

describe("dungeon generator", () => {
  it("방 개수는 3~5개 사이", () => {
    for (let i = 0; i < 20; i++) {
      const layout = generateDungeon(`seed-${i}`);
      expect(layout.rooms.length).toBeGreaterThanOrEqual(DUNGEON_MIN_ROOMS);
      expect(layout.rooms.length).toBeLessThanOrEqual(DUNGEON_MAX_ROOMS);
    }
  });

  it("각 방 크기는 8~15m 범위", () => {
    const layout = generateDungeon("size-test");
    for (const room of layout.rooms) {
      expect(room.width).toBeGreaterThanOrEqual(ROOM_MIN_SIZE);
      expect(room.width).toBeLessThanOrEqual(ROOM_MAX_SIZE);
      expect(room.depth).toBeGreaterThanOrEqual(ROOM_MIN_SIZE);
      expect(room.depth).toBeLessThanOrEqual(ROOM_MAX_SIZE);
    }
  });

  it("같은 시드는 같은 레이아웃을 생성한다(결정론)", () => {
    const a = generateDungeon("deterministic-seed");
    const b = generateDungeon("deterministic-seed");
    expect(a).toEqual(b);
  });

  it("모든 방은 연결되어 있다", () => {
    for (let i = 0; i < 10; i++) {
      const layout = generateDungeon(`conn-${i}`);
      expect(isFullyConnected(layout)).toBe(true);
    }
  });

  it("문이 존재하고 마지막 방의 바깥벽에 있다", () => {
    const layout = generateDungeon("door-test");
    expect(hasValidDoor(layout)).toBe(true);
    expect(layout.door.roomId).toBe(layout.rooms[layout.rooms.length - 1].id);
  });

  it("distanceToDoor는 유클리드 거리를 계산한다", () => {
    const layout = generateDungeon("dist-test");
    const d = distanceToDoor(layout.startX, layout.startZ, layout.door);
    expect(d).toBeGreaterThan(0);
  });

  it("시작 위치는 첫 방 중앙과 같다", () => {
    const layout = generateDungeon("start-test");
    expect(layout.startX).toBe(layout.rooms[0].x);
    expect(layout.startZ).toBe(layout.rooms[0].z);
  });
});
