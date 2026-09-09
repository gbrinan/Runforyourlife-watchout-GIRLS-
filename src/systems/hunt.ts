import {hearNoise,updateMaiden} from '../entities/maiden';
import type {Maiden,Point} from '../entities/maiden';
import {hasDungeonSight,isDungeonBlocked,dungeonWaypoint} from '../gen/dungeon';
import type {DungeonLayout} from '../gen/dungeon';
import {createStalker,alertStalker,updateStalker} from './stalker';
import {latestTrack} from './tracks';
import type {Track} from './tracks';
export const SPAWN_TIMES=[25,45,70] as const;
export function chooseSpawn(layout:DungeonLayout,player:Point&{readonly yaw:number},occupied:readonly Point[]=[]):Point|undefined {
  for(const distance of [4.5,5.5,6.5])for(const offset of [0,.25,-.25,.5,-.5,.7,-.7]){
    const angle=player.yaw+Math.PI+offset;
    const point={x:player.x+Math.sin(angle)*distance,z:player.z+Math.cos(angle)*distance};
    if(!isDungeonBlocked(layout,point)&&hasDungeonSight(layout,player,point)&&occupied.every(q=>Math.hypot(q.x-point.x,q.z-point.z)>3))return point;
  }
  return undefined;
}
export function rearThreat(layout:DungeonLayout,player:Point&{readonly yaw:number},maidens:readonly Maiden[]):number {
  return rearThreatDirection(layout,player,maidens).strength;
}
export type ThreatSide='left'|'center'|'right';
export function rearThreatDirection(layout:DungeonLayout,player:Point&{readonly yaw:number},maidens:readonly Maiden[]):{readonly strength:number;readonly side:ThreatSide} {
  let strength=0;
  let side:ThreatSide='center';
  for(const enemy of maidens){
    if(enemy.mode!=='notice'&&enemy.mode!=='chase'&&enemy.mode!=='lunge'&&enemy.mode!=='attack')continue;
    const dx=enemy.x-player.x,dz=enemy.z-player.z,distance=Math.hypot(dx,dz);
    const candidate=1-distance/12;
    if(distance<12&&(Math.sin(player.yaw)*dx+Math.cos(player.yaw)*dz)<0&&hasDungeonSight(layout,player,enemy)&&candidate>strength){
      strength=candidate;
      const lateral=Math.cos(player.yaw)*dx-Math.sin(player.yaw)*dz;
      side=lateral<-.5?'left':lateral>.5?'right':'center';
    }
  }
  return {strength,side};
}
export function createHunt(layout:DungeonLayout,normals:readonly Maiden[]) {
  const present=[false,false,false],observed=[false,false,false];let lastSpawn=-Infinity;const stalker=createStalker(layout.spawns[0]);
  const active=()=>[...normals.filter((_,i)=>present[i]),...(present[2]&&!stalker.sealed?[stalker.body]:[])];
  return {present,stalker,active,observe(index:number){
    if(index<0||index>=observed.length)return;
    observed[index]=true;
    const body=index===2?stalker.body:normals[index];body.mode='notice';body.timer=Infinity;
  },
    noise(point:Point,radius:number){for(const maiden of normals.filter((_,i)=>present[i]))hearNoise(maiden,{position:point,radius});if(present[2])alertStalker(stalker,point,radius);},
    update(time:number,dt:number,player:Point&{readonly yaw:number},tracks:Track[],lure:(p:Point)=>Point|undefined,range:number):{hits:number;spawned:boolean;spawnedSlot:number|undefined;lungingSlot:number|undefined} {
      let spawnedSlot:number|undefined,lungingSlot:number|undefined,hits=0;
      const slot=present.findIndex((value,i)=>!value&&time>=SPAWN_TIMES[i]);
      if(slot>=0&&time-lastSpawn>=15){
        const body=slot===2?stalker.body:normals[slot];
        const point=observed[slot]?{x:body.x,z:body.z}:chooseSpawn(layout,player,active());
        if(point){body.x=point.x;body.z=point.z;body.yaw=Math.atan2(player.x-point.x,player.z-point.z);body.target={x:player.x,z:player.z};body.mode='notice';body.timer=1.5;if(slot===2)stalker.awakened=true;present[slot]=true;spawnedSlot=slot;lastSpawn=time;}
      }
      for(const [index,maiden] of normals.entries()) {
        if(!present[index])continue;
        if(isDungeonBlocked(layout,maiden.target))maiden.target={x:maiden.x,z:maiden.z};
        if(maiden.mode==='search'){const track=latestTrack(tracks,{point:maiden,time});if(track)maiden.target=track;}
        const attraction=lure(maiden);
        if(attraction&&maiden.mode!=='stunned'){maiden.target=attraction;maiden.mode='alert';}
        const dx=player.x-maiden.x,dz=player.z-maiden.z,distance=Math.hypot(dx,dz);
        const cone=distance<1.4||(Math.sin(maiden.yaw)*dx+Math.cos(maiden.yaw)*dz)>=distance*Math.SQRT1_2;
        const visible=!attraction&&distance<=range&&cone&&hasDungeonSight(layout,maiden,player);
        const previous={x:maiden.x,z:maiden.z};
        const previousMode=maiden.mode;
        const hit=updateMaiden(maiden,{player,visible,allowChase:true,waypoint:dungeonWaypoint(layout,maiden,visible?player:maiden.target)},dt);
        if(previousMode!=='lunge'&&maiden.mode==='lunge')lungingSlot=index;
        if(isDungeonBlocked(layout,maiden)){maiden.x=previous.x;maiden.z=previous.z;}
        if(hit)hits++;
      }
      if(present[2]&&!stalker.sealed){
        const attraction=lure(stalker.body);
        if(attraction)stalker.awakened=true;
        const previousMode=stalker.body.mode;
        const hit=updateStalker(stalker,layout,attraction??player,dt);
        if(previousMode!=='lunge'&&stalker.body.mode==='lunge')lungingSlot=2;
        if(hit&&!attraction)hits++;
      }
      return {hits,spawned:spawnedSlot!==undefined,spawnedSlot,lungingSlot};
    },
  };
}
