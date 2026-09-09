import {createRng} from '../core/rng';
import {hasDungeonRoute} from '../gen/dungeon';
import type {DungeonLayout} from '../gen/dungeon';
import type {Point} from '../entities/maiden';
import type {Exit} from '../gen/furnishings';
export const BELL_NAMES=['달','눈','가시'] as const;
export type Puzzle={readonly bells:readonly {readonly id:number;readonly point:Point}[];readonly clue:Point;readonly order:readonly number[];progress:number;solved:boolean;read:boolean;alarm:number};
export function createPuzzle(layout:DungeonLayout,seed:string):Puzzle{
  const room=layout.rooms[0],points:Point[]=[];
  for(let z=room.z+1.5;z<room.z+room.depth-1;z+=2)for(let x=room.x+1.5;x<room.x+room.width-1;x+=2){
    const point={x,z};
    if(Math.hypot(x-layout.start.x,z-layout.start.z)>1.4&&hasDungeonRoute(layout,layout.start,point))points.push(point);
  }
  if(points.length<4)throw new RangeError('No reachable puzzle placement');
  const rng=createRng(seed+':bells'),order=[0,1,2];
  for(let i=2;i>0;i--){const j=Math.floor(rng()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  return {bells:points.slice(0,3).map((point,id)=>({id,point})),clue:points[3],order,progress:0,solved:false,read:false,alarm:0};
}
export function ringBell(puzzle:Puzzle,id:number):'wrong'|'correct'|'solved'{
  if(puzzle.solved)return 'solved';
  if(id!==puzzle.order[puzzle.progress]){puzzle.progress=0;puzzle.alarm=2;return 'wrong';}
  puzzle.progress++;
  if(puzzle.progress===3){puzzle.solved=true;return 'solved';}
  return 'correct';
}
export function puzzleTarget(puzzle:Puzzle,player:Point):number|'clue'|undefined{
  const points=[...puzzle.bells.map(b=>({id:b.id,point:b.point})),{id:'clue' as const,point:puzzle.clue}];
  return points.filter(p=>Math.hypot(p.point.x-player.x,p.point.z-player.z)<1.45)
    .sort((a,b)=>Math.hypot(a.point.x-player.x,a.point.z-player.z)-Math.hypot(b.point.x-player.x,b.point.z-player.z))[0]?.id;
}
export function clueText(puzzle:Puzzle):string{
  return `먼저 ${BELL_NAMES[puzzle.order[0]]}의 종, 마지막 ${BELL_NAMES[puzzle.order[2]]}의 종.\n남은 종은 두 종 사이에 울려라.`;
}
export function exitSealed(exit:Exit,point:Point,solved:boolean):boolean{
  const distance=(point.x-exit.point.x)*exit.normal.x+(point.z-exit.point.z)*exit.normal.z;
  const side=Math.abs((point.x-exit.point.x)*exit.normal.z-(point.z-exit.point.z)*exit.normal.x);
  return !solved&&distance>-.35&&distance<3.8&&side<1.8;
}
