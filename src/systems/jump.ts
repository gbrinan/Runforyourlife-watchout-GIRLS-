export type Jump={height:number;velocity:number};
export function createJump():Jump{return {height:0,velocity:0};}
export function startJump(jump:Jump):boolean{
  if(jump.height>0||jump.velocity!==0)return false;
  jump.velocity=3.8;return true;
}
export function stepJump(jump:Jump,dt:number):boolean{
  if(jump.height===0&&jump.velocity===0)return false;
  jump.height+=jump.velocity*dt-6*dt*dt;jump.velocity-=12*dt;
  if(jump.height>0)return false;
  jump.height=0;jump.velocity=0;return true;
}
