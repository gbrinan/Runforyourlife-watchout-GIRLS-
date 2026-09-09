import { describe, expect, it } from 'vitest';
import { CANDY_THEME_BPM, CANDY_THEME_NOTES, candyThemeDuration, renderCandyMountainTheme } from '../src/audio/candy-mountain';

describe('candy mountain ending theme', () => {
  it('defines a looping melody with a bright opening and uneasy ending', () => {
    expect(CANDY_THEME_BPM).toBeGreaterThanOrEqual(120);
    expect(CANDY_THEME_NOTES).toHaveLength(32);
    expect(new Set(CANDY_THEME_NOTES).size).toBeGreaterThan(8);
    expect(CANDY_THEME_NOTES.at(-1)).toBeLessThan(CANDY_THEME_NOTES[0]);
    expect(candyThemeDuration()).toBeGreaterThan(7);
  });

  it('renders a bounded, non-silent waveform with click-free loop edges', () => {
    const samples = renderCandyMountainTheme(8_000);
    const peak = samples.reduce((value, sample) => Math.max(value, Math.abs(sample)), 0);
    const energy = samples.reduce((value, sample) => value + sample * sample, 0) / samples.length;
    expect(samples.length).toBe(Math.floor(candyThemeDuration() * 8_000));
    expect(peak).toBeGreaterThan(.1);
    expect(peak).toBeLessThanOrEqual(.9);
    expect(energy).toBeGreaterThan(.001);
    expect(samples[0]).toBe(0);
    expect(Math.abs(samples.at(-1) ?? 1)).toBeLessThan(.001);
  });
});
