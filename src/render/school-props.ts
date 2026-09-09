import * as THREE from 'three';
import type {DungeonLayout,Room} from '../gen/dungeon';
import {SCHOOL} from './school-palette';
import {schoolSign} from './school-surfaces';

type Anchor={readonly x:number;readonly z:number;readonly yaw:number};
function wallAnchors(layout:DungeonLayout,room:Room):Anchor[]{
  const anchors:Anchor[]=[];
  for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){
    const horizontal=Math.abs(Math.sin(yaw))<.5,length=horizontal?room.width:room.depth;
    for(let t=2;t<length-1.7;t+=3.3){
      const x=horizontal?room.x+t:yaw>0?room.x:room.x+room.width;
      const z=horizontal?(yaw===0?room.z:room.z+room.depth):room.z+t;
      const nx=Math.sin(yaw),nz=Math.cos(yaw);
      const backed=[-1.5,0,1.5].every(offset=>{
        const bx=Math.floor(x-nx*.4+nz*offset),bz=Math.floor(z-nz*.4-nx*offset);
        return layout.cells[bz*layout.size+bx]===0;
      });
      if(backed&&!layout.sockets?.some(s=>Math.hypot(s.point.x-x,s.point.z-z)<2.5))anchors.push({x,z,yaw});
    }
  }
  return anchors;
}
export function addSchoolProps(group:THREE.Group,layout:DungeonLayout){
  const metal=new THREE.MeshStandardMaterial({color:SCHOOL.metal,roughness:.65,metalness:.45});
  const cabinet=new THREE.MeshStandardMaterial({color:SCHOOL.cabinet,roughness:.78});
  const wood=new THREE.MeshStandardMaterial({color:SCHOOL.wood,roughness:.9});
  const chalk=new THREE.MeshBasicMaterial({color:SCHOOL.chalk,transparent:true,opacity:.72});
  function box(parent:THREE.Group,w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  let focal={x:layout.start.x,z:layout.rooms[0].z};
  const names=['별관 지하 1층','기계실 · 관계자 외 출입금지','방송 기자재 보관실','미술 준비실','체육 비품실','문서 보존실','청소 도구실','폐쇄 복도'];
  layout.rooms.forEach((room,index)=>{
    const anchors=wallAnchors(layout,room);
    const anchor=anchors[0];
    if(anchor){
      const wall=new THREE.Group();wall.position.set(anchor.x,0,anchor.z);wall.rotation.y=anchor.yaw;group.add(wall);
      box(wall,3,1.55,.12,0,1.65,.02,wood);
      const sign=schoolSign(index===0?['유니콘 소환식','2학년 비밀 실험','성공하면 도망쳐']:['은목여자고등학교',names[index%names.length],'사용 후 전원을 꺼 주세요']);
      sign.position.set(0,1.65,.09);wall.add(sign);
      const plate=schoolSign(['서울 · 은목여자고등학교',names[index%names.length]],SCHOOL.paper,SCHOOL.ink);
      plate.scale.set(.8,.29,1);plate.position.set(0,.55,.1);wall.add(plate);
      if(index===0)focal={x:anchor.x,z:anchor.z};
    }
    for(const anchor of anchors.slice(1,3)){
      const wall=new THREE.Group();wall.position.set(anchor.x,0,anchor.z);wall.rotation.y=anchor.yaw;group.add(wall);
      for(let i=0;i<4;i++){
        const x=(i-1.5)*.62;
        box(wall,.6,1.85,.45,x,.925,-.1,cabinet);
        box(wall,.012,1.72,.01,x+.285,.95,.13,metal);
        box(wall,.055,.14,.055,x+.18,1,.15,metal);
        for(let j=0;j<3;j++)box(wall,.35,.015,.012,x,1.55+j*.06,.135,metal);
      }
      const label=schoolSign(['학교 비품','반출 금지'],SCHOOL.paper,SCHOOL.ink);
      label.scale.set(.24,.2,1);label.position.set(0,1.06,.155);wall.add(label);
      box(wall,2.65,.1,.45,0,2,-.1,wood);
    }
  });
  const ritual=new THREE.Group();ritual.position.set(layout.start.x,.018,layout.start.z);group.add(ritual);
  ritual.rotation.y=Math.atan2(layout.start.x-focal.x,layout.start.z-focal.z);
  for(const radius of [1.45,1.78]){
    const ring=new THREE.Mesh(new THREE.RingGeometry(radius-.015,radius+.015,96),chalk);ring.rotation.x=-Math.PI/2;ritual.add(ring);
  }
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5,b=(i+2)*Math.PI*2/5;
    const points=[new THREE.Vector3(Math.sin(a)*1.42,0,Math.cos(a)*1.42),new THREE.Vector3(Math.sin(b)*1.42,0,Math.cos(b)*1.42)];
    ritual.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:SCHOOL.chalk,transparent:true,opacity:.62})));
    const candle=new THREE.Mesh(new THREE.CylinderGeometry(.055,.065,.16,8),new THREE.MeshStandardMaterial({color:SCHOOL.paper}));
    candle.position.set(Math.sin(a)*1.65,.08,Math.cos(a)*1.65);ritual.add(candle);
    const flame=new THREE.Mesh(new THREE.SphereGeometry(.027,6,6),new THREE.MeshBasicMaterial({color:SCHOOL.candle}));flame.scale.y=2;flame.position.copy(candle.position);flame.position.y=.2;ritual.add(flame);
  }
  box(ritual,1.12,.035,.78,-.65,.018,-1.05,wood);
  const note=schoolSign(['소환 성공!','다들 도망쳐'],SCHOOL.paper,SCHOOL.ink);
  note.scale.set(.39,.53,1);note.rotation.x=-Math.PI/2;note.position.set(-.65,.039,-1.05);ritual.add(note);
  box(ritual,.012,.006,.74,-.65,.043,-1.05,metal);
  for(const offset of [0,.32]){
    const slipper=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),new THREE.MeshStandardMaterial({color:SCHOOL.paper,roughness:.9}));
    slipper.scale.set(.12,.035,.24);slipper.position.set(-1.48+offset,.035,-1.45);ritual.add(slipper);
    box(ritual,.22,.095,.18,-1.48+offset,.085,-1.53,cabinet);
    box(ritual,.13,.008,.13,-1.48+offset,.073,-1.34,metal);
  }
  const candlelight=new THREE.PointLight(SCHOOL.candle,.65,4,2);candlelight.position.set(0,.35,0);ritual.add(candlelight);
  return focal;
}
