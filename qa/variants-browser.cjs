const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];page.on('pageerror',e=>errors.push(e.message));const results=[];
 let aimX=0,aimY=0;
 async function start(){const box=await page.locator('#start').boundingBox();aimX=box.x+box.width/2;aimY=box.y+box.height/2;await page.locator('#start').click();}
 async function aim(){aimX+=320;await page.mouse.move(aimX,aimY);await page.screenshot();}
 try{
  await page.goto('http://127.0.0.1:5173/?seed=qa-final');await page.screenshot({path:'qa/variants-start-1280.png'});
  await page.locator('#cast-open').focus();await page.keyboard.press('Enter');await page.locator('#cast').waitFor({state:'visible'});await page.locator('.cast-card img').last().waitFor();
  await page.screenshot({path:'qa/variants-gallery-1280.png'});
  results.push({galleryCount:await page.locator('.cast-card').count()});
  await page.keyboard.press('Escape');await start();
  await page.keyboard.press('KeyE');
  await page.waitForFunction(()=>document.querySelector('#stalker-status').textContent.includes('추격 중'));
  await page.screenshot({path:'qa/stalker-hunting-1280.png'});
  await page.waitForFunction(()=>document.querySelector('#stalker-status').textContent.includes('봉인 가능'),{},{timeout:15000});
  await page.screenshot({path:'qa/stalker-vulnerable-1280.png'});
  await aim();await page.keyboard.press('Space');
  await page.waitForFunction(()=>document.querySelector('#stalker-status').textContent==='이브 봉인 완료');
  results.push({sealed:await page.locator('#stalker-status').innerText(),feedback:await page.locator('#subtitle').innerText()});
  await page.screenshot({path:'qa/stalker-sealed-1280.png'});
  await page.keyboard.press('Escape');
  await page.screenshot({path:'qa/variants-pause-1280.png'});
  await page.reload();await start();
  await page.keyboard.down('KeyS');await page.waitForTimeout(1100);await page.keyboard.up('KeyS');await page.keyboard.press('KeyE');
  await page.waitForFunction(()=>document.body.classList.contains('tail-lost'),{},{timeout:15000});
  await page.screenshot({path:'qa/stalker-outside-before-1280.png'});
  await aim();
  await page.keyboard.press('Space');
  await page.waitForFunction(()=>document.querySelector('#subtitle').textContent.includes('잠깐 멈췄을 뿐'));
  await page.screenshot({path:'qa/stalker-repelled-1280.png'});
  await page.waitForTimeout(900);await page.screenshot({path:'qa/stalker-resumes-1280.png'});
  results.push({outsideSeal:await page.locator('#stalker-status').innerText(),feedback:await page.locator('#subtitle').innerText()});
  for(const width of [768,375]){
   await page.setViewportSize({width,height:900});await page.reload();await page.screenshot({path:`qa/variants-start-${width}.png`});
   await page.locator('#cast-open').focus();await page.keyboard.press('Enter');await page.locator('#cast').waitFor({state:'visible'});await page.locator('.cast-card img').last().waitFor();
   await page.screenshot({path:`qa/variants-gallery-${width}.png`});
   if(width===375)for(let i=1;i<5;i++){await page.locator('.cast-card').nth(i).scrollIntoViewIfNeeded();await page.screenshot({path:`qa/variants-card-${i}-375.png`});}
   results.push({width,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
   await page.locator('#cast-close').click();
  }
  results.push({errors});fs.writeFileSync('qa/variants-browser-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));if(errors.length)throw new Error('pageerror');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});



