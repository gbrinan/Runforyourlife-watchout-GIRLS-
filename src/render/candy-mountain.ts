import * as THREE from 'three';
const COLORS=[0xfa718c,0xffad69,0xffe6a7,0x8fd9b5,0x78c9ed,0xa99bec,0xd9a0da];
export function createCandyMountain(){
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x211b39);scene.fog=new THREE.FogExp2(0x211b39,.009);
  scene.add(new THREE.HemisphereLight(0xffe6a7,0x4c385f,3));
  const light=new THREE.DirectionalLight(0xfff7ee,4);light.position.set(-10,25,12);scene.add(light);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0x4c385f,roughness:.5}));floor.rotation.x=-Math.PI/2;scene.add(floor);
  const mats=COLORS.map(color=>new THREE.MeshStandardMaterial({color,roughness:.27,metalness:.12}));
  function mountain(x:number,z:number,scale:number){
    const group=new THREE.Group();group.position.set(x,0,z);group.scale.setScalar(scale);
    for(let i=0;i<7;i++){
      const bottom=10-i*1.3,top=Math.max(.3,bottom-1.3);
      const tier=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,2,48),mats[i]);tier.position.y=1+i*2;group.add(tier);
    }
    const peak=new THREE.Mesh(new THREE.ConeGeometry(1.1,3.3,32),new THREE.MeshStandardMaterial({color:0xfff7ee,roughness:.2}));peak.position.y=15.5;group.add(peak);scene.add(group);
  }
  mountain(0,-22,1.2);mountain(-18,-32,.8);mountain(17,-37,.95);
  for(let i=0;i<7;i++){
    const arc=new THREE.Mesh(new THREE.TorusGeometry(22+i*.6,.28,8,96,Math.PI),mats[i]);arc.position.set(0,3,-40);scene.add(arc);
  }
  const cream=new THREE.MeshStandardMaterial({color:0xfff7ee,roughness:.35});
  for(let i=0;i<18;i++){
    const side=i%2===0?-1:1,x=side*(6+(i%4)*2),z=8-i*2.3,height=2+(i%3)*.7;
    const stick=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,height,10),cream);stick.position.set(x,height/2,z);scene.add(stick);
    const candy=new THREE.Mesh(new THREE.SphereGeometry(.85,20,14),mats[i%7]);candy.scale.z=.35;candy.position.set(x,height+.6,z);scene.add(candy);
    const swirl=new THREE.Mesh(new THREE.TorusGeometry(.48,.09,8,32),cream);swirl.position.set(x,height+.6,z+.33);scene.add(swirl);
  }
  for(let i=0;i<16;i++){
    const tile=new THREE.Mesh(new THREE.BoxGeometry(2.5,.08,1.3),mats[i%7]);tile.position.set(Math.sin(i*.3),.05,10-i*2);scene.add(tile);
  }
  const camera=new THREE.PerspectiveCamera(60,1,.1,200);camera.position.set(0,5.2,20);camera.lookAt(0,10,-23);
  return {scene,camera};
}
