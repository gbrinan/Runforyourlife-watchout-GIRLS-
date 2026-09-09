import * as THREE from 'three';
import type {Exit} from '../gen/furnishings';
export function createExitScene(exit:Exit):THREE.Group {
 const group=new THREE.Group();group.position.set(exit.point.x,0,exit.point.z);group.rotation.y=Math.atan2(-exit.normal.x,-exit.normal.z);
 const metal=new THREE.MeshStandardMaterial({color:0x253942,metalness:.6,roughness:.45});
 const glow=new THREE.MeshBasicMaterial({color:0x8fd9d2});
 for(const x of [-1.4,1.4]){const pillar=new THREE.Mesh(new THREE.BoxGeometry(.18,2.7,.24),metal);pillar.position.set(x,1.35,0);group.add(pillar);const strip=new THREE.Mesh(new THREE.BoxGeometry(.045,2.4,.03),glow);strip.position.set(x,1.3,.14);group.add(strip);}
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');
 if(ctx){ctx.fillStyle='#253942';ctx.fillRect(0,0,512,128);ctx.strokeStyle='#8fd9d2';ctx.lineWidth=8;ctx.strokeRect(4,4,504,120);ctx.fillStyle='#fff7ee';ctx.font='bold 88px sans-serif';ctx.textAlign='center';ctx.fillText('EXIT',256,96);}
 const sign=new THREE.Mesh(new THREE.BoxGeometry(2.7,.65,.12),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas)}));sign.position.set(0,2.6,0);group.add(sign);
 const light=new THREE.PointLight(0x8fd9d2,20,10,1.6);light.position.set(0,2,-1);group.add(light);
 for(const z of [-.2,-1.2,-2.2]){const stripe=new THREE.Mesh(new THREE.BoxGeometry(2.6,.012,.09),glow);stripe.position.set(0,.02,z);group.add(stripe);}
 return group;
}
