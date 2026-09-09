export type Point = { readonly x: number; readonly z: number };
export type MaidenMode = 'wander' | 'alert' | 'notice' | 'chase' | 'lunge' | 'search' | 'attack' | 'stunned';

/** Mutable simulation state, advanced by the fixed-step game loop. Yaw zero faces +Z. */
export interface Maiden {
  x: number;
  z: number;
  yaw: number;
  mode: MaidenMode;
  target: Point;
  timer: number;
  ramHits: number;
}

export function createMaiden(point: Point): Maiden {
  return { ...point, yaw: 0, mode: 'wander', target: { x: point.x, z: point.z + 6 }, timer: 0, ramHits: 0 };
}

export function hearNoise(maiden: Maiden, event: { readonly position: Point; readonly radius: number }): void {
  if (event.radius <= 0) return;
  if (Math.hypot(maiden.x - event.position.x, maiden.z - event.position.z) > event.radius) return;
  switch (maiden.mode) {
    case 'attack':
    case 'stunned':
    case 'notice':
    case 'chase':
    case 'lunge': return;
    case 'wander':
    case 'alert':
    case 'search':
      maiden.mode = 'alert';
      maiden.target = { ...event.position };
      maiden.timer = 0;
      return;
    default: return assertNever(maiden.mode);
  }
}

export function updateMaiden(
  maiden: Maiden,
  input: { readonly player: Point; readonly visible: boolean; readonly allowChase: boolean; readonly waypoint?: Point },
  dt: number,
): boolean {
  switch (maiden.mode) {
    case 'notice':
      maiden.timer = Math.max(0, maiden.timer - dt);
      if (maiden.timer > Number.EPSILON) return false;
      maiden.mode = 'chase';
      break;
    case 'lunge':
      maiden.timer = Math.max(0, maiden.timer - dt);
      if (maiden.timer > Number.EPSILON) return false;
      if (input.visible && Math.hypot(input.player.x - maiden.x, input.player.z - maiden.z) <= 1.6) {
        maiden.mode = 'attack';
        maiden.timer = 2;
        return true;
      }
      maiden.mode = 'chase';
      break;
    case 'stunned':
    case 'attack':
      maiden.timer = Math.max(0, maiden.timer - dt);
      if (maiden.timer > 0) return false;
      maiden.mode = 'search';
      maiden.timer = 20;
      break;
    case 'wander':
    case 'alert':
    case 'chase':
    case 'search': break;
    default: return assertNever(maiden.mode);
  }

  if (input.visible && input.allowChase) {
    maiden.mode = 'chase';
    maiden.target = { ...input.player };
    maiden.timer = 0;
  } else if (maiden.mode === 'chase') {
    maiden.mode = 'search';
    maiden.timer = 20;
  }

  let speed: number;
  switch (maiden.mode) {
    case 'wander': speed = 1.2; break;
    case 'alert': speed = 1.8; break;
    case 'chase': speed = 2.4; break;
    case 'search':
      maiden.timer = Math.max(0, maiden.timer - dt);
      if (maiden.timer === 0) maiden.mode = 'wander';
      speed = 1.2;
      break;
    default: return assertNever(maiden.mode);
  }

  const aim = input.waypoint ?? maiden.target;
  const dx = aim.x - maiden.x;
  const dz = aim.z - maiden.z;
  const distance = Math.hypot(dx, dz);
  if (distance > 0.01) {
    maiden.yaw = Math.atan2(dx, dz);
    const step = Math.min(distance, speed * dt);
    maiden.x += dx / distance * step;
    maiden.z += dz / distance * step;
  }
  if (maiden.mode === 'chase' && Math.hypot(input.player.x - maiden.x, input.player.z - maiden.z) <= 1.4) {
    maiden.mode = 'lunge';
    maiden.timer = .8;
    return false;
  }
  if (Math.hypot(maiden.target.x - maiden.x, maiden.target.z - maiden.z) <= 0.01) {
    switch (maiden.mode) {
      case 'alert':
        maiden.x=maiden.target.x;maiden.z=maiden.target.z;
        maiden.mode = 'search';
        maiden.timer = 20;
        break;
      case 'wander':
        maiden.yaw += Math.PI * 0.65;
        maiden.target = { x: maiden.x + Math.sin(maiden.yaw) * 6, z: maiden.z + Math.cos(maiden.yaw) * 6 };
        break;
      case 'chase':
      case 'search': break;
      default: return assertNever(maiden.mode);
    }
  }
  return false;
}

export function ramMaiden(maiden: Maiden, player: Point & { readonly yaw: number }): 'miss' | 'pushed' | 'caught' {
  const dx = maiden.x - player.x;
  const dz = maiden.z - player.z;
  const distance = Math.hypot(dx, dz);
  const facing = Math.sin(player.yaw) * dx + Math.cos(player.yaw) * dz;
  if (maiden.mode === 'stunned' || distance > 2 || facing < distance * Math.SQRT1_2) return 'miss';
  maiden.ramHits += 1;
  if (maiden.ramHits >= 3) {
    maiden.mode = 'attack';
    maiden.timer = 2;
    return 'caught';
  }
  maiden.x += Math.sin(player.yaw) * 3;
  maiden.z += Math.cos(player.yaw) * 3;
  maiden.mode = 'stunned';
  maiden.timer = 2;
  return 'pushed';
}

export function heelInterval(mode: MaidenMode): number {
  switch (mode) {
    case 'wander': return 0.6;
    case 'alert': return 0.45;
    case 'notice': return Infinity;
    case 'chase': return 0.3;
    case 'lunge': return Infinity;
    case 'search': return 0.45;
    case 'attack':
    case 'stunned': return Infinity;
    default: return assertNever(mode);
  }
}

function assertNever(value: never): never {
  throw new TypeError(`Unexpected maiden mode: ${value}`);
}
