import { describe, expect, it } from 'vitest';
import { createMaiden, hearNoise, heelInterval, ramMaiden, updateMaiden } from '../src/entities/maiden';

const hidden = { player: { x: 50, z: 50 }, visible: false, allowChase: true };

describe('maiden perception and pursuit', () => {
  it.each([0, -1])('ignores silent noise radius %s even when overlapping', (radius) => {
    const maiden = createMaiden({ x: 0, z: 0 });
    hearNoise(maiden, { position: { x: 0, z: 0 }, radius });
    expect(maiden.mode).toBe('wander');
  });
  it('investigates a noise when inside its hearing radius', () => {
    const maiden = createMaiden({ x: 0, z: 0 });
    hearNoise(maiden, { position: { x: 3, z: 4 }, radius: 5 });
    expect(maiden.mode).toBe('alert');
    expect(maiden.target).toEqual({ x: 3, z: 4 });
  });
  it('ignores noise when beyond its hearing radius', () => {
    const maiden = createMaiden({ x: 0, z: 0 });
    hearNoise(maiden, { position: { x: 6, z: 0 }, radius: 5 });
    expect(maiden.mode).toBe('wander');
  });
  it('moves at chase speed when the player is visible', () => {
    const maiden = createMaiden({ x: 0, z: 0 });
    updateMaiden(maiden, { player: { x: 10, z: 0 }, visible: true, allowChase: true }, 1);
    expect(maiden.x).toBeCloseTo(2.4);
    expect(maiden.mode).toBe('chase');
  });
  it('retains last known location when the player hides', () => {
    const maiden = createMaiden({ x: 0, z: 0 });
    updateMaiden(maiden, { player: { x: 10, z: 0 }, visible: true, allowChase: true }, 0);
    updateMaiden(maiden, hidden, 1);
    expect(maiden.target).toEqual({ x: 10, z: 0 });
    expect(maiden.mode).toBe('search');
  });
  it('returns to wandering when twenty seconds of searching expire', () => {
    const maiden = createMaiden({ x: 0, z: 0 });
    maiden.mode = 'search';
    maiden.timer = 20;
    updateMaiden(maiden, hidden, 20);
    expect(maiden.mode).toBe('wander');
  });
  it('does not acquire the player when pursuit is disabled', () => {
    const maiden = createMaiden({ x: 0, z: 0 });
    const attacked = updateMaiden(maiden, { player: { x: 0, z: 1 }, visible: true, allowChase: false }, 0);
    expect(attacked).toBe(false);
    expect(maiden.mode).toBe('wander');
  });
  it('telegraphs a grab before contact can hurt the player', () => {
    const maiden = createMaiden({ x: 0, z: 0 });
    expect(updateMaiden(maiden, { player: { x: 1, z: 0 }, visible: true, allowChase: true }, 0)).toBe(false);
    expect(maiden.mode).toBe('lunge');
    expect(updateMaiden(maiden, { player: { x: 1, z: 0 }, visible: true, allowChase: true }, .79)).toBe(false);
    expect(updateMaiden(maiden, { player: { x: 1, z: 0 }, visible: true, allowChase: true }, .01)).toBe(true);
  });
  it('misses a telegraphed grab when the player escapes', () => {
    const maiden = createMaiden({ x: 0, z: 0 });
    updateMaiden(maiden, { player: { x: 1, z: 0 }, visible: true, allowChase: true }, 0);
    expect(updateMaiden(maiden, { player: { x: 4, z: 0 }, visible: true, allowChase: true }, .8)).toBe(false);
    expect(maiden.mode).toBe('chase');
  });
  it('cannot attack again before the two second cooldown', () => {
    const maiden = createMaiden({ x: 0, z: 0 });
    maiden.mode = 'attack';
    maiden.timer = 2;
    expect(updateMaiden(maiden, { player: { x: 1, z: 0 }, visible: true, allowChase: true }, 1.99)).toBe(false);
  });
  it('can attack again when the cooldown expires', () => {
    const maiden = createMaiden({ x: 0, z: 0 });
    maiden.mode = 'attack';
    maiden.timer = 2;
    expect(updateMaiden(maiden, { player: { x: 1, z: 0 }, visible: true, allowChase: true }, 2)).toBe(false);
    expect(maiden.mode).toBe('lunge');
  });
});

describe('maiden ram response', () => {
  it('pushes three metres and stuns when rammed from the front', () => {
    const maiden = createMaiden({ x: 0, z: 1 });
    expect(ramMaiden(maiden, { x: 0, z: 0, yaw: 0 })).toBe('pushed');
    expect(maiden.z).toBe(4);
    expect(maiden.timer).toBe(2);
    expect(maiden.mode).toBe('stunned');
  });
  it('misses when the maiden is behind the player', () => {
    const maiden = createMaiden({ x: 0, z: -1 });
    expect(ramMaiden(maiden, { x: 0, z: 0, yaw: 0 })).toBe('miss');
  });
  it('misses when the maiden is beyond two metres', () => {
    const maiden = createMaiden({ x: 0, z: 2.01 });
    expect(ramMaiden(maiden, { x: 0, z: 0, yaw: 0 })).toBe('miss');
  });
  it('does not refresh stun or accumulate hits when spammed', () => {
    const maiden = createMaiden({ x: 0, z: 1 });
    maiden.mode = 'stunned';
    maiden.timer = 1;
    maiden.ramHits = 1;
    expect(ramMaiden(maiden, { x: 0, z: 0, yaw: 0 })).toBe('miss');
    expect(maiden.timer).toBe(1);
    expect(maiden.ramHits).toBe(1);
  });
  it('catches the player when rammed a third time', () => {
    const maiden = createMaiden({ x: 0, z: 1 });
    maiden.ramHits = 2;
    expect(ramMaiden(maiden, { x: 0, z: 0, yaw: 0 })).toBe('caught');
  });
  it('encodes urgency in heel cadence when moving', () => {
    expect([heelInterval('wander'), heelInterval('alert'), heelInterval('chase')]).toEqual([0.6, 0.45, 0.3]);
  });
});

describe('maiden navigation waypoints', () => {
  it('stays alert at an intermediate waypoint without cutting toward the heard target', () => {
    const maiden = createMaiden({ x: 0, z: 0 });
    hearNoise(maiden, { position: { x: 6, z: 6 }, radius: 20 });
    updateMaiden(maiden, { ...hidden, waypoint: { x: 0, z: 3 } }, 2);
    expect({ x: maiden.x, z: maiden.z }).toEqual({ x: 0, z: 3 });
    expect(maiden.mode).toBe('alert');
    expect(maiden.target).toEqual({ x: 6, z: 6 });
  });
  it('starts searching only when the final target is reached', () => {
    const maiden = createMaiden({ x: 6, z: 3 });
    hearNoise(maiden, { position: { x: 6, z: 6 }, radius: 20 });
    updateMaiden(maiden, { ...hidden, waypoint: { x: 6, z: 6 } }, 2);
    expect(maiden.mode).toBe('search');
    expect(maiden.timer).toBe(20);
  });
  it('preserves a wander destination when reaching an intermediate waypoint', () => {
    const maiden = createMaiden({ x: 0, z: 0 });
    updateMaiden(maiden, { ...hidden, waypoint: { x: 1, z: 0 } }, 1);
    expect(maiden.target).toEqual({ x: 0, z: 6 });
    expect({ x: maiden.x, z: maiden.z }).toEqual({ x: 1, z: 0 });
  });
});
