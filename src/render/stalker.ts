import * as THREE from 'three';
import { createMaidenModel } from './maiden-model';
import { STALKER_LOOK } from '../entities/maiden-variants';
import { SEAL_RADIUS } from '../systems/stalker';
import type { Stalker } from '../systems/stalker';
import type { Point } from '../entities/maiden';

export function createStalkerScene(seals:readonly Point[]) {
  const group=new THREE.Group();
  const model=createMaidenModel(STALKER_LOOK);group.add(model.group);
  const sigils:THREE.Group[]=[];
  for(const point of seals) {
    const seal=new THREE.Group();seal.position.set(point.x,.025,point.z);group.add(seal);sigils.push(seal);
    const material=new THREE.MeshBasicMaterial({color:0x8eece0,transparent:true,opacity:.8,side:THREE.DoubleSide});
    for(const radius of [SEAL_RADIUS,SEAL_RADIUS*.72]){
      const ring=new THREE.Mesh(new THREE.RingGeometry(radius-.035,radius,64),material);ring.rotation.x=-Math.PI/2;seal.add(ring);
    }
    const vertices:number[]=[];
    for(let i=0;i<=5;i++){const angle=i*4*Math.PI/5;vertices.push(Math.sin(angle)*1.12,.004,Math.cos(angle)*1.12);}
    const star=new THREE.Line(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(vertices,3)),new THREE.LineBasicMaterial({color:0x8eece0}));seal.add(star);
    const light=new THREE.PointLight(0x8eece0,3,4,2);light.position.y=.4;seal.add(light);
  }
  let oldX=0,oldZ=0;
  return {group,draw(stalker:Stalker,time:number,present=true){
    const body=stalker.body;model.group.visible=present&&!stalker.sealed;
    model.group.position.set(body.x,0,body.z);model.group.rotation.set(0,body.yaw,body.mode==='stunned'?.25:0);
    model.animate(time,Math.hypot(body.x-oldX,body.z-oldZ)>.0001,body.mode==='attack',body.mode==='stunned');oldX=body.x;oldZ=body.z;
    for(const seal of sigils)seal.visible=!stalker.sealed;
  }};
}
