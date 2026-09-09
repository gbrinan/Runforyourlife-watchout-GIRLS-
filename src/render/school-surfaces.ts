import * as THREE from 'three';
import {createRng} from '../core/rng';
import {SCHOOL} from './school-palette';

export function schoolSurface(seed:string,kind:'wall'|'floor'|'ceiling'):THREE.CanvasTexture {
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=kind==='wall'?768:256;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new TypeError('School materials require Canvas 2D');
  const rng=createRng(seed+':school:'+kind),h=canvas.height;
  ctx.fillStyle=kind==='wall'?SCHOOL.plaster:kind==='floor'?SCHOOL.floor:SCHOOL.concrete;
  ctx.fillRect(0,0,256,h);
  if(kind==='wall'){
    ctx.fillStyle=SCHOOL.paint;ctx.fillRect(0,h*.56,256,h*.44);
    ctx.fillStyle=SCHOOL.trim;ctx.fillRect(0,h*.55,256,8);ctx.fillRect(0,h-35,256,35);
    for(let i=0;i<25;i++){
      const x=rng()*256,y=rng()*h,w=2+rng()*10;
      const stain=ctx.createLinearGradient(0,y,0,y+160);
      stain.addColorStop(0,'rgba(40,46,36,.23)');stain.addColorStop(1,'rgba(40,46,36,0)');
      ctx.fillStyle=stain;ctx.fillRect(x,y,w,160);
      if(y>h*.56){ctx.fillStyle=SCHOOL.plaster;ctx.fillRect(x,y,w*.4,2+rng()*12);}
    }
  }
  for(let i=0;i<6500;i++){
    const x=rng()*256,y=rng()*h,r=kind==='floor'?1+rng()*2:rng()*1.5;
    ctx.fillStyle=rng()>.5?'rgba(231,234,220,.16)':'rgba(28,39,35,.12)';
    ctx.fillRect(x,y,r,r);
  }
  if(kind==='floor'){
    ctx.strokeStyle=SCHOOL.trim;ctx.globalAlpha=.5;ctx.lineWidth=1;
    ctx.strokeRect(.5,.5,255,255);ctx.globalAlpha=1;
    ctx.strokeStyle='rgba(39,52,43,.25)';ctx.beginPath();ctx.moveTo(0,154);ctx.lineTo(46,149);ctx.lineTo(58,166);ctx.stroke();
  }
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=4;return map;
}

export function schoolSign(lines:readonly string[],background:string=SCHOOL.board,foreground:string=SCHOOL.chalk):THREE.Mesh {
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new TypeError('School signs require Canvas 2D');
  ctx.fillStyle=background;ctx.fillRect(0,0,1024,512);
  ctx.strokeStyle=foreground;ctx.globalAlpha=.25;ctx.lineWidth=3;ctx.strokeRect(22,22,980,468);ctx.globalAlpha=1;
  ctx.fillStyle=foreground;ctx.textAlign='center';ctx.textBaseline='middle';
  lines.forEach((line,i)=>{ctx.font=`600 ${lines.length>3?64:92}px "Malgun Gothic", sans-serif`;ctx.fillText(line,512,512*(i+1)/(lines.length+1),940);});
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(2.8,1.4),new THREE.MeshStandardMaterial({map,roughness:.92,emissiveMap:map,emissive:SCHOOL.glow,emissiveIntensity:.5}));
}
