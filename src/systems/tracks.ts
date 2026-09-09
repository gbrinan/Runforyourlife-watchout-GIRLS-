import type { Point } from '../entities/maiden';
import { Material } from '../gen/material';

export type Track = { readonly point: Point; readonly time: number };

/** The simulation owns and prunes this mutable, time-ordered trail. */
export function createTracks(): Track[] {
  return [];
}

export function recordTrack(
  tracks: Track[],
  input: { readonly point: Point; readonly material: Material; readonly time: number },
): void {
  expireTracks(tracks, input.time);
  if (input.material !== Material.Dirt && input.material !== Material.ShallowWater) return;
  const previous = tracks[tracks.length - 1];
  if (previous && Math.hypot(input.point.x - previous.point.x, input.point.z - previous.point.z) < 1) return;
  tracks.push({ point: { ...input.point }, time: input.time });
}

export function latestTrack(
  tracks: Track[],
  input: { readonly point: Point; readonly time: number },
): Point | undefined {
  expireTracks(tracks, input.time);
  for (let index = tracks.length - 1; index >= 0; index -= 1) {
    const track = tracks[index];
    if (!track) continue;
    const distance = Math.hypot(track.point.x - input.point.x, track.point.z - input.point.z);
    if (distance > 0.5 && distance <= 6) return track.point;
  }
  return undefined;
}

export function expireTracks(tracks: Track[], time: number): void {
  let expired = 0;
  for (const track of tracks) {
    if (time - track.time < 30) break;
    expired += 1;
  }
  if (expired > 0) tracks.splice(0, expired);
}
