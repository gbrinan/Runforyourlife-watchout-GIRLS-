const fs=require('fs'),{chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
require('esbuild').buildSync({entryPoints:['src/gen/dungeon.ts'],outfile:'qa/exit-map.cjs',bundle:true,platform:'node',format:'cjs'});
const {createDungeonLayout,isDungeonBlocked}=require('./exit-map.cjs');
function route(map,from,to){const cell=p=>Math.floor(p.z)*map.size+Math.floor(p.x),origin=cell(from),goal=cell(to),parents=new Map([[origin,origin]]),q=[origin];for(let i=0;i<q.length&&!parents.has(goal);i++){const n=q[i],x=n%map.size,z=Math.floor(n/map.size);for(const [dx,dz]of [[1,0],[0,1],[-1,0],[0,-1]]){const a=x+dx,b=z+dz,k=b*map.size+a;if(!parents.has(k)&&!isDungeonBlocked(map,{x:a+.5,z:b+.5})){parents.set(k,n);q.push(k);}}}if(!parents.has(goal))throw Error('No route');let n=goal,path=[to];while(n!==origin){path.push({x:n%map.size+.5,z:Math.floor(n/map.size)+.5});n=parents.get(n);}path.push({x:origin%map.size+.5,z:Math.floor(origin/map.size)+.5});return path.reverse();}
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));try{
 const seed='exit-0',map=createDungeonLayout(seed);await page.clock.install({time:new Date('2026-09-07T00:00:00Z')});await page.goto('http://127.0.0.1:5173/?seed='+seed);await page.clock.pauseAt(new Date('2026-09-07T00:00:02Z'));await page.screenshot({path:'qa/random-start.png'});
 await page.evaluate(()=>{window.qaMouse=[];document.addEventListener('mousemove',e=>window.qaMouse.push(e.movementX));});
 await page.locator('#start').click();await page.clock.runFor(32);
 let position={...map.start};const first=map.sockets[0];let yaw=Math.atan2(first.point.x-map.start.x,first.point.z-map.start.z);let mx=640;
 async function face(angle){let delta=angle-yaw;while(delta>Math.PI)delta-=2*Math.PI;while(delta<-Math.PI)delta+=2*Math.PI;await page.evaluate(()=>window.qaMouse=[]);mx-=delta/.002;await page.mouse.move(mx,360);await page.clock.runFor(16);const moves=await page.evaluate(()=>window.qaMouse);yaw-=moves.reduce((a,b)=>a+b,0)*.002;}
 async function go(target){let dx=target.x-position.x,dz=target.z-position.z,d=Math.hypot(dx,dz);if(d<.035)return;await face(Math.atan2(dx,dz));const ms=Math.round(d/3/.016)*16;await page.keyboard.down('KeyW');await page.clock.runFor(ms);await page.keyboard.up('KeyW');position.x+=Math.sin(yaw)*3*ms/1000;position.z+=Math.cos(yaw)*3*ms/1000;}
 await page.screenshot({path:'qa/random-map-b.png'});

 const snapshots=[];
 for(const [i,device] of map.sockets.filter(s=>s.room===0).entries()){
  const target={x:device.point.x+Math.sin(device.yaw)*1.3,z:device.point.z+Math.cos(device.yaw)*1.3};
  for(const p of route(map,position,target))await go(p);
  await face(Math.atan2(device.point.x-position.x,device.point.z-position.z));await page.clock.runFor(16);
  const before=await page.locator('#interaction').innerText();await page.keyboard.press('KeyR');await page.clock.runFor(16);
  snapshots.push({kind:device.kind,before,after:await page.locator('#interaction').innerText(),feedback:await page.locator('#subtitle').innerText()});
  await page.screenshot({path:'qa/random-'+device.kind+'.png'});
  if(device.kind==='switch'){await page.keyboard.press('KeyR');await page.clock.runFor(16);await page.screenshot({path:'qa/random-switch-on.png'});}
 }
 await page.keyboard.press('Escape');await page.clock.runFor(16);await page.screenshot({path:'qa/random-pause.png'});
 fs.writeFileSync('qa/random-browser-results.json',JSON.stringify({snapshots,errors},null,2));console.log({snapshots,errors});

 }catch(e){await page.screenshot({path:'qa/exit-failure.png'});throw e;}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
