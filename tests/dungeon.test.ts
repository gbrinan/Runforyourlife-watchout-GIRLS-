import { describe, expect, it } from 'vitest';
import { createDungeonLayout, dungeonWaypoint, hasDungeonSight, isDungeonBlocked } from '../src/gen/dungeon';

describe('basement dungeon navigation', () => {
  it('reproduces its rooms and floor when given the same seed', () => {
    const seed = 'basement'; // Given
    const first = createDungeonLayout(seed); // When
    expect(first).toEqual(createDungeonLayout(seed)); // Then
    expect(first.cells).not.toEqual(createDungeonLayout('different').cells);
  });

  it('connects every room when following cardinal floor waypoints', () => {
    const layout = createDungeonLayout('connected'); // Given
    for (const room of layout.rooms) {
      const goal = { x: room.x + room.width / 2, z: room.z + room.depth / 2 };
      let position = layout.start;
      for (let step = 0; step < 256 && Math.hypot(position.x - goal.x, position.z - goal.z) > 0.01; step++) {
        const next = dungeonWaypoint(layout, position, goal); // When
        expect(hasDungeonSight(layout, position, next)).toBe(true); // Then
        expect(isDungeonBlocked(layout, next)).toBe(false);
        position = next;
      }
      expect(position).toEqual(goal);
    }
    expect(layout.spawns).toHaveLength(4);
    for (const spawn of layout.spawns) expect(isDungeonBlocked(layout, spawn)).toBe(false);
  });

  it('blocks the exterior and capsule overlap when approaching a wall', () => {
    const layout = createDungeonLayout('boundary'); // Given
    const samples = [{ x: -1, z: 9 }, { x: 64, z: 9 }, layout.fixtures[0], {x:layout.fixtures[0].x+.5,z:layout.fixtures[0].z}];
    const collisions = samples.map((point) => isDungeonBlocked(layout, point)); // When
    expect(collisions).toEqual([true, true, true, true]); // Then
    expect(isDungeonBlocked(layout, layout.start)).toBe(false);
  });

  it('occludes walls while retaining sight along the entrance corridor', () => {
    const layout = createDungeonLayout('sight'); // Given
    const firstSpawn = layout.spawns[0];
    const corridorSight = hasDungeonSight(layout, layout.start, {x:layout.start.x+2,z:layout.start.z}); // When
    expect(corridorSight).toBe(true); // Then
    expect(hasDungeonSight(layout, layout.start, { x: 0, z: 0 })).toBe(false);
    expect(isDungeonBlocked(layout, firstSpawn)).toBe(false);
  });

  it('stays in place when the goal is inside a wall', () => {
    const layout = createDungeonLayout('invalid'); // Given
    const next = dungeonWaypoint(layout, layout.start, { x: 1, z: 1 }); // When
    expect(next).toEqual(layout.start); // Then
  });
});

it('rounds corridor corners without clipping when taking partial movement steps', () => {
  const layout = createDungeonLayout('continuous'); // Given
  const target = layout.spawns[3];
  let position = layout.start;
  for (let step = 0; step < 1500 && Math.hypot(position.x - target.x, position.z - target.z) > 0.01; step++) {
    const waypoint = dungeonWaypoint(layout, position, target); // When
    const distance = Math.hypot(waypoint.x - position.x, waypoint.z - position.z);
    const fraction = distance > 0 ? Math.min(1, 0.12 / distance) : 0;
    position = { x: position.x + (waypoint.x - position.x) * fraction, z: position.z + (waypoint.z - position.z) * fraction };
    expect(isDungeonBlocked(layout, position)).toBe(false); // Then
  }
  expect(position.x).toBeCloseTo(target.x, 1);
  expect(position.z).toBeCloseTo(target.z, 1);
});
