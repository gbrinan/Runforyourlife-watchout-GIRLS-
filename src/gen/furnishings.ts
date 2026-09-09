import type {Point} from '../entities/maiden';
import type {DungeonLayout} from './dungeon';
import type {RNG} from '../core/rng';
export type Socket={readonly kind:'gacha'|'switch';readonly room:number;readonly point:Point;readonly yaw:number;readonly lit:boolean};
export type Exit={readonly point:Point;readonly normal:Point;readonly inside:Point;readonly outside:Point};
type Wall={readonly room:number;readonly point:Point;readonly normal:Point};
export function furnishDungeon(layout:DungeonLayout,rng:RNG):{sockets:Socket[];exit:Exit} {
 const walls:Wall[]=[];
 const open=(x:number,z:number)=>x>=1&&z>=1&&x<layout.size-1&&z<layout.size-1&&layout.cells[Math.floor(z)*layout.size+Math.floor(x)]===0;
 layout.rooms.forEach((r,room)=>{
  for(let offset=2;offset<r.width-2;offset++)for(const [z,nz] of [[r.z,-1],[r.z+r.depth,1]])walls.push({room,point:{x:r.x+offset+.5,z},normal:{x:0,z:nz}});
  for(let offset=2;offset<r.depth-2;offset++)for(const [x,nx] of [[r.x,-1],[r.x+r.width,1]])walls.push({room,point:{x,z:r.z+offset+.5},normal:{x:nx,z:0}});
 });
 const solid=walls.filter(w=>{
  const r=layout.rooms[w.room];
  if(w.normal.x===-1&&Math.abs(w.point.z-r.z-r.depth/2)<1.5)return false;
  if(w.normal.x===1&&Math.abs(w.point.z-r.z-2.7)<1.7)return false;
  if(w.room===0&&w.normal.z===-1&&Math.abs(w.point.x-r.x-r.width/2)<1.4)return false;
  return open(w.point.x+w.normal.x*.5,w.point.z+w.normal.z*.5);
 });
 const exits=solid.filter(w=>[.5,1.5,2.5,3.5].every(d=>[-1,0,1].every(s=>open(w.point.x+w.normal.x*d+w.normal.z*s,w.point.z+w.normal.z*d-w.normal.x*s))));
 exits.sort((a,b)=>Math.hypot(b.point.x-layout.start.x,b.point.z-layout.start.z)-Math.hypot(a.point.x-layout.start.x,a.point.z-layout.start.z));
 const wall=exits[Math.floor(rng()*Math.min(5,exits.length))];
 if(!wall)throw new RangeError('No exterior wall for EXIT');
 const exit:Exit={point:wall.point,normal:wall.normal,inside:{x:wall.point.x-wall.normal.x*2,z:wall.point.z-wall.normal.z*2},outside:{x:wall.point.x+wall.normal.x*2.5,z:wall.point.z+wall.normal.z*2.5}};
 for(const d of [.5,1.5,2.5,3.5])for(const s of [-1,0,1])layout.cells[Math.floor(wall.point.z+wall.normal.z*d-wall.normal.x*s)*layout.size+Math.floor(wall.point.x+wall.normal.x*d+wall.normal.z*s)]=1;
 const sockets:Socket[]=[];
 layout.rooms.forEach((_,room)=>{
  const candidates=solid.filter(w=>w.room===room&&Math.hypot(w.point.x-exit.point.x,w.point.z-exit.point.z)>4);
  for(const kind of ['gacha','switch'] as const){
   if((kind==='gacha'&&room!==0&&rng()<.55)||(kind==='switch'&&room!==1&&rng()<.3))continue;
   const available=candidates.filter(w=>sockets.every(s=>Math.hypot(s.point.x-w.point.x,s.point.z-w.point.z)>2.5));
   const w=available[Math.floor(rng()*available.length)];if(!w)continue;
   sockets.push({kind,room,point:{x:w.point.x-w.normal.x*.3,z:w.point.z-w.normal.z*.3},yaw:Math.atan2(-w.normal.x,-w.normal.z),lit:room===0||rng()>.45});
  }
 });
 return {sockets,exit};
}
