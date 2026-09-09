import * as THREE from 'three';
import { MAIDEN_LOOKS } from '../entities/maiden-variants';
import type { MaidenLook } from '../entities/maiden-variants';
import { createMaidenModel } from './maiden-model';
import { createMaiden } from '../entities/maiden';
import type { Point } from '../entities/maiden';
import type { Heightmap } from '../gen/heightmap';
import { sampleHeight } from '../gen/heightmap';
import type { Track } from '../systems/tracks';

export function createEncounter(map:Heightmap,spawns:readonly Point[],lookOffset=0) {
  const group=new THREE.Group();
  const looks=spawns.map((_,index)=>MAIDEN_LOOKS[(index+lookOffset)%MAIDEN_LOOKS.length]);
  const maidens=spawns.map((spawn,index)=>createMaiden(spawn,looks[index].combat));
  const models=maidens.map((maiden,index)=>{
    maiden.yaw=-Math.PI/2;maiden.target={...maiden};
    const model=createMaidenModel(looks[index]);group.add(model.group);return model;
  });
  const routines=maidens.map((maiden,index)=>{
    const prop=createRoutineProp(looks[index]);
    prop.position.set(maiden.x-1.05,0,maiden.z);
    group.add(prop);
    return prop;
  });
  const previousPositions=maidens.map(maiden=>({x:maiden.x,z:maiden.z}));
  let lastTime=0;
  const prints=new THREE.InstancedMesh(new THREE.CircleGeometry(.1,6),new THREE.MeshBasicMaterial({color:0x31292c,side:THREE.DoubleSide}),256);
  prints.count=0;group.add(prints);const stamp=new THREE.Object3D();
  const draw=(tracks:readonly Track[],time:number,present:readonly boolean[]=maidens.map(()=>true),viewer?:Point)=> {
    prints.count=Math.min(256,tracks.length);
    for(let i=0;i<prints.count;i++) {
      const point=tracks[i].point;stamp.position.set(point.x,sampleHeight(map,point.x,point.z)+.02,point.z);
      stamp.rotation.x=-Math.PI/2;stamp.updateMatrix();prints.setMatrixAt(i,stamp.matrix);
    }
    prints.instanceMatrix.needsUpdate=true;
    maidens.forEach((maiden,index)=>{
      const model=models[index],figure=model.group;figure.visible=true;routines[index].visible=!present[index];
      figure.position.set(maiden.x,sampleHeight(map,maiden.x,maiden.z),maiden.z);
      figure.rotation.set(0,maiden.yaw,maiden.mode==='stunned'?.45:0);
      if(time!==lastTime){
        const previous=previousPositions[index];
        const moving=Math.hypot(maiden.x-previous.x,maiden.z-previous.z)>.0001;
        const targetYaw=viewer?Math.atan2(viewer.x-maiden.x,viewer.z-maiden.z)-maiden.yaw:0;
        model.animate(time,moving,maiden.mode,!present[index],normalizeAngle(targetYaw));
        previous.x=maiden.x;previous.z=maiden.z;
      }
    });
    lastTime=time;
  };
  draw([],0);return {group,maidens,looks,draw};
}

function normalizeAngle(angle:number):number {
  let value=angle;while(value>Math.PI)value-=Math.PI*2;while(value<-Math.PI)value+=Math.PI*2;return value;
}

function createRoutineProp(look:MaidenLook):THREE.Group {
  const group=new THREE.Group();
  const dark=new THREE.MeshStandardMaterial({color:0x252630,roughness:.75});
  const metal=new THREE.MeshStandardMaterial({color:0x718087,metalness:.45,roughness:.5});
  const pink=new THREE.MeshStandardMaterial({color:0xd981ad,emissive:0x5c243f,emissiveIntensity:.35});
  const canvas=document.createElement('canvas');canvas.width=384;canvas.height=128;
  const context=canvas.getContext('2d');
  if(context){context.fillStyle='#16191f';context.fillRect(0,0,384,128);context.strokeStyle='#d7c6a5';context.lineWidth=6;context.strokeRect(3,3,378,122);context.fillStyle='#fff7ee';context.textAlign='center';context.font='700 38px "Malgun Gothic", sans-serif';context.fillText(look.routine==='mirror'?'거울':look.routine==='attendance'?'출석부':look.routine==='locker'?'유니콘에게':look.routine==='gacha'?'마지막 상품':'말 영상',192,78);}
  const label=new THREE.Mesh(new THREE.PlaneGeometry(.78,.26),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),side:THREE.DoubleSide}));label.rotation.y=Math.PI/2;label.position.set(.43,1.22,0);if(look.routine!=='mirror')group.add(label);
  if(look.routine==='mirror'){
    const mirror=new THREE.Mesh(new THREE.BoxGeometry(.12,1.5,1.28),metal);mirror.position.y=1.05;group.add(mirror);
    for(const side of [-1,1]){
      const glass=new THREE.Mesh(new THREE.PlaneGeometry(1.06,1.15),new THREE.MeshStandardMaterial({color:0xb9e2ee,metalness:.65,roughness:.12,emissive:0x3f6672,emissiveIntensity:.55,side:THREE.DoubleSide}));glass.rotation.y=Math.PI/2;glass.position.set(.071*side,1.1,0);group.add(glass);
      for(const [y,z,tilt] of [[1.28,-.4,-.45],[1.06,-.4,.58],[1.07,.08,.22],[.86,.4,-.14]] as const){const smear=new THREE.Mesh(new THREE.BoxGeometry(.055,.34,.085),new THREE.MeshBasicMaterial({color:0xff1f65}));smear.position.set(.12*side,y,z);smear.rotation.x=tilt;group.add(smear);}
      const crossbar=new THREE.Mesh(new THREE.BoxGeometry(.055,.075,.34),new THREE.MeshBasicMaterial({color:0xff1f65}));crossbar.position.set(.13*side,1.14,-.4);group.add(crossbar);
    }
  }else if(look.routine==='gacha'){
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.38,.42,.72,16),pink);base.position.y=.36;group.add(base);
    const globe=new THREE.Mesh(new THREE.SphereGeometry(.4,18,12),new THREE.MeshStandardMaterial({color:0xf5bdd5,transparent:true,opacity:.55,roughness:.15}));globe.position.y=1;group.add(globe);
  }else{
    const cabinet=new THREE.Mesh(new THREE.BoxGeometry(.62,1.8,.92),dark);cabinet.position.y=.9;group.add(cabinet);
    if(look.routine==='locker'){
      const note=new THREE.Mesh(new THREE.PlaneGeometry(.24,.18),new THREE.MeshBasicMaterial({color:0xffd5e5}));note.rotation.y=Math.PI/2;note.position.set(.316,1.38,0);group.add(note);
    }
  }
  return group;
}
