import { describe, it, expect } from 'vitest';
import { readMovement, readTurn } from '../src/systems/controls';

describe('direct movement controls', () => {
  it('moves backwards when S is held', () => {
    const keys = new Set(['KeyS']);
    const movement = readMovement(keys, 0, false);
    expect(movement.z).toBe(-3);
  });
  it('does not move while Q turns the head left in place', () => {
    const keys = new Set(['KeyQ']);
    const movement = readMovement(keys, Math.PI / 2, false);
    expect(movement.speed).toBe(0);
    expect(readTurn(keys)).toBe(1);
  });
  it('strafes right with D without turning', () => {
    const keys = new Set(['KeyD']);
    expect(readMovement(keys,0,false).x).toBe(-3);
    expect(readTurn(keys)).toBe(0);
  });
  it('does not move while E turns the head right in place', () => {
    const keys = new Set(['KeyE']);
    expect(readMovement(keys, 0, false).speed).toBe(0);
    expect(readTurn(keys)).toBe(-1);
  });
  it('keeps diagonal sprint equal to straight sprint', () => {
    const keys = new Set(['KeyW', 'KeyA', 'ShiftLeft']);
    const movement = readMovement(keys, 1.2, false);
    expect(Math.hypot(movement.x, movement.z)).toBeCloseTo(8);
  });
  it('stops immediately when movement keys are released', () => {
    const keys = new Set(['ShiftLeft']);
    const movement = readMovement(keys, 0, false);
    expect(movement.speed).toBe(0);
  });
  it('uses quiet walking even when sprint is held', () => {
    const keys = new Set(['KeyW', 'ControlLeft', 'ShiftLeft']);
    const movement = readMovement(keys, 0, false);
    expect(movement.speed).toBe(1.5);
  });
  it('limits sprint when exhausted', () => {
    const keys = new Set(['KeyW', 'ShiftRight']);
    const movement = readMovement(keys, 0, true);
    expect(movement.speed).toBe(3);
  });
  it('cancels opposite inputs', () => {
    const keys = new Set(['KeyW', 'KeyS']);
    const movement = readMovement(keys, 0, false);
    expect(movement.speed).toBe(0);
  });
});
