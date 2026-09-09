import {describe,it,expect} from 'vitest';
import {createDungeonLayout,hasDungeonSight,isDungeonBlocked} from '../src/gen/dungeon';
import {chooseSpawn,createHunt} from '../src/systems/hunt';
import {createMaiden} from '../src/entities/maiden';

describe('rear ambush',()=>{
 it('appears behind every facing direction at a fair reaction distance',()=>{
  const layout=createDungeonLayout('ambush'),room=layout.rooms[0];
  const cells=new Uint8Array(layout.cells.length).fill(1),open={...layout,cells};
  for(const yaw of [0,.7,Math.PI,4.5]){
   const player={x:room.x+room.width/2,z:room.z+room.depth/2,yaw};
   const point=chooseSpawn(open,player);
   expect(point).toBeDefined();if(!point)throw new Error('Missing rear point');
   const dx=point.x-player.x,dz=point.z-player.z,d=Math.hypot(dx,dz);
   expect(d).toBeGreaterThanOrEqual(4.49);expect(d).toBeLessThanOrEqual(6.51);
   expect((dx*Math.sin(yaw)+dz*Math.cos(yaw))/d).toBeLessThan(-.7);
   expect(isDungeonBlocked(open,point)).toBe(false);expect(hasDungeonSight(open,player,point)).toBe(true);
  }
 });
 it('defers instead of appearing ahead when the rear is blocked',()=>{
  const layout=createDungeonLayout('ambush'),player={...layout.start,yaw:0};
  const cells=layout.cells.slice();
  for(let z=0;z<Math.floor(player.z);z++)cells.fill(0,z*layout.size,(z+1)*layout.size);
  expect(chooseSpawn({...layout,cells},player)).toBeUndefined();
 });
 it('starts pursuit without immediate contact damage after the quiet opening',()=>{
  const layout=createDungeonLayout('ambush'),open={...layout,cells:new Uint8Array(layout.cells.length).fill(1)};
  const player={...layout.start,yaw:Math.PI},hunt=createHunt(open,layout.spawns.slice(0,2).map(createMaiden));
  expect(hunt.update(24.99,0,player,[],()=>undefined,18).spawned).toBe(false);
  const result=hunt.update(25,0,player,[],()=>undefined,18);
  expect(result.spawned).toBe(true);expect(result.hits).toBe(0);expect(hunt.active()[0].mode).toBe('chase');
 });
});
