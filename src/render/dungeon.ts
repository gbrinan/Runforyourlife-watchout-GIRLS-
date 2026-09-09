import * as THREE from 'three';
import type { DungeonLayout } from '../gen/dungeon';
import { schoolSurface } from './school-surfaces';
import { SCHOOL } from './school-palette';
import { addSchoolProps } from './school-props';

export const CEILING_HEIGHT=3;

export function createDungeonScene(layout:DungeonLayout,seed:string) {
  const group=new THREE.Group();
  const brick=schoolSurface(seed,'wall');
  const wallMaterial=new THREE.MeshStandardMaterial({map:brick,bumpMap:brick,bumpScale:.012,roughness:.88});
  const floorTexture=schoolSurface(seed,'floor');floorTexture.repeat.set(layout.size,layout.size);
  const floorMaterial=new THREE.MeshStandardMaterial({map:floorTexture,bumpMap:floorTexture,bumpScale:.008,roughness:.55});
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(layout.size,layout.size),floorMaterial);
  floor.rotation.x=-Math.PI/2;floor.position.set(layout.size/2,0,layout.size/2);group.add(floor);
  const ceilingTexture=schoolSurface(seed,'ceiling');ceilingTexture.repeat.set(layout.size/3,layout.size/3);
  const roof=new THREE.Mesh(new THREE.PlaneGeometry(layout.size,layout.size),new THREE.MeshStandardMaterial({map:ceilingTexture,roughness:1}));
  roof.rotation.x=Math.PI/2;roof.position.set(layout.size/2,CEILING_HEIGHT,layout.size/2);group.add(roof);
  const boundary:Array<{x:number;z:number}>=[];
  for(let z=1;z<layout.size-1;z++)for(let x=1;x<layout.size-1;x++) {
    const index=z*layout.size+x;
    if(layout.cells[index]===0&&[index-1,index+1,index-layout.size,index+layout.size].some(i=>layout.cells[i]===1))boundary.push({x,z});
  }
  const walls=new THREE.InstancedMesh(new THREE.BoxGeometry(1,CEILING_HEIGHT,1),wallMaterial,boundary.length);
  const matrix=new THREE.Matrix4();
  boundary.forEach((cell,index)=>{matrix.makeTranslation(cell.x+.5,CEILING_HEIGHT/2,cell.z+.5);walls.setMatrixAt(index,matrix);});
  group.add(walls);
  const beamMaterial=new THREE.MeshStandardMaterial({color:SCHOOL.concrete,roughness:.95});
  const iron=new THREE.MeshStandardMaterial({color:SCHOOL.metal,roughness:.73,metalness:.6});
  const glow=new THREE.MeshBasicMaterial({color:SCHOOL.glow});
  const pipeMaterial=new THREE.MeshStandardMaterial({color:SCHOOL.rust,roughness:.72,metalness:.35});
  const lights:THREE.PointLight[]=[];
  layout.rooms.forEach((room,index)=>{
    for(let z=room.z+1;z<room.z+room.depth;z+=3) {
      const beam=new THREE.Mesh(new THREE.BoxGeometry(room.width,.28,.32),beamMaterial);
      beam.position.set(room.x+room.width/2,CEILING_HEIGHT-.14,z);group.add(beam);
    }
    const lampX=room.x+room.width/2,lampZ=room.z+room.depth/2;
    const bracket=new THREE.Mesh(new THREE.BoxGeometry(1.65,.1,.4),iron);
    bracket.position.set(lampX,2.8,lampZ);group.add(bracket);
    for(const offset of [-.12,.12]){
      const tube=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,1.5,8),glow);
      tube.rotation.z=Math.PI/2;tube.position.set(lampX,2.72,lampZ+offset);group.add(tube);
    }
    const light=new THREE.PointLight(SCHOOL.tube,index===0?12:9,18,1.7);
    light.position.set(lampX,2.5,lampZ);group.add(light);lights.push(light);
    if(index===0){light.castShadow=true;light.shadow.mapSize.set(512,512);light.shadow.camera.near=.2;light.shadow.camera.far=18;light.shadow.bias=-.0005;light.shadow.normalBias=.04;light.shadow.autoUpdate=false;light.shadow.needsUpdate=true;}
    for(const offset of [.6,1]){
      const pipe=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,room.depth,8),pipeMaterial);
      pipe.rotation.x=Math.PI/2;pipe.position.set(room.x+offset,2.6,lampZ);group.add(pipe);
      for(let z=room.z+1;z<room.z+room.depth;z+=2.5){
        const clamp=new THREE.Mesh(new THREE.TorusGeometry(.08,.016,4,8),iron);
        clamp.position.set(room.x+offset,2.6,z);group.add(clamp);
      }
    }
    const puddle=new THREE.Mesh(new THREE.CircleGeometry(1,24),new THREE.MeshStandardMaterial({color:0x29312e,roughness:.18,metalness:.3,transparent:true,opacity:.6}));
    puddle.rotation.x=-Math.PI/2;puddle.scale.set(1.4,.5,1);
    puddle.position.set(room.x+room.width*.55,.008,room.z+room.depth*.65);group.add(puddle);
  });
  const ambient=new THREE.AmbientLight(SCHOOL.tube,.22);group.add(ambient);
  const playerLight=new THREE.PointLight(SCHOOL.glow,1.2,6,1.4);group.add(playerLight);
  const focal=addSchoolProps(group,layout);
  group.traverse(child=>{if(child instanceof THREE.Mesh){child.receiveShadow=true;child.castShadow=true;}});
  return {group,playerLight,lights,focal};
}
