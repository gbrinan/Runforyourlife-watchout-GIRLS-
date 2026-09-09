const fs=require('fs');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const results={captures:[],errors:[],checks:[]};
 try{
  for(const width of [1280,768,375]){
   const page=await browser.newPage({viewport:{width,height:900}});
   page.on('pageerror',e=>results.errors.push(e.message));
   await page.addInitScript(()=>{const Base=window.AudioContext;window.AudioContext=class extends Base{constructor(...args){super(...args);window.qaContext=this;}};});
   await page.goto('http://127.0.0.1:5173/?seed=school-ritual',{waitUntil:'networkidle'});
   const shot=async(name)=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const path=`qa/school-${width}-${name}.png`;await page.screenshot({path});results.captures.push(path);};
   await shot('intro');
   await page.locator('#start').click();
   await page.waitForFunction(()=>window.qaContext?.state==='running');
   await shot('play');
   const position=()=>page.evaluate(()=>{const l=window.qaContext.listener;return {x:l.positionX.value,z:l.positionZ.value,fx:l.forwardX.value,fz:l.forwardZ.value};});
   if(width===1280){
    const before=await position();
    await page.keyboard.down('KeyQ');await page.waitForTimeout(500);await page.keyboard.up('KeyQ');
    const turned=await position();await shot('side');
    await page.keyboard.down('ArrowDown');await page.waitForTimeout(750);await page.keyboard.up('ArrowDown');await shot('ritual');
    await page.keyboard.down('KeyW');await page.waitForTimeout(500);await page.keyboard.up('KeyW');await page.waitForTimeout(100);
    const moved=await position();
    results.checks.push({before,turned,moved,turnDistance:Math.hypot(turned.x-before.x,turned.z-before.z),moveDistance:Math.hypot(moved.x-turned.x,moved.z-turned.z)});
    await page.keyboard.press('Escape');await shot('paused');
    if(await page.evaluate(()=>window.qaContext.state)!=='suspended')throw Error('Pause did not suspend audio');
   }else{
    await page.keyboard.down('KeyQ');await page.waitForTimeout(150);await page.keyboard.up('KeyQ');
    await page.keyboard.down('ArrowDown');await page.waitForTimeout(750);await page.keyboard.up('ArrowDown');await shot('ritual');
   }
   if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Horizontal overflow');
   await page.close();
  }
  fs.writeFileSync('qa/school-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
  if(results.errors.length||results.checks.some(c=>c.turnDistance>.01||c.moveDistance<.15))throw Error('School scene QA failed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
