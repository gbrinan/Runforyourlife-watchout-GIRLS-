const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');const fs=require('fs');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{await page.goto('http://127.0.0.1:5173/?seed=explore-qa');await page.locator('#start').click();
await page.waitForFunction(()=>document.querySelector('#spawn-status').textContent.includes('1 / 3'),{},{timeout:60000});await page.keyboard.press('KeyE');
await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>document.body.classList.contains('rear-chase'),{},{timeout:90000});await page.keyboard.up('ArrowRight');
await page.screenshot({path:'qa/hunt-rear-warning.png'});const rear=await page.locator('#rear-warning').isVisible();
await page.waitForFunction(()=>document.querySelector('#subtitle').textContent.includes('괴성'),{},{timeout:12000});await page.screenshot({path:'qa/hunt-scream.png'});
const result={rear,scream:await page.locator('#subtitle').innerText(),errors};fs.writeFileSync('qa/hunt-warning-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await page.keyboard.press('Escape');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
