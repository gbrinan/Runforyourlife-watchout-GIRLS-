import { GAIT_NOISE_RADIUS } from '../entities/unicorn';
import type { Gait } from '../entities/unicorn';
import { Material, MATERIAL_NOISE_MULTIPLIER } from '../gen/material';
export function hoofNoiseRadius(gait: Gait, material: Material): number {
  if (material === Material.DeepWater) return 0;
  const radius = GAIT_NOISE_RADIUS[gait] * MATERIAL_NOISE_MULTIPLIER[material];
  return radius <= 3 ? 0 : radius;
}
