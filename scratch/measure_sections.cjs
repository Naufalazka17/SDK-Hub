const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--allow-file-access-from-files']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const manualPath = path.resolve('docs/user-manual.html');
  await page.goto('file:///' + manualPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await page.emulateMediaType('print');

  // Let's inspect the sections and their sub-headings
  const sections = await page.evaluate(() => {
    const list = [];
    const secs = document.querySelectorAll('section[id], section.cover-page, section.toc');
    secs.forEach(s => {
      const h1 = s.querySelector('h1');
      const h2s = Array.from(s.querySelectorAll('h2')).map(h => h.innerText.trim().replace(/\n/g, ' '));
      list.push({
        id: s.id || s.className,
        h1: h1 ? h1.innerText.trim().replace(/\n/g, ' ') : '',
        h2Count: h2s.length,
        h2s: h2s
      });
    });
    return list;
  });

  console.log('Sections and H2 counts:');
  sections.forEach((s, idx) => {
    console.log(`${idx + 1}. [${s.id}] H1: "${s.h1}" (H2 count: ${s.h2Count})`);
  });

  await browser.close();
}

main().catch(console.error);
