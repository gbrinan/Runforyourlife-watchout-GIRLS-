const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const evidence=[];
  try {
    await page.goto('http://127.0.0.1:5173/?seed=qa-final');
    await page.screenshot({path:'qa/controls-start-1280.png'});
    await page.locator('#sensitivity').fill('0.7');
    await page.locator('#camera-bob').check();
    await page.locator('#camera-bob').uncheck();
    await page.locator('#start').click();
    await page.waitForFunction(()=>document.querySelector('#overlay').hidden);
    for(const key of ['KeyW','KeyS','KeyA','KeyD']) {
      await page.keyboard.down(key);
      await page.waitForFunction(()=>document.querySelector('#stats').textContent.includes('3.0 m/s'));
      evidence.push({input:key,moving:await page.locator('#stats').innerText()});
      await page.keyboard.up(key);
      await page.waitForFunction(()=>document.querySelector('#stats').textContent.includes('0.0 m/s'));
    }
    await page.keyboard.down('ShiftLeft');await page.keyboard.down('KeyW');
    await page.waitForFunction(()=>document.querySelector('#stats').textContent.includes('8.0 m/s'));
    evidence.push({input:'Shift + W',moving:await page.locator('#stats').innerText()});
    await page.screenshot({path:'qa/controls-running-1280.png'});
    await page.keyboard.up('ShiftLeft');
    await page.waitForFunction(()=>document.querySelector('#stats').textContent.includes('3.0 m/s'));
    await page.keyboard.up('KeyW');await page.keyboard.down('ControlLeft');await page.keyboard.down('KeyW');
    await page.waitForFunction(()=>document.querySelector('#stats').textContent.includes('1.5 m/s'));
    evidence.push({input:'Ctrl + W',moving:await page.locator('#stats').innerText()});
    await page.keyboard.up('ControlLeft');await page.keyboard.up('KeyW');
    await page.mouse.move(640,360);await page.mouse.move(900,360,{steps:12});
    await page.screenshot({path:'qa/controls-mouse-look-1280.png'});
    await page.keyboard.press('Space');
    await page.waitForFunction(()=>document.querySelector('#subtitle').textContent==='뿔을 내질렀다.');
    evidence.push({input:'Space',result:await page.locator('#subtitle').innerText()});
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>!document.querySelector('#overlay').hidden);
    await page.screenshot({path:'qa/controls-paused-1280.png'});
    evidence.push({input:'Escape',result:await page.locator('#overlay-title').innerText(),sensitivity:await page.locator('#sensitivity').inputValue()});
    await page.reload();await page.locator('#start').click();await page.keyboard.press('KeyE');
    await page.screenshot({path:'qa/maiden-approach-start.png'});
    await page.waitForTimeout(1800);
    await page.screenshot({path:'qa/maiden-approach-mid.png'});
    await page.waitForFunction(()=>document.body.classList.contains('tail-lost'),{},{timeout:15000});
    await page.screenshot({path:'qa/maiden-close-1280.png'});
    await page.keyboard.press('Space');
    evidence.push({input:'Space near enemy',result:await page.locator('#subtitle').innerText()});
    await page.waitForFunction(()=>!document.querySelector('#overlay').hidden&&document.querySelector('#overlay-title').textContent==='붙잡혔다.',{},{timeout:15000});
    await page.screenshot({path:'qa/controls-death-1280.png'});
    for(const width of [375,768]) {
      await page.setViewportSize({width,height:900});await page.reload();
      await page.screenshot({path:`qa/controls-start-${width}.png`});
      evidence.push({width,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
    }
    evidence.push({pageErrors:errors});
    fs.writeFileSync('qa/controls-browser-results.json',JSON.stringify(evidence,null,2));
    console.log(JSON.stringify(evidence));
    if(errors.length)throw new Error('Browser errors');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

