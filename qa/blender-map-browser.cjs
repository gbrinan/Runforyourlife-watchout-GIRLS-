const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');

(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];
  let assetStatus=0;
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.url().endsWith('/assets/dungeon-kit.glb'))assetStatus=response.status();});
  try{
    await page.goto('http://127.0.0.1:5173/?seed=blender-dungeon-final');
    await page.locator('#start').click();
    await page.waitForTimeout(1200);
    await page.screenshot({path:'qa/blender-map-final.png'});
    for(let direction=1;direction<=3;direction++){
      await page.keyboard.down('KeyD');
      await page.waitForTimeout(720);
      await page.keyboard.up('KeyD');
      await page.screenshot({path:`qa/blender-map-turn-${direction}.png`});
    }
    const stats=await page.locator('#stats').innerText();
    const result={assetStatus,stats,errors};
    fs.writeFileSync('qa/blender-map-browser-results.json',JSON.stringify(result,null,2));
    if(assetStatus!==200||errors.length)throw new Error(JSON.stringify(result));
    console.log(JSON.stringify(result));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
