import { createMaiden } from '../entities/maiden';
import type { Point } from '../entities/maiden';
import { dungeonWaypoint, hasDungeonSight, isDungeonBlocked } from '../gen/dungeon';
import type { DungeonLayout } from '../gen/dungeon';
import { ramInDungeon } from './dungeon-combat';

export const SEAL_RADIUS=1.6;
export function sealPositions(layout:DungeonLayout):readonly Point[] {
  return [layout.rooms[0],layout.rooms[3]].map(room=>({x:room.x+room.width/2,z:room.z+room.depth/2}));
}
export function createStalker(point:Point) {
  return {body:createMaiden(point),awakened:false,sealed:false};
}
export type Stalker=ReturnType<typeof createStalker>;
export function insideSeal(point:Point,seals:readonly Point[]):boolean {
  return seals.some(seal=>Math.hypot(point.x-seal.x,point.z-seal.z)<=SEAL_RADIUS);
}
export function alertStalker(stalker:Stalker,player:Point,radius:number) {
  if(!stalker.sealed&&radius>0&&Math.hypot(stalker.body.x-player.x,stalker.body.z-player.z)<=radius)stalker.awakened=true;
}
export function updateStalker(stalker:Stalker,layout:DungeonLayout,player:Point,dt:number):boolean {
  if(stalker.sealed)return false;
  const body=stalker.body;
  const visible=Math.hypot(body.x-player.x,body.z-player.z)<18&&hasDungeonSight(layout,body,player);
  if(visible)stalker.awakened=true;
  if(!stalker.awakened)return false;
  if(body.mode==='notice'){
    body.timer=Math.max(0,body.timer-dt);
    if(body.timer>Number.EPSILON)return false;
    body.mode='chase';
  }else if(body.mode==='lunge'){
    body.timer=Math.max(0,body.timer-dt);
    if(body.timer>Number.EPSILON)return false;
    if(Math.hypot(body.x-player.x,body.z-player.z)<=1.6&&hasDungeonSight(layout,body,player)){body.mode='attack';body.timer=2;return true;}
    body.mode='chase';
  }else if(body.timer>0){body.timer=Math.max(0,body.timer-dt);return false;}
  body.mode='chase';body.target={...player};
  const waypoint=dungeonWaypoint(layout,body,player);
  const dx=waypoint.x-body.x,dz=waypoint.z-body.z,distance=Math.hypot(dx,dz);
  if(distance>.001){
    body.yaw=Math.atan2(dx,dz);
    const step=Math.min(distance,2.8*dt);
    const next={x:body.x+dx/distance*step,z:body.z+dz/distance*step};
    if(!isDungeonBlocked(layout,next)){body.x=next.x;body.z=next.z;}
  }
  if(Math.hypot(body.x-player.x,body.z-player.z)<=1.4&&hasDungeonSight(layout,body,player)) {
    body.mode='lunge';body.timer=.8;return false;
  }
  return false;
}
export function ramStalker(stalker:Stalker,layout:DungeonLayout,player:Point&{readonly yaw:number},seals:readonly Point[]):'miss'|'repelled'|'sealed' {
  if(stalker.sealed)return 'miss';
  const vulnerable=insideSeal(stalker.body,seals);
  stalker.body.ramHits=0;
  const result=ramInDungeon(layout,stalker.body,player);
  if(result!=='pushed')return 'miss';
  stalker.awakened=true;
  if(vulnerable){stalker.sealed=true;stalker.body.mode='stunned';stalker.body.timer=Infinity;return 'sealed';}
  stalker.body.timer=.7;
  return 'repelled';
}
