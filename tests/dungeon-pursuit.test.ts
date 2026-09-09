import { expect, it } from 'vitest';
import { createMaiden, hearNoise, updateMaiden } from '../src/entities/maiden';
import { createDungeonLayout, dungeonWaypoint, isDungeonBlocked } from '../src/gen/dungeon';

it.each(['continuous', 'connected', 'corner-pursuit'])('investigates around room corners without clipping for seed %s', (seed) => {
  const layout = createDungeonLayout(seed);
  const spawn = layout.spawns[3];
  if (!spawn) throw new TypeError('Dungeon requires a far-room spawn');
  const maiden = createMaiden(spawn);
  hearNoise(maiden, { position: layout.start, radius: 100 });
  let steps = 0;
  while (maiden.mode === 'alert' && steps < 3000) {
    const before = { x: maiden.x, z: maiden.z };
    const waypoint = dungeonWaypoint(layout, maiden, maiden.target);
    updateMaiden(maiden, { player: { x: 60, z: 60 }, visible: false, allowChase: true, waypoint }, 0.04);
    expect(isDungeonBlocked(layout, maiden), JSON.stringify({ before, waypoint, after: { x: maiden.x, z: maiden.z }, steps })).toBe(false);
    if (Math.hypot(maiden.x - layout.start.x, maiden.z - layout.start.z) > 0.01) {
      expect(maiden.mode).toBe('alert');
    }
    steps += 1;
  }
  expect(steps).toBeLessThan(3000);
  expect(maiden.mode).toBe('search');
  expect(maiden.timer).toBe(20);
  expect(maiden.x).toBeCloseTo(layout.start.x, 2);
  expect(maiden.z).toBeCloseTo(layout.start.z, 2);
  expect(maiden.target).toEqual(layout.start);
});
