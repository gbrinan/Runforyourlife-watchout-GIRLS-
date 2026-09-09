const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];page.on('pageerror',e=>errors.push(e.message));const result=[];
 try{
  await page.goto('http://127.0.0.1:5173/?seed=explore-qa');await page.screenshot({path:'qa/explore-start-1280.png'});
  await page.locator('#start').click();await page.screenshot({path:'qa/explore-quiet-1280.png'});
  result.push({opening:await page.locator('#spawn-status').innerText()});
  await page.keyboard.press('KeyE');await page.waitForTimeout(500);result.push({afterLoudNoise:await page.locator('#spawn-status').innerText()});
  await page.keyboard.down('KeyW');await page.waitForFunction(()=>document.querySelector('#interaction').textContent.includes('가챠 작동'),{},{timeout:5000});await page.keyboard.up('KeyW');
  await page.keyboard.press('KeyR');await page.waitForFunction(()=>document.querySelector('#interaction').textContent.includes('유인 중'));await page.screenshot({path:'qa/explore-gacha-1280.png'});
  result.push({device:await page.locator('#interaction').innerText(),feedback:await page.locator('#subtitle').innerText()});
  await page.keyboard.down('KeyA');await page.waitForFunction(()=>document.querySelector('#interaction').textContent.includes('조명 끄기'),{},{timeout:5000});await page.keyboard.up('KeyA');
  await page.keyboard.press('KeyR');await page.waitForFunction(()=>document.querySelector('#interaction').textContent.includes('조명 켜기'));await page.screenshot({path:'qa/explore-light-off-1280.png'});
  result.push({light:await page.locator('#interaction').innerText(),feedback:await page.locator('#subtitle').innerText()});
  await page.keyboard.press('Escape');await page.screenshot({path:'qa/explore-pause-1280.png'});
  for(const width of [375,768]){await page.setViewportSize({width,height:900});await page.reload();await page.screenshot({path:`qa/explore-start-${width}.png`});}
  result.push({errors});fs.writeFileSync('qa/explore-browser-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
