const fs=require('fs');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const esbuild=require('esbuild');
esbuild.buildSync({entryPoints:['src/gen/dungeon.ts'],outfile:'qa/horror-map.cjs',bundle:true,platform:'node',format:'cjs'});
esbuild.buildSync({entryPoints:['src/systems/puzzle.ts'],outfile:'qa/horror-puzzle.cjs',bundle:true,platform:'node',format:'cjs'});
const {createDungeonLayout,isDungeonBlocked}=require('./horror-map.cjs');
const {createPuzzle}=require('./horror-puzzle.cjs');

function route(map,from,to){
  const cell=point=>Math.floor(point.z)*map.size+Math.floor(point.x),origin=cell(from),goal=cell(to),parents=new Map([[origin,origin]]),queue=[origin];
  for(let i=0;i<queue.length&&!parents.has(goal);i+=1){const node=queue[i],x=node%map.size,z=Math.floor(node/map.size);for(const [dx,dz] of [[1,0],[0,1],[-1,0],[0,-1]]){const nx=x+dx,nz=z+dz,key=nz*map.size+nx;if(!parents.has(key)&&!isDungeonBlocked(map,{x:nx+.5,z:nz+.5})){parents.set(key,node);queue.push(key);}}}
  if(!parents.has(goal))throw new Error('No route');
  let node=goal;const path=[to];while(node!==origin){path.push({x:node%map.size+.5,z:Math.floor(node/map.size)+.5});node=parents.get(node);}path.push({x:origin%map.size+.5,z:Math.floor(origin/map.size)+.5});return path.reverse();
}

(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    const Base=window.AudioContext,connect=AudioNode.prototype.connect;
    window.qaSongs=[];
    window.AudioContext=class extends Base{
      constructor(...args){super(...args);window.qaContext=this;this.qaTap=this.createGain();this.qaMeter=this.createAnalyser();this.qaMeter.fftSize=2048;this.qaMedia=this.createMediaStreamDestination();this.qaTap.connect(this.qaMeter);this.qaMeter.connect(this.qaMedia);}
      createBufferSource(){const source=super.createBufferSource(),start=source.start.bind(source);source.start=(...args)=>{if(source.loop&&source.buffer){const data=source.buffer.getChannelData(0);let peak=0,energy=0;for(const sample of data){peak=Math.max(peak,Math.abs(sample));energy+=sample*sample;}window.qaSongs.push({duration:source.buffer.duration,loop:source.loop,peak,energy:energy/data.length,sampleRate:source.buffer.sampleRate});}return start(...args);};return source;}
    };
    AudioNode.prototype.connect=function(target,...rest){const result=connect.call(this,target,...rest);if(target===this.context.destination&&this.context.qaTap)connect.call(this,this.context.qaTap);return result;};
  });
  const seed='exit-4',map=createDungeonLayout(seed),puzzle=createPuzzle(map,seed),result={seed,errors};
  try{
    await page.clock.install({time:new Date('2026-09-09T00:00:00Z')});
    await page.goto('http://127.0.0.1:5173/?seed='+seed);await page.clock.pauseAt(new Date('2026-09-09T00:00:30Z'));
    const box=await page.locator('#start').boundingBox();let mouseX=box.x+box.width/2,mouseY=box.y+box.height/2;
    await page.evaluate(()=>{window.qaMouse=[];document.addEventListener('mousemove',event=>window.qaMouse.push(event.movementX));});
    await page.locator('#start').click();await page.clock.runFor(32);
    async function sync(){return page.evaluate(()=>{const listener=window.qaContext.listener;return{position:{x:listener.positionX.value,z:listener.positionZ.value},yaw:Math.atan2(listener.forwardX.value,listener.forwardZ.value)};});}
    let {position,yaw}=await sync();
    async function face(angle){({yaw}=await sync());let delta=angle-yaw;while(delta>Math.PI)delta-=Math.PI*2;while(delta<-Math.PI)delta+=Math.PI*2;await page.evaluate(()=>window.qaMouse=[]);mouseX-=delta/.002;await page.mouse.move(mouseX,mouseY);await page.clock.runFor(16);({position,yaw}=await sync());}
    async function go(target){({position}=await sync());const dx=target.x-position.x,dz=target.z-position.z,distance=Math.hypot(dx,dz);if(distance<.04)return;await face(Math.atan2(dx,dz));const milliseconds=Math.round(distance/3/.016)*16;await page.keyboard.down('KeyW');await page.clock.runFor(milliseconds);await page.keyboard.up('KeyW');await page.clock.runFor(16);({position,yaw}=await sync());}
    async function travel(point){for(const waypoint of route(map,position,point))await go(waypoint);}
    async function approach(point){const dx=map.start.x-point.x,dz=map.start.z-point.z,distance=Math.hypot(dx,dz);await travel({x:point.x+dx/distance*1.1,z:point.z+dz/distance*1.1});await face(Math.atan2(point.x-position.x,point.z-position.z));}
    for(const id of puzzle.order){await approach(puzzle.bells[id].point);await page.keyboard.press('KeyR');await page.clock.runFor(64);}
    await page.evaluate(()=>{window.qaChunks=[];window.qaRecorder=new MediaRecorder(window.qaContext.qaMedia.stream);window.qaRecorder.ondataavailable=event=>window.qaChunks.push(event.data);window.qaRecorder.start();});
    await travel(map.exit.inside);await face(Math.atan2(map.exit.normal.x,map.exit.normal.z));await travel(map.exit.outside);await page.clock.runFor(32);
    result.title=await page.locator('#overlay-title').innerText();
    await page.clock.resume();await page.waitForTimeout(1400);
    const audioMetrics=await page.evaluate(async()=>{const samples=new Float32Array(window.qaContext.qaMeter.fftSize);let meterPeak=0;for(let i=0;i<36;i+=1){window.qaContext.qaMeter.getFloatTimeDomainData(samples);for(const sample of samples)meterPeak=Math.max(meterPeak,Math.abs(sample));await new Promise(resolve=>requestAnimationFrame(resolve));}return{song:window.qaSongs[0],meterPeak,contextState:window.qaContext.state};});
    Object.assign(result,audioMetrics);await page.screenshot({path:'qa/candy-song-ending.png'});
    const recording=await page.evaluate(async()=>{await new Promise(resolve=>{window.qaRecorder.onstop=resolve;window.qaRecorder.stop();});const bytes=new Uint8Array(await new Blob(window.qaChunks).arrayBuffer());let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary);});
    fs.writeFileSync('qa/candy-mountain-song.webm',Buffer.from(recording,'base64'));
    fs.writeFileSync('qa/candy-song-results.json',JSON.stringify(result,null,2));
    console.log(result);
    if(result.title!=='캔디마운틴'||!result.song?.loop||result.song.duration<7||result.song.peak<.1||result.meterPeak<.005||result.contextState!=='running'||errors.length)throw new Error('Candy song browser QA failed');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
