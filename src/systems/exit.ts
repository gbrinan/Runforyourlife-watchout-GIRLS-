import type {Point} from '../entities/maiden';
import type {Exit} from '../gen/furnishings';
export function crossedExit(exit:Exit,previous:Point,current:Point):boolean {
 const depth=(p:Point)=>(p.x-exit.point.x)*exit.normal.x+(p.z-exit.point.z)*exit.normal.z;
 const before=depth(previous),after=depth(current);
 if(before>=1.8||after<1.8)return false;
 const ratio=(1.8-before)/(after-before);
 const x=previous.x+(current.x-previous.x)*ratio-exit.point.x;
 const z=previous.z+(current.z-previous.z)*ratio-exit.point.z;
 return Math.abs(x*exit.normal.z-z*exit.normal.x)<1.2;
}
