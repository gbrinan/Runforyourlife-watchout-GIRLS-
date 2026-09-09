import * as THREE from 'three';
import { MAIDEN_LOOKS } from '../entities/maiden-variants';
import { createMaidenModel } from './maiden-model';
import { createMaiden } from '../entities/maiden';
import type { Point } from '../entities/maiden';
import type { Heightmap } from '../gen/heightmap';
import { sampleHeight } from '../gen/heightmap';
import type { Track } from '../systems/tracks';

export function createEncounter(map:Heightmap,spawns:readonly Point[],lookOffset=0) {
  const group=new THREE.Group();
  const maidens=spawns.map(createMaiden);
  const models=maidens.map((maiden,index)=>{
    maiden.yaw=-Math.PI/2;maiden.target={...maiden};
    const model=createMaidenModel(MAIDEN_LOOKS[(index+lookOffset)%MAIDEN_LOOKS.length]);group.add(model.group);return model;
  });
  const previousPositions=maidens.map(maiden=>({x:maiden.x,z:maiden.z}));
  let lastTime=0;
  const prints=new THREE.InstancedMesh(new THREE.CircleGeometry(.1,6),new THREE.MeshBasicMaterial({color:0x31292c,side:THREE.DoubleSide}),256);
  prints.count=0;group.add(prints);const stamp=new THREE.Object3D();
  const draw=(tracks:readonly Track[],time:number,present:readonly boolean[]=maidens.map(()=>true))=> {
    prints.count=Math.min(256,tracks.length);
    for(let i=0;i<prints.count;i++) {
      const point=tracks[i].point;stamp.position.set(point.x,sampleHeight(map,point.x,point.z)+.02,point.z);
      stamp.rotation.x=-Math.PI/2;stamp.updateMatrix();prints.setMatrixAt(i,stamp.matrix);
    }
    prints.instanceMatrix.needsUpdate=true;
    maidens.forEach((maiden,index)=>{
      const model=models[index],figure=model.group;figure.visible=present[index];
      if(!present[index])return;
      figure.position.set(maiden.x,sampleHeight(map,maiden.x,maiden.z),maiden.z);
      figure.rotation.set(0,maiden.yaw,maiden.mode==='stunned'?.45:0);
      if(time!==lastTime){
        const previous=previousPositions[index];
        const moving=Math.hypot(maiden.x-previous.x,maiden.z-previous.z)>.0001;
        model.animate(time,moving,maiden.mode==='attack',maiden.mode==='stunned');
        previous.x=maiden.x;previous.z=maiden.z;
      }
    });
    lastTime=time;
  };
  draw([],0);return {group,maidens,draw};
}
