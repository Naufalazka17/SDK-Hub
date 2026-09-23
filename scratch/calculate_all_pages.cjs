const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  const manualPath = path.resolve('docs/user-manual.html');
  await page.goto('file:///' + manualPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await page.emulateMediaType('print');

  // Let's check which elements cause page breaks and simulate the page number
  const headings = await page.evaluate(() => {
    const list = [];
    const elements = document.querySelectorAll('h1, h2');
    elements.forEach(el => {
      const computed = window.getComputedStyle(el);
      list.push({
        tag: el.tagName,
        text: el.innerText.trim().replace(/\n/g, ' '),
        id: el.id || (el.parentElement ? el.parentElement.id : ''),
        breakBefore: computed.breakBefore || computed.pageBreakBefore
      });
    });
    return list;
  });

  console.log('Total Headings:', headings.length);
  headings.forEach((h, i) => {
    console.log(`${i+1}. [${h.tag}] (break=${h.breakBefore}) ${h.text}`);
  });

  await browser.close();
}

main().catch(console.error);
