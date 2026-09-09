const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
const crypto=require('crypto');

(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  try{
    await page.goto('http://127.0.0.1:5173/?seed=turn-exit-final');
    await page.locator('#start').click();
    await page.waitForTimeout(100);
    const before=await page.screenshot({path:'qa/turn-final-before.png'});
    await page.keyboard.down('KeyD');await page.waitForTimeout(600);await page.keyboard.up('KeyD');
    const afterD=await page.screenshot({path:'qa/turn-final-after-d.png'});
    const dStats=await page.locator('#stats').innerText();
    await page.keyboard.down('KeyE');await page.waitForTimeout(1200);await page.keyboard.up('KeyE');
    const afterE=await page.screenshot({path:'qa/turn-final-after-e.png'});
    const eStats=await page.locator('#stats').innerText();
    await page.keyboard.press('KeyQ');await page.waitForTimeout(50);
    const qFeedback=await page.locator('#subtitle').innerText();
    const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
    const result={dChanged:hash(before)!==hash(afterD),eChanged:hash(afterD)!==hash(afterE),dStats,eStats,qFeedback,errors};
    fs.writeFileSync('qa/turn-exit-browser-results.json',JSON.stringify(result,null,2));
    if(!result.dChanged||!result.eChanged||!dStats.includes('0.0 m/s')||!eStats.includes('0.0 m/s')||errors.length)throw new Error(JSON.stringify(result));
    console.log(JSON.stringify(result));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
