import { Gait } from '../entities/unicorn';

// Mutable state owned by the simulation tick.
export interface Survival {
  stamina: number;
  hp: number;
  lostParts: Set<'tail' | 'mane'>;
  invulnerable: number;
  sprintTime: number;
  breathTimer: number;
  exhausted: boolean;
}
export function createSurvival(): Survival {
  return { stamina: 100, hp: 3, lostParts: new Set(), invulnerable: 0,
    sprintTime: 0, breathTimer: 0, exhausted: false };
}
export function updateSurvival(state: Survival, movement: {readonly gait: Gait; readonly moving: boolean}, dt: number): boolean {
  if (state.hp === 0) return false;
  state.invulnerable = Math.max(0, state.invulnerable - dt);
  const gait = movement.moving ? movement.gait : Gait.Walk;
  const rates = { walk: -8, trot: -8, canter: 3, gallop: state.lostParts.has('mane') ? 24 : 12 };
  state.stamina = Math.max(0, Math.min(100, state.stamina - rates[gait] * dt));
  if (state.stamina === 0) state.exhausted = true;
  if (state.stamina >= 20) state.exhausted = false;
  state.sprintTime = gait === Gait.Gallop ? state.sprintTime + dt : 0;
  state.breathTimer = Math.max(0, state.breathTimer - dt);
  if ((state.sprintTime >= 3 || state.exhausted) && state.breathTimer === 0) {
    state.breathTimer = 1.5;
    return true;
  }
  return false;
}
export function hurt(state: Survival): boolean {
  if (state.hp === 0 || state.invulnerable > 0) return false;
  state.hp -= 1;
  state.lostParts.add(state.lostParts.has('tail') ? 'mane' : 'tail');
  state.invulnerable = 2;
  return true;
}
