import * as THREE from 'three';
import { createRng } from '../core/rng';

export function masonryTexture(seed:string, kind:'wall'|'floor'):THREE.CanvasTexture {
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
  const context=canvas.getContext('2d');
  if(!context)throw new TypeError('Canvas 2D is required for procedural stone');
  const rng=createRng(`${seed}:${kind}`);
  context.fillStyle='#272a29';context.fillRect(0,0,256,256);
  const rows=kind==='wall'?4:2, columns=kind==='wall'?2:2;
  const height=256/rows,width=256/columns;
  for(let row=0;row<rows;row++)for(let col=-1;col<columns;col++) {
    const offset=kind==='wall'&&row%2?width/2:0;
    const x=col*width+offset+3,y=row*height+3;
    const shade=Math.floor(78+rng()*36);
    context.fillStyle=`rgb(${shade+5},${shade+3},${shade})`;
    context.fillRect(x,y,width-6,height-6);
    context.fillStyle='rgba(215,212,195,.1)';context.fillRect(x,y,width-6,2);
    context.fillStyle='rgba(0,0,0,.22)';context.fillRect(x,y+height-8,width-6,2);
    for(let fleck=0;fleck<110;fleck++) {
      context.fillStyle=rng()>.5?'rgba(0,0,0,.09)':'rgba(220,219,204,.07)';
      context.fillRect(x+rng()*(width-6),y+rng()*(height-6),1+rng()*6,1+rng()*3);
    }
  }
  for(let stain=0;stain<12;stain++) {
    const x=rng()*256,y=rng()*256,radius=10+rng()*45;
    const gradient=context.createRadialGradient(x,y,0,x,y,radius);
    gradient.addColorStop(0,'rgba(12,22,19,.18)');gradient.addColorStop(1,'rgba(12,22,19,0)');
    context.fillStyle=gradient;context.fillRect(x-radius,y-radius,radius*2,radius*2);
  }
  const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  return texture;
}
