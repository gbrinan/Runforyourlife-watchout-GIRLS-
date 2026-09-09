const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  const results = [];
  try {
    for (const viewport of [{ width: 1280, height: 800 }, { width: 375, height: 812 }]) {
      const page = await browser.newPage({ viewport });
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://127.0.0.1:5173/?seed=threat-variation', { waitUntil: 'networkidle' });
      await page.locator('#cast-open').click();
      await page.locator('#cast').waitFor({ state: 'visible' });
      await page.locator('.cast-card img').last().waitFor();
      const cards = await page.locator('.cast-card').evaluateAll(nodes => nodes.map(node => ({
        name: node.querySelector('h3')?.textContent,
        description: node.querySelector('p')?.textContent,
        detail: node.querySelector('.small')?.textContent,
        imageWidth: node.querySelector('img')?.naturalWidth,
        imageHeight: node.querySelector('img')?.naturalHeight,
      })));
      await page.screenshot({ path: `qa/threat-gallery-${viewport.width}.png`, fullPage: true });
      if (viewport.width === 375) {
        for (let index = 0; index < cards.length; index += 1) {
          await page.locator('.cast-card').nth(index).scrollIntoViewIfNeeded();
          await page.screenshot({ path: `qa/threat-card-${index + 1}-375.png` });
        }
      }
      results.push({ viewport, cards, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) });
      await page.close();
    }
    results.push({ errors });
    fs.writeFileSync('qa/threat-variation-results.json', JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results));
    if (errors.length) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
