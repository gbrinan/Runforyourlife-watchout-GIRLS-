import type { Maiden, Point } from '../entities/maiden';
import { ramMaiden } from '../entities/maiden';
import type { DungeonLayout } from '../gen/dungeon';
import { hasDungeonSight, isDungeonBlocked } from '../gen/dungeon';

export function ramInDungeon(
  layout: DungeonLayout,
  maiden: Maiden,
  player: Point & { readonly yaw: number },
): ReturnType<typeof ramMaiden> {
  if (!hasDungeonSight(layout, player, maiden)) return 'miss';
  const original = { x: maiden.x, z: maiden.z };
  const result = ramMaiden(maiden, player);
  if (result !== 'pushed') return result;
  const dx = maiden.x - original.x;
  const dz = maiden.z - original.z;
  const steps = Math.ceil(Math.hypot(dx, dz) / 0.2);
  maiden.x = original.x;
  maiden.z = original.z;
  for (let step = 1; step <= steps; step += 1) {
    const point = { x: original.x + dx * step / steps, z: original.z + dz * step / steps };
    if (isDungeonBlocked(layout, point)) break;
    maiden.x = point.x;
    maiden.z = point.z;
  }
  return result;
}
