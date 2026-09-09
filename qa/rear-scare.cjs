const fs=require('fs');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
require('esbuild').buildSync({stdin:{contents:"export * from './src/gen/dungeon';export * from './src/systems/hunt';export * from './src/systems/devices';",resolveDir:process.cwd()},outfile:'qa/rear-map.cjs',bundle:true,platform:'node',format:'cjs'});
const {createDungeonLayout,chooseSpawn,createDevices}=require('./rear-map.cjs');
let seed,expected;
for(let i=0;i<100;i++){const s='rear-'+i,l=createDungeonLayout(s),d=createDevices(l)[0],p={...l.start,yaw:Math.atan2(d.point.x-l.start.x,d.point.z-l.start.z)},point=chooseSpawn(l,p);if(point){seed=s;expected={player:p,point};break;}}
if(!seed)throw Error('No QA fixture');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.addInitScript(()=>{
   const Base=window.AudioContext,connect=AudioNode.prototype.connect;
   window.qaAudio={heels:[],panners:[],peaks:[]};
   window.AudioContext=class extends Base{
    constructor(...args){super(...args);window.qaContext=this;this.tap=this.createGain();this.meter=this.createAnalyser();this.meter.fftSize=2048;this.media=this.createMediaStreamDestination();this.tap.connect(this.meter);this.meter.connect(this.media);}
    createPanner(){const p=super.createPanner();window.qaAudio.panners.push(p);return p;}
    createOscillator(){const o=super.createOscillator(),start=o.start.bind(o);o.start=(...args)=>{if(o.frequency.value===1450){const l=this.listener,p=window.qaAudio.panners[0];window.qaAudio.heels.push({time:this.currentTime,listener:[l.positionX.value,l.positionZ.value],forward:[l.forwardX.value,l.forwardZ.value],source:p?[p.positionX.value,p.positionZ.value]:null});}return start(...args);};return o;}
   };
   AudioNode.prototype.connect=function(target,...rest){const result=connect.call(this,target,...rest);if(target===this.context.destination&&this.context.tap)connect.call(this,this.context.tap);return result;};
  });
  await page.clock.install({time:new Date('2026-09-08T00:00:00Z')});await page.clock.pauseAt(new Date('2026-09-08T00:00:02Z'));await page.goto('http://127.0.0.1:5173/?seed='+seed);await page.clock.runFor(160);
  const box=await page.locator('#start').boundingBox();await page.locator('#start').click();await page.clock.runFor(24000);
  await page.screenshot({path:'qa/rear-before.png'});
  const quiet=await page.evaluate(()=>window.qaAudio.heels.length===0);
  await page.evaluate(()=>{window.qaChunks=[];window.qaRecorder=new MediaRecorder(window.qaContext.media.stream);window.qaRecorder.ondataavailable=e=>window.qaChunks.push(e.data);window.qaRecorder.start();});
  await page.clock.resume();
  await page.waitForFunction(()=>window.qaAudio.heels.length>0);
  await page.screenshot({path:'qa/rear-appeared.png'});
  await page.keyboard.down('KeyE');
  await page.waitForFunction(()=>{const l=window.qaContext.listener,p=window.qaAudio.panners[0],dx=p.positionX.value-l.positionX.value,dz=p.positionZ.value-l.positionZ.value;return (l.forwardX.value*dx+l.forwardZ.value*dz)/Math.hypot(dx,dz)>.97;});
  await page.keyboard.up('KeyE');await page.screenshot({path:'qa/rear-turn.png'});
  await page.waitForFunction(()=>window.qaAudio.heels.length>=4);
  const metrics=await page.evaluate(async()=>{
   const samples=new Float32Array(window.qaContext.meter.fftSize);let peak=0;
   for(let i=0;i<24;i++){window.qaContext.meter.getFloatTimeDomainData(samples);peak=Math.max(peak,...samples.map(Math.abs));await new Promise(r=>requestAnimationFrame(r));}
   return {state:window.qaContext.state,heels:window.qaAudio.heels,peak};
  });
  await page.keyboard.press('Escape');await page.screenshot({path:'qa/rear-paused.png'});
  const suspended=await page.evaluate(()=>window.qaContext.state==='suspended');
  const recording=await page.evaluate(async()=>{await new Promise(r=>{window.qaRecorder.onstop=r;window.qaRecorder.stop();});const bytes=new Uint8Array(await new Blob(window.qaChunks).arrayBuffer());let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s);});
  fs.writeFileSync('qa/rear-audio.webm',Buffer.from(recording,'base64'));
  const first=metrics.heels[0],dx=first.source[0]-first.listener[0],dz=first.source[1]-first.listener[1];
  const result={seed,expected,quiet,firstRearDot:dx*first.forward[0]+dz*first.forward[1],distance:Math.hypot(dx,dz),...metrics,suspended,errors};
  fs.writeFileSync('qa/rear-results.json',JSON.stringify(result,null,2));console.log(result);
  if(!quiet||result.firstRearDot>=0||metrics.peak<=.005||!suspended||errors.length)throw Error('Rear/audio QA failed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
