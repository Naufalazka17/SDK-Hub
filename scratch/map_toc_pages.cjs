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
  const pdfUrl = 'file:///' + path.resolve('scratch/test-out.pdf').replace(/\\/g, '/');
  await page.goto(pdfUrl, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  // In Chrome's PDF viewer (which runs as an embedded extension or component):
  // Let's see if we can query the embed or find text
  // Alternatively, let's load docs/user-manual.html and compute page boundaries based on print styles!
  await page.goto('file:///' + path.resolve('docs/user-manual.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await page.emulateMediaType('print');

  // Let's list all h1 elements and their ids
  const chapters = await page.evaluate(() => {
    const list = [];
    const h1s = document.querySelectorAll('section > h1');
    h1s.forEach(h => {
      const section = h.closest('section');
      list.push({
        id: section ? section.id : '',
        title: h.innerText.trim().replace(/\n/g, ' ')
      });
    });
    return list;
  });

  console.log('Chapters found in DOM:', chapters);

  await browser.close();
}

main().catch(console.error);
