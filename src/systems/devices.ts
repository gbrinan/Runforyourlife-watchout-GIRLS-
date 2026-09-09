import type { Point } from '../entities/maiden';
import type { DungeonLayout } from '../gen/dungeon';
export type Device={readonly kind:'gacha'|'switch';readonly room:number;readonly point:Point;readonly yaw?:number;activeUntil:number;readyAt:number;lit:boolean};
export function createDevices(layout:DungeonLayout):Device[] {
  return (layout.sockets??[]).map(socket=>({...socket,activeUntil:0,readyAt:0}));
}
export function deviceTarget(device:Device):Point{return {x:device.point.x+Math.sin(device.yaw??Math.PI/2)*1.3,z:device.point.z+Math.cos(device.yaw??Math.PI/2)*1.3};}
export function nearestDevice(devices:readonly Device[],player:Point):Device|undefined {
  return devices.filter(d=>Math.hypot(d.point.x-player.x,d.point.z-player.z)<=2.6).sort((a,b)=>Math.hypot(a.point.x-player.x,a.point.z-player.z)-Math.hypot(b.point.x-player.x,b.point.z-player.z))[0];
}
export function activateDevice(device:Device,time:number):'gacha'|'cooldown'|'light-on'|'light-off' {
  if(device.kind==='switch'){device.lit=!device.lit;return device.lit?'light-on':'light-off';}
  if(time<device.readyAt)return 'cooldown';
  device.activeUntil=time+12;device.readyAt=time+25;return 'gacha';
}
export function lureFor(devices:readonly Device[],point:Point,time:number):Point|undefined {
  const device=devices.filter(d=>d.kind==='gacha'&&d.activeUntil>time&&Math.hypot(d.point.x-point.x,d.point.z-point.z)<40).sort((a,b)=>b.activeUntil-a.activeUntil)[0];
  return device?deviceTarget(device):undefined;
}
export function visionRange(layout:DungeonLayout,devices:readonly Device[],player:Point):number {
  const index=layout.rooms.findIndex(r=>player.x>=r.x&&player.x<r.x+r.width&&player.z>=r.z&&player.z<r.z+r.depth);
  return devices.some(d=>d.kind==='switch'&&d.room===index&&!d.lit)?7:18;
}

