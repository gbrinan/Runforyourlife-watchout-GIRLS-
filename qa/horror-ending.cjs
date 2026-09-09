const fs=require('fs');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const esbuild=require('esbuild');
esbuild.buildSync({entryPoints:['src/gen/dungeon.ts'],outfile:'qa/horror-map.cjs',bundle:true,platform:'node',format:'cjs'});
esbuild.buildSync({entryPoints:['src/systems/puzzle.ts'],outfile:'qa/horror-puzzle.cjs',bundle:true,platform:'node',format:'cjs'});
const {createDungeonLayout,isDungeonBlocked}=require('./horror-map.cjs');
const {createPuzzle}=require('./horror-puzzle.cjs');
function route(map,from,to){
 const cell=p=>Math.floor(p.z)*map.size+Math.floor(p.x),origin=cell(from),goal=cell(to),parents=new Map([[origin,origin]]),q=[origin];
 for(let i=0;i<q.length&&!parents.has(goal);i++){const n=q[i],x=n%map.size,z=Math.floor(n/map.size);for(const [dx,dz]of [[1,0],[0,1],[-1,0],[0,-1]]){const a=x+dx,b=z+dz,k=b*map.size+a;if(!parents.has(k)&&!isDungeonBlocked(map,{x:a+.5,z:b+.5})){parents.set(k,n);q.push(k);}}}
 if(!parents.has(goal))throw Error('No route');let n=goal,path=[to];while(n!==origin){path.push({x:n%map.size+.5,z:Math.floor(n/map.size)+.5});n=parents.get(n);}path.push({x:origin%map.size+.5,z:Math.floor(origin/map.size)+.5});return path.reverse();
}
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const seed='exit-4',map=createDungeonLayout(seed),puzzle=createPuzzle(map,seed),result={seed,errors};
 try{
  await page.clock.install({time:new Date('2026-09-07T00:00:00Z')});
  await page.goto('http://127.0.0.1:5173/?seed='+seed);await page.clock.pauseAt(new Date('2026-09-07T00:00:02Z'));
  for(const width of [375,768,1280]){await page.setViewportSize({width,height:width===1280?720:900});await page.screenshot({path:`qa/horror-start-${width}.png`});}
  await page.evaluate(()=>{window.qaMouse=[];document.addEventListener('mousemove',e=>window.qaMouse.push(e.movementX));});
  const startBox=await page.locator('#start').boundingBox();let my=startBox.y+startBox.height/2;
  await page.locator('#start').click();await page.clock.runFor(32);
  let position={...map.start},yaw=Math.atan2(map.sockets[0].point.x-map.start.x,map.sockets[0].point.z-map.start.z),mx=640;
  async function face(angle){let delta=angle-yaw;while(delta>Math.PI)delta-=Math.PI*2;while(delta<-Math.PI)delta+=Math.PI*2;await page.evaluate(()=>window.qaMouse=[]);mx-=delta/.002;await page.mouse.move(mx,my);await page.clock.runFor(16);yaw-=(await page.evaluate(()=>window.qaMouse)).reduce((a,b)=>a+b,0)*.002;}
  async function go(target){const dx=target.x-position.x,dz=target.z-position.z,d=Math.hypot(dx,dz);if(d<.04)return;await face(Math.atan2(dx,dz));const ms=Math.round(d/3/.016)*16;await page.keyboard.down('KeyW');await page.clock.runFor(ms);await page.keyboard.up('KeyW');position.x+=Math.sin(yaw)*3*ms/1000;position.z+=Math.cos(yaw)*3*ms/1000;}
  async function travel(point){for(const p of route(map,position,point))await go(p);}
  async function approach(point){const dx=map.start.x-point.x,dz=map.start.z-point.z,d=Math.hypot(dx,dz);await travel({x:point.x+dx/d*1.1,z:point.z+dz/d*1.1});await face(Math.atan2(point.x-position.x,point.z-position.z));}
  await page.screenshot({path:'qa/horror-jump-rest.png'});await page.keyboard.press('Space');await page.clock.runFor(240);await page.screenshot({path:'qa/horror-jump-air.png'});result.jump=await page.locator('#subtitle').innerText();await page.clock.runFor(650);await page.screenshot({path:'qa/horror-jump-land.png'});result.landing=await page.locator('#subtitle').innerText();
  for(const key of ['KeyS','KeyW','KeyA','KeyD','KeyQ','KeyE']){await page.keyboard.down(key);await page.clock.runFor(160);result[key]=await page.locator('#stats').innerText();await page.keyboard.up(key);await page.clock.runFor(16);await page.screenshot({path:`qa/horror-control-${key}.png`});}
  // Equal opposite inputs return to the starting position and yaw without mutating game state.
  await approach(puzzle.clue);await page.keyboard.press('KeyR');await page.clock.runFor(64);result.clue=await page.locator('#subtitle').innerText();await page.screenshot({path:'qa/horror-clue.png'});
  const wrong=puzzle.bells.find(b=>b.id!==puzzle.order[0]);await approach(wrong.point);await page.keyboard.press('KeyR');await page.clock.runFor(64);result.wrong=await page.locator('#subtitle').innerText();await page.screenshot({path:'qa/horror-wrong.png'});
  for(const width of [375,768,1280]){await page.setViewportSize({width,height:width===1280?720:900});await page.clock.runFor(160);await page.screenshot({path:`qa/horror-puzzle-${width}.png`});}
  for(const id of puzzle.order){await approach(puzzle.bells[id].point);await page.keyboard.press('KeyR');await page.clock.runFor(64);}
  result.solved=await page.locator('#objective').innerText();await page.screenshot({path:'qa/horror-solved.png'});
  if(!result.solved.includes('봉인 해제'))throw Error('Puzzle did not unlock: '+JSON.stringify(result));
  await travel(map.exit.inside);await face(Math.atan2(map.exit.normal.x,map.exit.normal.z));await page.screenshot({path:'qa/horror-exit.png'});await travel(map.exit.outside);await page.clock.runFor(16);
  result.title=await page.locator('#overlay-title').innerText();if(result.title!=='캔디마운틴')throw Error('Ending not reached: '+result.title);
  const description=await page.locator('#overlay-description').innerText();await page.clock.runFor(5000);result.frozen=description===await page.locator('#overlay-description').innerText();
  for(const width of [1280,768,375]){await page.setViewportSize({width,height:width===1280?720:900});await page.clock.runFor(160);await page.screenshot({path:`qa/horror-ending-${width}.png`});}
  await page.locator('#start').click();await page.clock.runFor(32);result.restart=!(await page.locator('body').getAttribute('class')||'').includes('ending');
  await page.setViewportSize({width:1280,height:720});await page.goto('http://127.0.0.1:5173/?seed='+seed);await page.clock.runFor(160);
  await page.evaluate(()=>{window.qaMouse=[];document.addEventListener('mousemove',e=>window.qaMouse.push(e.movementX));});
  const box=await page.locator('#start').boundingBox();my=box.y+box.height/2;mx=box.x+box.width/2;position={...map.start};yaw=Math.atan2(map.sockets[0].point.x-map.start.x,map.sockets[0].point.z-map.start.z);
  await page.locator('#start').click();await page.clock.runFor(32);await travel(map.exit.inside);await face(Math.atan2(map.exit.normal.x,map.exit.normal.z));
  await page.keyboard.down('KeyW');await page.keyboard.press('Space');await page.clock.runFor(1400);await page.keyboard.up('KeyW');
  result.locked=!(await page.locator('body').getAttribute('class')||'').includes('ending')&&(await page.locator('#subtitle').innerText()).includes('출구를 막고');await page.screenshot({path:'qa/horror-locked.png'});
  if(!result.locked)throw Error('Unsolved gate did not stop jumping player');
  if(errors.length||!result.frozen||!result.restart||!result.wrong.includes('틀렸다'))throw Error(JSON.stringify(result));
  fs.writeFileSync('qa/horror-results.json',JSON.stringify(result,null,2));console.log(result);
 }catch(error){await page.screenshot({path:'qa/horror-failure.png'});console.error(result);throw error;}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
