const fs=require('fs');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const esbuild=require('esbuild');

esbuild.buildSync({entryPoints:['src/gen/dungeon.ts'],outfile:'qa/familiar-map.cjs',bundle:true,platform:'node',format:'cjs'});
const {createDungeonLayout,isDungeonBlocked}=require('./familiar-map.cjs');

function route(map,from,to){
  const cell=point=>Math.floor(point.z)*map.size+Math.floor(point.x),origin=cell(from),goal=cell(to),parents=new Map([[origin,origin]]),queue=[origin];
  for(let index=0;index<queue.length&&!parents.has(goal);index++){
    const current=queue[index],x=current%map.size,z=Math.floor(current/map.size);
    for(const [dx,dz] of [[1,0],[0,1],[-1,0],[0,-1]]){
      const next=(z+dz)*map.size+x+dx;
      if(!parents.has(next)&&!isDungeonBlocked(map,{x:x+dx+.5,z:z+dz+.5})){parents.set(next,current);queue.push(next);}
    }
  }
  if(!parents.has(goal))throw new Error('No route to character tableau');
  let current=goal;const path=[to];
  while(current!==origin){path.push({x:current%map.size+.5,z:Math.floor(current/map.size)+.5});current=parents.get(current);}
  return path.reverse();
}

(async()=>{
  const scenario=process.argv[2]==='eve'?'eve':'familiar';
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[],result={seed:scenario==='eve'?'eve-388':'familiar-371',captures:[],errors};
  page.on('pageerror',error=>errors.push(error.message));
  try{
    const map=createDungeonLayout(result.seed),target=map.spawns[scenario==='eve'?0:1];
    await page.addInitScript(()=>{const Base=window.AudioContext;window.AudioContext=class extends Base{constructor(...args){super(...args);window.qaContext=this;}};});
    await page.clock.install({time:new Date('2026-09-09T00:00:00Z')});
    await page.goto(`http://127.0.0.1:5173/?seed=${result.seed}`);
    const capture=async name=>{const path=`qa/${scenario}-${name}-1280.png`;await page.screenshot({path});result.captures.push(path);};
    await capture('intro');
    await page.evaluate(()=>{window.qaMouse=[];document.addEventListener('mousemove',event=>window.qaMouse.push(event.movementX));});
    const box=await page.locator('#start').boundingBox();
    if(!box)throw new Error('Start button is missing');
    let mouseX=box.x+box.width/2,mouseY=box.y+box.height/2;
    await page.locator('#start').click();await page.clock.runFor(32);
    const facing=await page.evaluate(()=>({x:window.qaContext?.listener.forwardX.value??0,z:window.qaContext?.listener.forwardZ.value??1}));
    let position={...map.start},yaw=Math.atan2(facing.x,facing.z);
    async function face(angle){
      let delta=angle-yaw;while(delta>Math.PI)delta-=Math.PI*2;while(delta<-Math.PI)delta+=Math.PI*2;
      await page.evaluate(()=>{window.qaMouse=[];});mouseX-=delta/.002;await page.mouse.move(mouseX,mouseY);await page.clock.runFor(16);
      const movement=await page.evaluate(()=>window.qaMouse);yaw-=movement.reduce((sum,value)=>sum+value,0)*.002;
    }
    async function go(point){
      const dx=point.x-position.x,dz=point.z-position.z,distance=Math.hypot(dx,dz);if(distance<.04)return;
      await face(Math.atan2(dx,dz));const duration=Math.round(distance/8/.016)*16;
      await page.keyboard.down('ShiftLeft');await page.keyboard.down('KeyW');await page.clock.runFor(duration);await page.keyboard.up('KeyW');await page.keyboard.up('ShiftLeft');
      position={x:position.x+Math.sin(yaw)*8*duration/1000,z:position.z+Math.cos(yaw)*8*duration/1000};
    }
    const view={x:target.x+1.6,z:target.z+.8};
    const path=route(map,position,view);
    for(const point of path.slice(0,-1))await go(point);
    await go(view);await face(Math.atan2(target.x-position.x,target.z-position.z));await page.clock.runFor(120);
    result.observation=await page.locator('#subtitle').innerText();await capture('observation');
    await page.setViewportSize({width:375,height:900});await capture('observation-mobile');await page.setViewportSize({width:1280,height:720});
    if(scenario==='eve'){
      if(!result.observation.includes('이브')||errors.length)throw new Error('Eve television tableau QA failed');
      fs.writeFileSync('qa/eve-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));return;
    }
    const remaining=Number((await page.locator('#spawn-status').innerText()).match(/(\d+)초/)?.[1]??0);
    await page.clock.runFor(remaining*1000+32);
    while((await page.locator('#spawn-status').innerText()).includes('탐색 시간'))await page.clock.runFor(250);
    result.notice=await page.locator('#subtitle').innerText();await capture('notice');
    const bearing=Math.atan2(target.x-position.x,target.z-position.z),directionWarnings=[];
    for(const angle of [bearing+Math.PI*.72,bearing-Math.PI*.72]){
      await face(angle);await page.clock.runFor(48);
      const warning=await page.locator('#rear-warning').innerText();directionWarnings.push(warning);
      await capture(`direction-${warning.includes('왼쪽')?'left':warning.includes('오른쪽')?'right':'center'}`);
    }
    result.directionWarnings=directionWarnings;
    await face(bearing+Math.PI);await page.clock.runFor(48);
    for(let elapsed=0;elapsed<5000&&!((await page.locator('#subtitle').innerText()).includes('두 팔'));elapsed+=100)await page.clock.runFor(100);
    result.lunge=await page.locator('#subtitle').innerText();await capture('lunge');
    await face(yaw+Math.PI);await capture('lunge-front');
    result.rearWarning=await page.locator('#rear-warning').innerText();
    console.log(JSON.stringify(result));
    if(!result.observation.includes('세라')||!result.notice.includes('숨을 들이쉰다')||!result.lunge.includes('두 팔')||!directionWarnings.some(value=>value.includes('왼쪽'))||!directionWarnings.some(value=>value.includes('오른쪽'))||errors.length)throw new Error('Familiar encounter QA failed');
    fs.writeFileSync('qa/familiar-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
  }finally{await browser.close();if(fs.existsSync('qa/familiar-map.cjs'))fs.rmSync('qa/familiar-map.cjs');}
})().catch(error=>{console.error(error);process.exitCode=1;});
