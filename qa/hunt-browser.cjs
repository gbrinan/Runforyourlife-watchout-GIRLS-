const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];page.on('pageerror',e=>errors.push(e.message));const results=[];
 try{
  await page.goto('http://127.0.0.1:5173/?seed=explore-qa');await page.locator('#start').click();
  const beginning=Date.now();results.push({time:0,status:await page.locator('#spawn-status').innerText()});
  for(const count of [1,2,3]){
   await page.waitForFunction(n=>document.querySelector('#spawn-status').textContent.includes(n+' / 3'),count,{timeout:150000});
   results.push({wallSeconds:(Date.now()-beginning)/1000,status:await page.locator('#spawn-status').innerText()});await page.screenshot({path:`qa/hunt-population-${count}.png`});console.log('population',count);
  }
  await page.keyboard.press('KeyE');
  await page.waitForFunction(()=>document.body.classList.contains('rear-chase'),{},{timeout:90000});
  await page.screenshot({path:'qa/hunt-rear-warning.png'});
  results.push({rearWarning:await page.locator('#rear-warning').isVisible(),status:await page.locator('#subtitle').innerText()});
  await page.waitForFunction(()=>document.querySelector('#subtitle').textContent.includes('괴성'),{},{timeout:12000});
  await page.screenshot({path:'qa/hunt-scream.png'});results.push({screamCaption:await page.locator('#subtitle').innerText()});
  await page.keyboard.press('Escape');
  results.push({errors});fs.writeFileSync('qa/hunt-browser-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
