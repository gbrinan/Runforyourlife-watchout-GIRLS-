import { describe,it,expect } from 'vitest';
import { createDungeonLayout,isDungeonBlocked } from '../src/gen/dungeon';
import { createStalker,alertStalker,updateStalker,ramStalker,sealPositions,insideSeal } from '../src/systems/stalker';

describe('relentless stalker and sealing ritual',()=>{
  const layout=createDungeonLayout('stalker-test');
  const center=layout.start;
  it('uses Eve\'s fastest and strongest threat profile',()=>{
    const stalker=createStalker(layout.spawns[3]);
    expect(stalker.body.tuning.chaseSpeed).toBeGreaterThan(3);
    expect(stalker.body.tuning.lungeTime).toBeGreaterThanOrEqual(.6);
    expect(stalker.body.tuning.lungeTime).toBeLessThan(.8);
  });
  it('stays dormant when no sight or sound reaches her',()=>{
    const stalker=createStalker(layout.spawns[3]);
    updateStalker(stalker,layout,center,1);
    expect(stalker.awakened).toBe(false);
  });
  it('wakes only for audible nonzero noise',()=>{
    const stalker=createStalker(layout.spawns[3]);
    alertStalker(stalker,center,0);
    expect(stalker.awakened).toBe(false);
    alertStalker(stalker,center,100);
    expect(stalker.awakened).toBe(true);
  });
  it.each(['a','b','c'])('keeps chasing around walls without sight or new noise (%s)',seed=>{
    const dungeon=createDungeonLayout(seed);
    const stalker=createStalker(dungeon.spawns[3]);stalker.awakened=true;
    let hit=false;
    for(let i=0;i<5000&&!hit;i++){
      hit=updateStalker(stalker,dungeon,dungeon.start,.03);
      expect(isDungeonBlocked(dungeon,stalker.body)).toBe(false);
    }
    expect(hit).toBe(true);
    expect(stalker.awakened).toBe(true);
  });
  it('only briefly repels her outside a seal even after prior attacks',()=>{
    const stalker=createStalker({x:center.x+1,z:center.z});stalker.body.ramHits=5;
    const result=ramStalker(stalker,layout,{...center,yaw:Math.PI/2},[]);
    expect(result).toBe('repelled');expect(stalker.sealed).toBe(false);expect(stalker.body.timer).toBe(stalker.body.tuning.stunTime);
    updateStalker(stalker,layout,center,1);updateStalker(stalker,layout,center,.01);
    expect(stalker.body.mode).toBe('chase');
  });
  it('seals her only when the enemy is inside the circle',()=>{
    const stalker=createStalker({x:center.x+1,z:center.z});
    const result=ramStalker(stalker,layout,{...center,yaw:Math.PI/2},sealPositions(layout));
    expect(result).toBe('sealed');expect(stalker.sealed).toBe(true);
    const before={...stalker.body};
    expect(updateStalker(stalker,layout,center,10)).toBe(false);expect(stalker.body).toEqual(before);
  });
  it('does not count only the player standing inside the seal',()=>{
    const stalker=createStalker({x:center.x+1.8,z:center.z});
    expect(ramStalker(stalker,layout,{...center,yaw:Math.PI/2},sealPositions(layout))).toBe('repelled');
  });
  it('cannot seal out of range or when facing away',()=>{
    const stalker=createStalker(center);
    expect(ramStalker(stalker,layout,{x:center.x-3,z:center.z,yaw:Math.PI/2},sealPositions(layout))).toBe('miss');
    expect(ramStalker(stalker,layout,{x:center.x-1,z:center.z,yaw:-Math.PI/2},sealPositions(layout))).toBe('miss');
    expect(stalker.sealed).toBe(false);
  });
  it('cannot seal through a wall',()=>{
    const stalker=createStalker({x:center.x+1,z:center.z});
    const cells=layout.cells.slice();cells[Math.floor(center.z)*layout.size+Math.floor(center.x+.5)]=0;
    expect(ramStalker(stalker,{...layout,cells},{...center,yaw:Math.PI/2},sealPositions(layout))).toBe('miss');
  });
  it('locates both seals in walkable room interiors',()=>{
    const seals=sealPositions(layout);
    expect(seals).toHaveLength(2);
    for(const point of seals){expect(isDungeonBlocked(layout,point)).toBe(false);expect(insideSeal(point,seals)).toBe(true);}
  });
});
