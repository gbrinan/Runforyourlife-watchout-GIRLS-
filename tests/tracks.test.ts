import { describe, expect, it } from 'vitest';
import { Material } from '../src/gen/material';
import { createTracks, latestTrack, recordTrack } from '../src/systems/tracks';

describe('footprint trail', () => {
  it.each([Material.Dirt, Material.ShallowWater])('records footprints when walking on %s', (material) => {
    const tracks = createTracks();
    recordTrack(tracks, { point: { x: 2, z: 0 }, material, time: 0 });
    expect(latestTrack(tracks, { point: { x: 0, z: 0 }, time: 0 })).toEqual({ x: 2, z: 0 });
  });
  it.each([Material.Grass, Material.Gravel, Material.DeepWater])('leaves no footprints when on %s', (material) => {
    const tracks = createTracks();
    recordTrack(tracks, { point: { x: 2, z: 0 }, material, time: 0 });
    expect(tracks).toHaveLength(0);
  });
  it('avoids duplicate tracks when movement is under one metre', () => {
    const tracks = createTracks();
    recordTrack(tracks, { point: { x: 0, z: 0 }, material: Material.Dirt, time: 0 });
    recordTrack(tracks, { point: { x: 0.9, z: 0 }, material: Material.Dirt, time: 1 });
    expect(tracks).toHaveLength(1);
  });
  it('records a fresh footprint when movement reaches one metre', () => {
    const tracks = createTracks();
    recordTrack(tracks, { point: { x: 0, z: 0 }, material: Material.Dirt, time: 0 });
    recordTrack(tracks, { point: { x: 1, z: 0 }, material: Material.Dirt, time: 1 });
    expect(tracks).toHaveLength(2);
  });
  it('expires footprints when their age reaches thirty seconds', () => {
    const tracks = createTracks();
    recordTrack(tracks, { point: { x: 2, z: 0 }, material: Material.Dirt, time: 0 });
    expect(latestTrack(tracks, { point: { x: 0, z: 0 }, time: 30 })).toBeUndefined();
    expect(tracks).toHaveLength(0);
  });
  it('expires old footprints when recording on grass', () => {
    const tracks = createTracks();
    recordTrack(tracks, { point: { x: 2, z: 0 }, material: Material.Dirt, time: 0 });
    recordTrack(tracks, { point: { x: 3, z: 0 }, material: Material.Grass, time: 30 });
    expect(tracks).toHaveLength(0);
  });
  it('selects the latest reachable footprint when newer tracks are out of range', () => {
    const tracks = createTracks();
    recordTrack(tracks, { point: { x: 2, z: 0 }, material: Material.Dirt, time: 0 });
    recordTrack(tracks, { point: { x: 6, z: 0 }, material: Material.Dirt, time: 1 });
    recordTrack(tracks, { point: { x: 8, z: 0 }, material: Material.Dirt, time: 2 });
    expect(latestTrack(tracks, { point: { x: 0, z: 0 }, time: 2 })).toEqual({ x: 6, z: 0 });
  });
  it('ignores footprints when already within half a metre', () => {
    const tracks = createTracks();
    recordTrack(tracks, { point: { x: 0.5, z: 0 }, material: Material.Dirt, time: 0 });
    expect(latestTrack(tracks, { point: { x: 0, z: 0 }, time: 0 })).toBeUndefined();
  });
});
