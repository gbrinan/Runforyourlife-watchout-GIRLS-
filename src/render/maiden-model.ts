import * as THREE from 'three';
import { createFaceTexture } from './face';
import type { MaidenLook } from '../entities/maiden-variants';
import type { MaidenMode } from '../entities/maiden';
import { MAIDEN_LOOKS } from '../entities/maiden-variants';

const PALETTE={skin:0xf0c9b7,hair:0x242233,shine:0x454055,dress:0x343246,trim:0xd7c6a5,ivory:0xeee6d8} as const;
export function createMaidenModel(look:MaidenLook=MAIDEN_LOOKS[1]) {
  const group=new THREE.Group();
  const curvy=look.build==='curvy';
  const hairLength=look.hairStyle==='long'?.82:look.hairStyle==='bob'?.38:.23;
  const skin=new THREE.MeshStandardMaterial({color:PALETTE.skin,roughness:.8,emissive:PALETTE.skin,emissiveIntensity:.13});
  const hair=new THREE.MeshStandardMaterial({color:look.hair,roughness:.55,emissive:PALETTE.shine,emissiveIntensity:.08});
  const cloth=new THREE.MeshStandardMaterial({color:look.dress,roughness:.85,emissive:look.dress,emissiveIntensity:.12});
  const ivory=new THREE.MeshStandardMaterial({color:PALETTE.ivory,roughness:.9});
  const trim=new THREE.MeshStandardMaterial({color:PALETTE.trim,metalness:.35,roughness:.55});
  const sphere=new THREE.SphereGeometry(1,24,16);
  function ellipsoid(parent:THREE.Group,material:THREE.Material,x:number,y:number,z:number,sx:number,sy:number,sz:number) {
    const mesh=new THREE.Mesh(sphere,material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);parent.add(mesh);return mesh;
  }
  function profile(material:THREE.Material,points:readonly (readonly [number,number])[],depth=1) {
    const mesh=new THREE.Mesh(new THREE.LatheGeometry(points.map(([r,y])=>{
      const shape=curvy?(y>1.2&&y<1.4?1.24:y<1.08?1.13:1):.92;
      return new THREE.Vector2(r*shape,y);
    }),32),material);
    mesh.scale.z=depth;group.add(mesh);return mesh;
  }
  // A covered fitted bodice and flared knee-length skirt share a continuous silhouette.
  profile(cloth,[[0,.64],[.30,.64],[.32,.70],[.28,.87],[.21,1.02],[.155,1.14],[.20,1.31],[.225,1.39],[.17,1.43],[.08,1.46],[0,1.46]],.72);
  profile(trim,[[.301,.646],[.308,.665],[.306,.687]],.73);
  profile(trim,[[.158,1.12],[.16,1.16]],.75);
  ellipsoid(group,skin,0,1.49,0,.069,.12,.066);
  for(const side of [-1,1]) {
    const collar=new THREE.Mesh(new THREE.ConeGeometry(.073,.14,3),ivory);collar.position.set(side*.062,1.395,curvy?.135:.105);collar.rotation.z=side*.35;collar.rotation.x=.25;group.add(collar);
    const bow=ellipsoid(group,cloth,side*.047,1.32,curvy?.19:.148,.048,.035,.015);bow.rotation.z=side*.35;
  }
  ellipsoid(group,trim,0,1.32,curvy?.20:.158,.023,.026,.018);
  for(const y of [1.23,1.29])ellipsoid(group,trim,0,y,curvy?.182:.146,.013,.013,.012);
  const head=new THREE.Group();head.position.y=1.65;group.add(head);
  head.scale.setScalar(look.faceScale);
  ellipsoid(head,skin,0,0,0,.175,.223,.151);
  // Narrow chin and ears keep the face adult rather than chibi.
  ellipsoid(head,skin,0,-.11,.023,.124,.126,.116);
  for(const side of [-1,1])ellipsoid(head,skin,side*.173,-.015,0,.033,.055,.029);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(.30,.34),new THREE.MeshBasicMaterial({map:createFaceTexture(look.eyes),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,side:THREE.DoubleSide}));
  face.position.set(0,-.018,.151);head.add(face);
  const eyeWhite=new THREE.MeshBasicMaterial({color:0xfff8f0}),pupil=new THREE.MeshBasicMaterial({color:look.eyes});
  for(const side of [-1,1]){ellipsoid(head,eyeWhite,side*.068,.025,.158,.052,.029,.012);ellipsoid(head,pupil,side*.068,.025,.171,.017,.021,.008);}
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.188,32,20,0,Math.PI*2,0,Math.PI*.44),hair);cap.scale.set(1,1.27,.91);cap.position.set(0,.022,-.014);head.add(cap);
  const curtain=new THREE.Group();group.add(curtain);
  const positions:number[]=[],indices:number[]=[];
  for(let row=0;row<=10;row++) {
    const t=row/10;
    for(let col=0;col<=32;col++) {
      const a=.88+col/32*(Math.PI*2-1.76),radius=.18+.06*t;
      positions.push(Math.sin(a)*radius,1.76-hairLength*t,Math.cos(a)*radius*.80-.03-.035*t);
      if(row<10&&col<32){const i=row*33+col;indices.push(i,i+33,i+1,i+1,i+33,i+34);}
    }
  }
  const curtainGeometry=new THREE.BufferGeometry();curtainGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));curtainGeometry.setIndex(indices);curtainGeometry.computeVertexNormals();
  const longHair=new THREE.Mesh(curtainGeometry,new THREE.MeshStandardMaterial({color:look.hair,side:THREE.DoubleSide,roughness:.55,emissive:PALETTE.shine,emissiveIntensity:.1}));curtain.add(longHair);
  function lock(points:THREE.Vector3[],radius:number) {
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),20,radius,8,false),hair);group.add(mesh);return mesh;
  }
  for(const side of [-1,1]) {
    lock([new THREE.Vector3(side*.14,1.82,.02),new THREE.Vector3(side*.184,1.65,.08),new THREE.Vector3(side*(curvy?.28:.21),1.76-hairLength*.5,.12),new THREE.Vector3(side*(curvy?.31:.235),1.76-hairLength,.12)],.038);
  }
  const fringeShape=new THREE.Shape();
  fringeShape.moveTo(-.172,.075);fringeShape.quadraticCurveTo(-.14,.245,-.015,.222);
  fringeShape.quadraticCurveTo(.125,.211,.174,.064);
  fringeShape.quadraticCurveTo(.104,.13,.08,.026);
  fringeShape.quadraticCurveTo(.025,.057,-.015,.125);
  fringeShape.quadraticCurveTo(-.09,.035,-.172,.075);
  const fringe=new THREE.Mesh(new THREE.ExtrudeGeometry(fringeShape,{depth:.014,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:3,steps:1,curveSegments:16}),hair);
  fringe.position.set(0,0,.13);head.add(fringe);
  const arms:THREE.Group[]=[],legs:THREE.Group[]=[];
  for(const side of [-1,1]) {
    const arm=new THREE.Group();arm.position.set(side*(curvy?.255:.215),1.37,0);arm.rotation.z=side*.10;group.add(arm);arms.push(arm);
    ellipsoid(arm,cloth,side*.016,-.10,0,.077,.15,.075);
    ellipsoid(arm,cloth,side*.023,-.29,.01,.050,.13,.051);
    ellipsoid(arm,ivory,side*.024,-.395,.01,.054,.026,.054);
    ellipsoid(arm,skin,side*.025,-.462,.015,.046,.073,.028);
    ellipsoid(arm,skin,-side*.016,-.443,.042,.02,.042,.02);
    const leg=new THREE.Group();leg.position.set(side*.112,.80,0);group.add(leg);legs.push(leg);
    ellipsoid(leg,skin,0,-.16,0,.067,.23,.067);
    ellipsoid(leg,skin,0,-.46,.008,.047,.20,.047);
    ellipsoid(leg,cloth,0,-.699,.035,.055,.053,.112);
    const heel=new THREE.Mesh(new THREE.CylinderGeometry(.016,.013,.08,8),cloth);heel.position.set(0,-.755,-.03);leg.add(heel);
  }
  if(look.routine==='mirror'){
    const lipstick=new THREE.Mesh(new THREE.CylinderGeometry(.025,.029,.18,10),new THREE.MeshStandardMaterial({color:0xff245f,emissive:0xa30036,emissiveIntensity:1}));
    lipstick.position.set(-.01,-.54,.055);arms[0].add(lipstick);
  }
  return {group,animate(time:number,moving:boolean,mode:MaidenMode,observing=false,lookYaw=0){
    const swing=moving?Math.sin(time*8)*.38:0;
    const attacking=mode==='lunge'||mode==='attack';
    const noticing=mode==='notice';
    const stunned=mode==='stunned';
    legs.forEach((leg,i)=>{leg.rotation.x=(i===0?1:-1)*swing;});
    arms.forEach((arm,i)=>{arm.rotation.x=attacking?-1.2:observing&&i===0&&look.routine==='mirror'?-.3:(i===0?-1:1)*swing*.65;arm.rotation.z=observing&&i===0&&look.routine==='mirror'?2.35:0;});
    curtain.rotation.x=moving?Math.sin(time*8)*.028:Math.sin(time*.8)*.012;
    head.rotation.z=stunned?.18:0;
    head.rotation.y=noticing?Math.max(-1.35,Math.min(1.35,lookYaw)):observing?lookYaw+Math.sin(time*.45)*.025:0;
    curtain.rotation.y=head.rotation.y;
  }};
}
