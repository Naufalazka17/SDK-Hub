const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

async function test() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const manualPath = path.resolve('docs/user-manual.html');
  await page.goto('file:///' + manualPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

  // Evaluate bounding rects in print mode
  await page.emulateMediaType('print');

  const headingData = await page.evaluate(() => {
    const list = [];
    const elements = document.querySelectorAll('h1, h2');
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      list.push({
        tag: el.tagName,
        text: el.innerText.trim().replace(/\n/g, ' '),
        top: Math.round(rect.top + window.scrollY),
        height: Math.round(rect.height)
      });
    });
    return list;
  });

  console.log('Total headings found:', headingData.length);
  headingData.slice(0, 30).forEach((h, i) => {
    console.log(`${i+1}. [${h.tag}] (Y=${h.top}px): ${h.text}`);
  });

  await browser.close();
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
