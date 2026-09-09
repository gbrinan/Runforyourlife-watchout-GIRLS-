import * as THREE from 'three';

export function createFaceTexture(eyeColor='#67578e') {
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new TypeError('Canvas 2D unavailable');
  for(const side of [-1,1]) {
    ctx.save();ctx.translate(256+side*105,225);ctx.scale(side,1);
    ctx.fillStyle='#fff5ee';ctx.beginPath();ctx.moveTo(-68,0);
    ctx.bezierCurveTo(-25,-40,35,-44,69,-24);ctx.bezierCurveTo(44,35,-32,38,-68,0);ctx.fill();
    ctx.save();ctx.clip();
    const iris=ctx.createLinearGradient(0,-32,0,35);iris.addColorStop(0,'#25202c');iris.addColorStop(.55,eyeColor);iris.addColorStop(1,'#bdabdc');
    ctx.fillStyle=iris;ctx.beginPath();ctx.ellipse(8,1,30,39,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#25202c';ctx.beginPath();ctx.ellipse(8,-1,12,26,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffffff';ctx.beginPath();ctx.ellipse(-2,-17,10,12,-.3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(24,16,5,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.strokeStyle='#25202c';ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-68,0);ctx.bezierCurveTo(-25,-40,35,-44,69,-24);ctx.lineTo(81,-40);ctx.stroke();
    ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-60,7);ctx.quadraticCurveTo(10,48,61,0);ctx.stroke();
    ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-65,-68);ctx.quadraticCurveTo(7,-85,61,-71);ctx.stroke();
    const blush=ctx.createRadialGradient(5,64,1,5,64,50);blush.addColorStop(0,'rgba(211,118,119,.22)');blush.addColorStop(1,'rgba(211,118,119,0)');ctx.fillStyle=blush;ctx.fillRect(-50,34,110,62);ctx.restore();
  }
  ctx.strokeStyle='#bb8a7d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(257,272);ctx.lineTo(249,306);ctx.lineTo(259,308);ctx.stroke();
  ctx.strokeStyle='#9b5e65';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(235,361);ctx.quadraticCurveTo(257,356,279,360);ctx.stroke();
  ctx.strokeStyle='#ffede2';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(246,369);ctx.lineTo(270,369);ctx.stroke();
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  return texture;
}
