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
  const pdfUrl = 'file:///' + path.resolve('scratch/test-out.pdf').replace(/\\/g, '/');
  
  // We can load the PDF or inspect HTML pagination
  // Instead of loading PDF, let's load docs/user-manual.html and measure page break positions
  const manualPath = path.resolve('docs/user-manual.html');
  await page.goto('file:///' + manualPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

  // Let's check sections that have page-break-after
  const doubleBreaks = await page.evaluate(() => {
    const list = [];
    const elements = document.querySelectorAll('*');
    elements.forEach(el => {
      const style = window.getComputedStyle(el);
      const breakAfter = style.pageBreakAfter || style.breakAfter;
      if (breakAfter === 'always' || breakAfter === 'page') {
        list.push({ tag: el.tagName, id: el.id, class: el.className, breakAfter });
      }
    });
    return list;
  });

  console.log('Elements with break-after: always/page:');
  console.log(JSON.stringify(doubleBreaks, null, 2));

  await browser.close();
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
