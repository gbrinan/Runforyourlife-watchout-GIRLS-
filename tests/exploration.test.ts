import {describe,it,expect} from 'vitest';
import {createDungeonLayout,hasDungeonSight,isDungeonBlocked} from '../src/gen/dungeon';
import {createMaiden} from '../src/entities/maiden';
import {createHunt,rearThreat,rearThreatDirection,chooseSpawn} from '../src/systems/hunt';
import {createDevices,activateDevice,lureFor,visionRange,deviceTarget,nearestDevice} from '../src/systems/devices';

describe('quiet opening, bounded population and sensory warning',()=>{
 it('has no enemies or damage during the grace period despite loud noise',()=>{
  const layout=createDungeonLayout('opening'),hunt=createHunt(layout,layout.spawns.slice(0,2).map(createMaiden));
  hunt.noise(layout.start,100);
  for(const time of [0,10,24.99]){expect(hunt.update(time,.01,{...layout.start,yaw:0},[],()=>undefined,18).hits).toBe(0);expect(hunt.active()).toHaveLength(0);}
 });
 it('keeps rear spawns in reachable space across generated maps',()=>{
  let count=0;
  for(let i=0;i<100;i++)for(const yaw of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
   const layout=createDungeonLayout(String(i)),player={...layout.start,yaw},point=chooseSpawn(layout,player);
   if(!point)continue;count++;
   expect(Math.hypot(point.x-player.x,point.z-player.z)).toBeGreaterThanOrEqual(4.49);
   expect(hasDungeonSight(layout,player,point)).toBe(true);expect(isDungeonBlocked(layout,point)).toBe(false);
   expect((point.x-player.x)*Math.sin(yaw)+(point.z-player.z)*Math.cos(yaw)).toBeLessThan(0);
  }
  expect(count).toBeGreaterThan(0);
 });
 it('never exceeds three including the stalker and does not spawn all at once',()=>{
  const layout=createDungeonLayout('opening'),hunt=createHunt(layout,layout.spawns.slice(0,2).map(createMaiden));
  const yaw=[0,Math.PI/2,Math.PI,Math.PI*1.5].find(yaw=>chooseSpawn(layout,{...layout.start,yaw}));
  if(yaw===undefined)throw new Error('Fixture needs rear space');const player={...layout.start,yaw};
  hunt.update(100,.01,player,[],()=>undefined,18);expect(hunt.active()).toHaveLength(1);
  hunt.update(100.1,.01,player,[],()=>undefined,18);expect(hunt.active()).toHaveLength(1);
  for(let time=115;time<300;time+=15){hunt.update(time,.01,player,[],()=>undefined,18);expect(hunt.active().length).toBeLessThanOrEqual(3);}
 });
 it('warns only for a visible pursuing enemy behind the player',()=>{
  const layout=createDungeonLayout('warning'),player={...layout.start,yaw:0};
  const maiden=createMaiden({x:player.x,z:player.z-2});maiden.mode='chase';
  expect(rearThreat(layout,player,[maiden])).toBeGreaterThan(0);
  expect(rearThreat(layout,{...player,yaw:Math.PI},[maiden])).toBe(0);
  maiden.mode='wander';expect(rearThreat(layout,player,[maiden])).toBe(0);
 });
 it('does not warn through solid walls',()=>{
  const layout=createDungeonLayout('warning'),player={...layout.start,yaw:0};
  const maiden=createMaiden({x:player.x,z:player.z-2});maiden.mode='chase';
  const cells=layout.cells.slice();cells[Math.floor(player.z-1)*layout.size+Math.floor(player.x)]=0;
  expect(rearThreat({...layout,cells},player,[maiden])).toBe(0);
 });
 it('reports which side a pursuing woman is approaching from',()=>{
  const layout=createDungeonLayout('warning'),player={...layout.start,yaw:0};
  const left=createMaiden({x:player.x-2,z:player.z-2});left.mode='chase';
  const right=createMaiden({x:player.x+2,z:player.z-2});right.mode='chase';
  expect(rearThreatDirection(layout,player,[left]).side).toBe('left');
  expect(rearThreatDirection(layout,player,[right]).side).toBe('right');
 });
 it('gives a visible turn-and-breathe warning before a spawned pursuit begins',()=>{
  const layout=createDungeonLayout('opening'),hunt=createHunt(layout,layout.spawns.slice(0,2).map(createMaiden));
  const yaw=[0,Math.PI/2,Math.PI,Math.PI*1.5].find(yaw=>chooseSpawn(layout,{...layout.start,yaw}));
  if(yaw===undefined)throw new Error('Fixture needs rear space');
  const outcome=hunt.update(100,.01,{...layout.start,yaw},[],()=>undefined,18);
  expect(outcome.spawnedSlot).toBe(0);
  expect(hunt.active()[0].mode).toBe('notice');
 });
 it('lets an observed woman turn from her routine before following instead of teleporting',()=>{
  const layout=createDungeonLayout('observed'),maiden=createMaiden(layout.spawns[1]),hunt=createHunt(layout,[maiden,createMaiden(layout.spawns[2])]);
  const before={x:maiden.x,z:maiden.z};hunt.observe(0);
  const outcome=hunt.update(25,.01,{...layout.start,yaw:0},[],()=>undefined,18);
  expect(outcome.spawnedSlot).toBe(0);
  expect({x:maiden.x,z:maiden.z}).toEqual(before);
  expect(maiden.mode).toBe('notice');
 });
});
describe('interactive dungeon devices',()=>{
 it('lures to the machine for twelve seconds with a separate cooldown',()=>{
  const layout=createDungeonLayout('devices'),devices=createDevices(layout),device=devices[0];
  expect(activateDevice(device,10)).toBe('gacha');
  expect(lureFor(devices,layout.start,21.9)).toEqual(deviceTarget(device));
  expect(lureFor(devices,layout.start,22)).toBeUndefined();
  expect(activateDevice(device,34.9)).toBe('cooldown');expect(activateDevice(device,35)).toBe('gacha');
 });
 it('limits interaction to a nearby device',()=>{
  const layout=createDungeonLayout('devices'),devices=createDevices(layout);
  expect(nearestDevice(devices,deviceTarget(devices[0]))).toBe(devices[0]);
  expect(nearestDevice(devices,{x:0,z:0})).toBeUndefined();
 });
 it('reduces normal visibility only while the room light is off',()=>{
  const layout=createDungeonLayout('devices'),devices=createDevices(layout);
  const device=devices.find(d=>d.kind==='switch');if(!device)throw new TypeError('Missing switch');
  const room=layout.rooms[device.room],point={x:room.x+room.width/2,z:room.z+room.depth/2};device.lit=true;
  expect(activateDevice(device,0)).toBe('light-off');expect(visionRange(layout,devices,point)).toBe(7);
  expect(activateDevice(device,0)).toBe('light-on');expect(visionRange(layout,devices,point)).toBe(18);
 });
 it('redirects a chasing maiden from the player toward an active machine',()=>{
  const layout=createDungeonLayout('devices'),normal=createMaiden({x:layout.start.x+2,z:layout.start.z});normal.mode='chase';
  const hunt=createHunt(layout,[normal,createMaiden(layout.spawns[1])]);hunt.present[0]=true;
  const devices=createDevices(layout);activateDevice(devices[0],30);
  hunt.update(30,.1,{...layout.start,yaw:0},[],p=>lureFor(devices,p,30),18);
  expect(normal.target).toEqual(deviceTarget(devices[0]));expect(normal.mode).toBe('alert');
 });
 it('changes actual room positions across seeds while keeping device targets walkable',()=>{
  const signatures=new Set<string>();
  for(let i=0;i<20;i++){
   const layout=createDungeonLayout(String(i));signatures.add(JSON.stringify(layout.rooms.map(r=>[r.x,r.z])));
   for(const device of createDevices(layout))expect(isDungeonBlocked(layout,deviceTarget(device))).toBe(false);
  }
  expect(signatures.size).toBe(20);
 });
});
