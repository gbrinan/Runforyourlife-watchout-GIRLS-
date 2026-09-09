const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    // Given a running game that acquired pointer lock.
    const page=await browser.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:5173/?seed=pointer-unlock',{waitUntil:'networkidle'});
    await page.locator('#start').click();

    // When the browser releases pointer lock.
    await page.evaluate(()=>document.exitPointerLock());
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    await page.waitForTimeout(100);

    // Then unlocked keyboard and mouse fallback remains playable.
    const overlayHidden=await page.locator('#overlay').evaluate(element=>element.hidden);
    console.log(JSON.stringify({overlayHidden,errors}));
    if(!overlayHidden||errors.length>0)throw new Error('Pointer unlock stopped active gameplay');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
