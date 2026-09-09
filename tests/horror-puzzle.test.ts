import {expect,it} from 'vitest';
import {createDungeonLayout,hasDungeonRoute} from '../src/gen/dungeon';
import {createPuzzle,ringBell,exitSealed} from '../src/systems/puzzle';
import {createJump,startJump,stepJump} from '../src/systems/jump';

it('resets a wrong sequence and unlocks only after all three correct bells',()=>{
  const puzzle=createPuzzle(createDungeonLayout('puzzle'),'puzzle');
  expect(puzzle.solved).toBe(false);
  ringBell(puzzle,puzzle.order[0]);
  expect(ringBell(puzzle,puzzle.order[0])).toBe('wrong');
  expect(puzzle.progress).toBe(0);
  expect(puzzle.solved).toBe(false);
  puzzle.order.forEach(id=>ringBell(puzzle,id));
  expect(puzzle.solved).toBe(true);
  expect(ringBell(puzzle,puzzle.order[0])).toBe('solved');
});
it('makes every bell and clue reachable across random dungeons',()=>{
  const orders=new Set<string>();
  for(let i=0;i<500;i++){
    const seed='puzzle-'+i,layout=createDungeonLayout(seed),puzzle=createPuzzle(layout,seed);
    for(const point of [...puzzle.bells.map(b=>b.point),puzzle.clue])expect(hasDungeonRoute(layout,layout.start,point)).toBe(true);
    expect(new Set(puzzle.order).size).toBe(3);
    orders.add(puzzle.order.join(','));
  }
  expect(orders.size).toBe(6);
});
it('jumps below the ceiling, rejects air jumps, and lands exactly on the floor',()=>{
  const jump=createJump();
  expect(startJump(jump)).toBe(true);
  expect(startJump(jump)).toBe(false);
  let peak=0,landings=0;
  for(let i=0;i<120;i++){if(stepJump(jump,1/60))landings++;peak=Math.max(peak,jump.height);}
  expect(peak).toBeGreaterThan(.4);
  expect(peak).toBeLessThan(.8);
  expect(jump.height).toBe(0);
  expect(landings).toBe(1);
});
it('blocks the EXIT before completion and releases it after solving for all wall directions',()=>{
  for(const normal of [{x:1,z:0},{x:-1,z:0},{x:0,z:1},{x:0,z:-1}]){
    const exit={point:{x:10,z:10},normal,inside:{x:10-normal.x*2,z:10-normal.z*2},outside:{x:10+normal.x*2.5,z:10+normal.z*2.5}};
    expect(exitSealed(exit,exit.point,false)).toBe(true);
    expect(exitSealed(exit,exit.inside,false)).toBe(false);
    expect(exitSealed(exit,exit.point,true)).toBe(false);
    expect(exitSealed(exit,exit.outside,true)).toBe(false);
  }
});
