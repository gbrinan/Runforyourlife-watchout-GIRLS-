import {it,expect} from 'vitest';
import {createDungeonLayout,isDungeonBlocked,dungeonWaypoint,hasDungeonRoute} from '../src/gen/dungeon';
import {createDevices,deviceTarget} from '../src/systems/devices';
import {crossedExit} from '../src/systems/exit';

it('varies room counts and device configurations between seeds',()=>{
 const maps=Array.from({length:20},(_,i)=>createDungeonLayout(`exit-${i}`));
 expect(new Set(maps.map(m=>m.rooms.length)).size).toBeGreaterThan(1);
 expect(new Set(maps.map(m=>JSON.stringify(createDevices(m)))).size).toBe(20);
 expect(new Set(maps.map(m=>createDevices(m).length)).size).toBeGreaterThan(1);
 expect(new Set(maps.flatMap(m=>createDevices(m).map(d=>d.yaw))).size).toBe(4);
 expect(new Set(maps.flatMap(m=>createDevices(m).filter(d=>d.kind==='switch').map(d=>d.lit))).size).toBe(2);
});
it('keeps all devices and exit reachable in one hundred generated maps',()=>{
 for(let i=0;i<100;i++){
  const map=createDungeonLayout(`exit-${i}`);
  for(const target of [...createDevices(map).map(deviceTarget),map.exit.outside]){
   expect(isDungeonBlocked(map,target)).toBe(false);
   expect(dungeonWaypoint(map,map.start,target)).not.toEqual(map.start);
  }
 }
});
it('always generates a walkable route from the initial position to EXIT',()=>{
 for(let i=0;i<2000;i++){
  const map=createDungeonLayout(`guaranteed-exit-${i}`);
  expect(hasDungeonRoute(map,map.start,map.exit.outside),`seed ${i}`).toBe(true);
 }
});
it('clears only after crossing the EXIT threshold toward the outside',()=>{
 const exit=createDungeonLayout('exit-win').exit;
 expect(crossedExit(exit,exit.inside,exit.point)).toBe(false);
 expect(crossedExit(exit,exit.inside,exit.outside)).toBe(true);
 expect(crossedExit(exit,exit.outside,exit.inside)).toBe(false);
 const side={x:exit.outside.x+exit.normal.z*4,z:exit.outside.z-exit.normal.x*4};
 expect(crossedExit(exit,exit.inside,side)).toBe(false);
});
