import {furnishDungeon} from './furnishings';
import type {Socket,Exit} from './furnishings';
import { createRng } from '../core/rng';
import type { Point } from '../entities/maiden';

export type Room = {
  readonly x: number;
  readonly z: number;
  readonly width: number;
  readonly depth: number;
};

export type DungeonLayout = {
  readonly size: number;
  readonly cells: Uint8Array;
  readonly rooms: readonly Room[];
  readonly start: Point;
  readonly spawns: readonly Point[];
  readonly fixtures?: readonly Point[];
  readonly sockets?: readonly Socket[];
};

export function createDungeonLayout(seed:string):DungeonLayout & {readonly fixtures:readonly Point[];readonly sockets:readonly Socket[];readonly exit:Exit} {
  const rng=createRng(seed+':basement');
  const size=64,cells=new Uint8Array(size*size);
  const slots=Array.from({length:9},(_,i)=>i);
  for(let i=slots.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[slots[i],slots[j]]=[slots[j],slots[i]];}
  const rooms=slots.slice(0,5+Math.floor(rng()*4)).map(slot=>({x:3+(slot%3)*20+Math.floor(rng()*4),z:3+Math.floor(slot/3)*20+Math.floor(rng()*3),width:8+Math.floor(rng()*7),depth:8+Math.floor(rng()*7)}));
  const centers=rooms.map(room=>({x:room.x+room.width/2,z:room.z+room.depth/2}));
  for(const room of rooms)for(let z=room.z;z<room.z+room.depth;z++)for(let x=room.x;x<room.x+room.width;x++)cells[z*size+x]=1;
  function corridor(from:Point,to:Point) {
    const corner=rng()<.5?{x:to.x,z:from.z}:{x:from.x,z:to.z};
    for(const [start,end] of [[from,corner],[corner,to]]) {
      for(let x=Math.floor(Math.min(start.x,end.x));x<=Math.floor(Math.max(start.x,end.x));x++)
        for(let z=Math.floor(Math.min(start.z,end.z));z<=Math.floor(Math.max(start.z,end.z));z++)
          for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)cells[(z+dz)*size+x+dx]=1;
    }
  }
  for(let i=1;i<centers.length;i++)corridor(centers[i-1],centers[i]);
  for(let i=0;i<1+Math.floor(rng()*3);i++)corridor(centers[i],centers[centers.length-1-i]);
  const base={size,cells,rooms,start:centers[0],spawns:centers.slice(1)};
  const {sockets,exit}=furnishDungeon(base,rng);
  const fixtures=sockets.filter(s=>s.kind==='gacha').map(s=>s.point);
  const layout={...base,fixtures,sockets,exit};
  if(!hasDungeonRoute(layout,layout.start,layout.exit.outside))throw new RangeError('Generated EXIT is unreachable');
  return layout;
}

export function isDungeonBlocked(layout: DungeonLayout, point: Point): boolean {
  if(layout.fixtures?.some(p=>Math.abs(p.x-point.x)<.8&&Math.abs(p.z-point.z)<.8))return true;
  for (const dx of [-0.3, 0.3]) {
    for (const dz of [-0.3, 0.3]) {
      const x = Math.floor(point.x + dx);
      const z = Math.floor(point.z + dz);
      if (x < 0 || z < 0 || x >= layout.size || z >= layout.size || layout.cells[z * layout.size + x] !== 1) return true;
    }
  }
  return false;
}

export function hasDungeonSight(layout: DungeonLayout, from: Point, to: Point): boolean {
  const crossings = [0, 1];
  // Capsule occupancy changes only when an offset corner crosses a grid line.
  for (const axis of ['x', 'z'] as const) {
    const delta = to[axis] - from[axis];
    if (delta === 0) continue;
    for (const offset of [-0.3, 0.3]) {
      const low = Math.min(from[axis], to[axis]) + offset;
      const high = Math.max(from[axis], to[axis]) + offset;
      for (let boundary = Math.ceil(low); boundary <= high; boundary++) {
        const ratio = (boundary - offset - from[axis]) / delta;
        if (ratio > 0 && ratio < 1) crossings.push(ratio);
      }
    }
  }
  crossings.sort((a, b) => a - b);
  for (let index = 0; index < crossings.length; index++) {
    for (const ratio of [crossings[index], (crossings[index] + (crossings[index + 1] ?? crossings[index])) / 2]) {
      if (isDungeonBlocked(layout, { x: from.x + (to.x - from.x) * ratio, z: from.z + (to.z - from.z) * ratio })) return false;
    }
  }
  return true;
}

export function dungeonWaypoint(layout: DungeonLayout, from: Point, to: Point): Point {
  if (isDungeonBlocked(layout, from) || isDungeonBlocked(layout, to)) return from;
  const origin = Math.floor(from.z) * layout.size + Math.floor(from.x);
  const goal = Math.floor(to.z) * layout.size + Math.floor(to.x);
  if (origin === goal) return to;
  const parents = new Int32Array(layout.cells.length).fill(-1);
  const queue = [origin];
  parents[origin] = origin;
  for (let head = 0; head < queue.length && parents[goal] === -1; head++) {
    const current = queue[head];
    const x = current % layout.size;
    const z = Math.floor(current / layout.size);
    for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const nx = x + dx;
      const nz = z + dz;
      const next = nz * layout.size + nx;
      if (nx < 0 || nz < 0 || nx >= layout.size || nz >= layout.size || layout.cells[next] !== 1 || isDungeonBlocked(layout,{x:nx+.5,z:nz+.5}) || parents[next] !== -1) continue;
      parents[next] = current;
      queue.push(next);
    }
  }
  if (parents[goal] === -1) return from;
  let next = goal;
  while (parents[next] !== origin) next = parents[next];
  const waypoint = { x: next % layout.size + 0.5, z: Math.floor(next / layout.size) + 0.5 };
  return hasDungeonSight(layout, from, waypoint)
    ? waypoint
    : { x: origin % layout.size + 0.5, z: Math.floor(origin / layout.size) + 0.5 };
}

export function hasDungeonRoute(layout:DungeonLayout,from:Point,to:Point):boolean {
  if(isDungeonBlocked(layout,from)||isDungeonBlocked(layout,to))return false;
  const origin=Math.floor(from.z)*layout.size+Math.floor(from.x);
  const goal=Math.floor(to.z)*layout.size+Math.floor(to.x);
  const visited=new Uint8Array(layout.cells.length),queue=[origin];
  visited[origin]=1;
  for(let head=0;head<queue.length;head++){
    const current=queue[head];
    if(current===goal)return true;
    const x=current%layout.size,z=Math.floor(current/layout.size);
    for(const [dx,dz] of [[1,0],[0,1],[-1,0],[0,-1]]){
      const nx=x+dx,nz=z+dz,next=nz*layout.size+nx;
      if(nx<0||nz<0||nx>=layout.size||nz>=layout.size||visited[next]||isDungeonBlocked(layout,{x:nx+.5,z:nz+.5}))continue;
      visited[next]=1;queue.push(next);
    }
  }
  return false;
}


