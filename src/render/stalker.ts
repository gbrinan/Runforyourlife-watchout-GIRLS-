import * as THREE from 'three';
import { createMaidenModel } from './maiden-model';
import { STALKER_LOOK } from '../entities/maiden-variants';
import { SEAL_RADIUS } from '../systems/stalker';
import type { Stalker } from '../systems/stalker';
import type { Point } from '../entities/maiden';

export function createStalkerScene(seals:readonly Point[],tableau:Point) {
  const group=new THREE.Group();
  const model=createMaidenModel(STALKER_LOOK);group.add(model.group);
  const television=createTelevision(tableau);group.add(television);
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
  return {group,draw(stalker:Stalker,time:number,present=true,viewer?:Point){
    const body=stalker.body;model.group.visible=!stalker.sealed;
    model.group.position.set(body.x,0,body.z);model.group.rotation.set(0,body.yaw,body.mode==='stunned'?.25:0);
    const targetYaw=viewer?normalizeAngle(Math.atan2(viewer.x-body.x,viewer.z-body.z)-body.yaw):0;
    model.animate(time,Math.hypot(body.x-oldX,body.z-oldZ)>.0001,body.mode,!present,targetYaw);oldX=body.x;oldZ=body.z;
    const screen=television.children[1];if(screen instanceof THREE.Mesh&&screen.material instanceof THREE.MeshStandardMaterial)screen.material.emissiveIntensity=.8+Math.sin(time*17)*.12;
    for(const seal of sigils)seal.visible=!stalker.sealed;
  }};
}

function normalizeAngle(angle:number):number {
  let value=angle;while(value>Math.PI)value-=Math.PI*2;while(value<-Math.PI)value+=Math.PI*2;return value;
}

function createTelevision(point:Point):THREE.Group {
  const group=new THREE.Group();group.position.set(point.x-1.3,0,point.z);group.rotation.y=Math.PI/2;
  const frame=new THREE.Mesh(new THREE.BoxGeometry(1.25,1,.25),new THREE.MeshStandardMaterial({color:0x15171b,roughness:.72}));frame.position.y=1.25;group.add(frame);
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=320;
  const context=canvas.getContext('2d');
  if(context){context.fillStyle='#9bbcc4';context.fillRect(0,0,512,320);context.fillStyle='#eef4e8';context.fillRect(0,220,512,100);context.fillStyle='#332b39';context.beginPath();context.ellipse(250,175,115,65,0,0,Math.PI*2);context.fill();context.fillRect(330,88,42,120);context.beginPath();context.moveTo(350,95);context.lineTo(392,52);context.lineTo(377,112);context.fill();for(const x of [195,245,300,342])context.fillRect(x,205,18,92);context.fillStyle='#fff7ee';context.font='700 32px "Malgun Gothic", sans-serif';context.textAlign='center';context.fillText('말 영상 · 09:17:33',256,45);}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(1.05,.72),new THREE.MeshStandardMaterial({map:texture,emissiveMap:texture,emissive:0xffffff,emissiveIntensity:.9}));screen.position.set(0,1.25,.131);group.add(screen);
  const stand=new THREE.Mesh(new THREE.BoxGeometry(.7,.75,.45),new THREE.MeshStandardMaterial({color:0x343942,roughness:.85}));stand.position.y=.38;group.add(stand);
  return group;
}
