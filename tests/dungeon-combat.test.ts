import { describe, expect, it } from 'vitest';
import { createMaiden } from '../src/entities/maiden';
import type { DungeonLayout } from '../src/gen/dungeon';
import { isDungeonBlocked } from '../src/gen/dungeon';
import { ramInDungeon } from '../src/systems/dungeon-combat';

function chamber(divided: boolean): DungeonLayout {
  const size = 8;
  const cells = new Uint8Array(size * size);
  for (let z = 1; z < 6; z += 1) {
    for (let x = 1; x < 7; x += 1) {
      if (!divided || z !== 3) cells[z * size + x] = 1;
    }
  }
  return { size, cells, rooms: [], start: { x: 2.5, z: 2.5 }, spawns: [] };
}

describe('dungeon horn collision', () => {
  it.each([0, 2])('misses through a wall without mutating maiden after %s previous hits', (ramHits) => {
    const layout = chamber(true);
    const maiden = createMaiden({ x: 2.5, z: 4.5 });
    maiden.ramHits = ramHits;
    const before = structuredClone(maiden);
    const result = ramInDungeon(layout, maiden, { x: 2.5, z: 2.5, yaw: 0 });
    expect(result).toBe('miss');
    expect(maiden).toEqual(before);
  });
  it('stops legal push at the first wall while retaining stun and hit count', () => {
    const layout = chamber(false);
    const maiden = createMaiden({ x: 2.5, z: 4.5 });
    const result = ramInDungeon(layout, maiden, { x: 2.5, z: 3.5, yaw: 0 });
    expect(result).toBe('pushed');
    expect(maiden.z).toBeGreaterThan(4.5);
    expect(maiden.z).toBeLessThanOrEqual(5.7);
    expect(isDungeonBlocked(layout, maiden)).toBe(false);
    expect(isDungeonBlocked(layout, { x: maiden.x, z: maiden.z + 0.21 })).toBe(true);
    expect(maiden.mode).toBe('stunned');
    expect(maiden.timer).toBe(2);
    expect(maiden.ramHits).toBe(1);
  });
  it('catches the player on a legal third hit', () => {
    const maiden = createMaiden({ x: 2.5, z: 4.5 });
    maiden.ramHits = 2;
    expect(ramInDungeon(chamber(false), maiden, { x: 2.5, z: 3.5, yaw: 0 })).toBe('caught');
    expect(maiden.mode).toBe('attack');
  });
});
