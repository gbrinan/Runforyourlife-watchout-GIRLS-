import { Gait, GAIT_SPEED } from '../entities/unicorn';

export function readMovement(keys: ReadonlySet<string>, yaw: number, exhausted: boolean) {
  const forward = Number(keys.has('KeyW')) - Number(keys.has('KeyS'));
  const right = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
  const length = Math.hypot(forward, right);
  const quiet = keys.has('ControlLeft') || keys.has('ControlRight');
  const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
  const gait = quiet ? Gait.Walk : sprint && !exhausted ? Gait.Gallop : Gait.Trot;
  const speed = length > 0 ? GAIT_SPEED[gait] : 0;
  const divisor = length || 1;
  return { gait, speed,
    x: (Math.sin(yaw) * forward - Math.cos(yaw) * right) / divisor * speed,
    z: (Math.cos(yaw) * forward + Math.sin(yaw) * right) / divisor * speed };
}

export function readTurn(keys: ReadonlySet<string>): number {
  return Number(keys.has('KeyQ')) - Number(keys.has('KeyE'));
}
