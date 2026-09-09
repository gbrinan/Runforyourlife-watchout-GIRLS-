import * as THREE from 'three';
import type {Device} from '../systems/devices';
export function createDeviceScene(devices:readonly Device[]) {
  const group=new THREE.Group();const moving:THREE.Group[]=[];
  const pink=new THREE.MeshStandardMaterial({color:0xa64972,roughness:.5});
  const gold=new THREE.MeshStandardMaterial({color:0xe9b35c,metalness:.55,roughness:.4});
  const dark=new THREE.MeshStandardMaterial({color:0x253942,roughness:.7});
  for(const device of devices){
    const item=new THREE.Group();item.position.set(device.point.x,0,device.point.z);item.rotation.y=device.yaw??Math.PI/2;group.add(item);
    const rotor=new THREE.Group();item.add(rotor);moving.push(rotor);
    if(device.kind==='gacha'){
      const base=new THREE.Mesh(new THREE.BoxGeometry(.9,.9,.55),pink);base.position.y=.65;item.add(base);
      const globe=new THREE.Mesh(new THREE.SphereGeometry(.44,20,14),new THREE.MeshPhysicalMaterial({color:0xd2eef2,transparent:true,opacity:.22,roughness:.2,depthWrite:false}));globe.position.y=1.48;item.add(globe);
      rotor.position.y=1.48;
      for(let i=0;i<9;i++){
        const capsule=new THREE.Mesh(new THREE.SphereGeometry(.11,12,8),new THREE.MeshStandardMaterial({color:[0xf7b0ce,0xeacf83,0x8fd9d2][i%3]}));
        capsule.position.set(Math.sin(i*2.4)*.25,((i%3)-1)*.15,Math.cos(i*2.4)*.23);rotor.add(capsule);
      }
      const crank=new THREE.Mesh(new THREE.BoxGeometry(.42,.075,.08),gold);crank.position.set(0,.88,.33);item.add(crank);
      const tray=new THREE.Mesh(new THREE.BoxGeometry(.36,.2,.08),dark);tray.position.set(0,.4,.32);item.add(tray);
    }else{
      const box=new THREE.Mesh(new THREE.BoxGeometry(.4,.6,.18),dark);box.position.y=1.35;item.add(box);
      const lever=new THREE.Mesh(new THREE.BoxGeometry(.055,.25,.1),gold);lever.position.set(0,1.35,.14);rotor.add(lever);
    }
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=96;const ctx=canvas.getContext('2d');
    if(ctx){ctx.fillStyle='#11191c';ctx.fillRect(0,0,256,96);ctx.fillStyle='#ffe6a7';ctx.textAlign='center';ctx.font='bold 28px sans-serif';ctx.fillText(device.kind==='gacha'?'소리 가챠':'조명 스위치',128,40);ctx.font='24px sans-serif';ctx.fillText('R · 작동',128,75);}
    const label=new THREE.Mesh(new THREE.PlaneGeometry(.9,.34),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas)}));label.position.set(0,device.kind==='gacha'?2.08:1.95,.36);item.add(label);
  }
  return {group,draw(time:number){devices.forEach((device,i)=>{if(device.kind==='gacha')moving[i].rotation.y=device.activeUntil>time?time*3:0;else moving[i].rotation.x=device.lit?0:.25;});}};
}
