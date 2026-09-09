import { describe, expect, it } from 'vitest';
import { createSurvival, updateSurvival, hurt } from '../src/systems/survival';
import { hoofNoiseRadius } from '../src/systems/noise';
import { Gait } from '../src/entities/unicorn';
import { Material } from '../src/gen/material';
describe('M1 survival', () => {
  it('exhausts after sprinting, recovers while resting, and caps stamina', () => {
    const s = createSurvival();
    updateSurvival(s, { gait: Gait.Gallop, moving: true }, 9);
    expect(s.stamina).toBe(0); expect(s.exhausted).toBe(true);
    updateSurvival(s, { gait: Gait.Gallop, moving: false }, 3);
    expect(s.stamina).toBe(24); expect(s.exhausted).toBe(false);
    updateSurvival(s, { gait: Gait.Walk, moving: false }, 20);
    expect(s.stamina).toBe(100);
  });
  it('emits breath after three seconds, with a cooldown', () => {
    const s = createSurvival();
    expect(updateSurvival(s, {gait:Gait.Gallop,moving:true}, 2.9)).toBe(false);
    expect(updateSurvival(s, {gait:Gait.Gallop,moving:true}, .11)).toBe(true);
    expect(updateSurvival(s, {gait:Gait.Gallop,moving:true}, .1)).toBe(false);
  });
  it('requires three separated hits and preserves missing parts', () => {
    const s = createSurvival();
    expect(hurt(s)).toBe(true); expect(hurt(s)).toBe(false);
    expect(s.lostParts.has('tail')).toBe(true);
    updateSurvival(s,{gait:Gait.Walk,moving:false},2); hurt(s);
    expect(s.lostParts.has('mane')).toBe(true);
    s.stamina=100;
    updateSurvival(s,{gait:Gait.Gallop,moving:true},1);
    expect(s.stamina).toBe(76);
    updateSurvival(s,{gait:Gait.Walk,moving:false},2); hurt(s);
    expect(s.hp).toBe(0); expect(hurt(s)).toBe(false);
    expect(updateSurvival(s,{gait:Gait.Gallop,moving:true},5)).toBe(false);
  });
  it('canters at 3 stamina per second', () => {
    const s=createSurvival(); updateSurvival(s,{gait:Gait.Canter,moving:true},2);
    expect(s.stamina).toBe(94);
  });
});
describe('hoof noise boundary', () => {
  it('makes grass walking silent even at exactly 3m', () => {
    expect(hoofNoiseRadius(Gait.Walk,Material.Grass)).toBe(0);
    expect(hoofNoiseRadius(Gait.Walk,Material.Dirt)).toBe(6);
    expect(hoofNoiseRadius(Gait.Gallop,Material.Gravel)).toBe(60);
    expect(hoofNoiseRadius(Gait.Gallop,Material.ShallowWater)).toBe(80);
    expect(hoofNoiseRadius(Gait.Gallop,Material.DeepWater)).toBe(0);
  });
});
