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
  const manualPath = path.resolve('docs/user-manual.html');
  await page.goto('file:///' + manualPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

  // In A4 print layout, get page index of each heading
  // A4 page height in points is 841.89 pt (297mm). In px at 96dpi it is ~1122.5px.
  // With Puppeteer, we can find client rects or evaluate in page
  const data = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2'));
    return headings.map(h => ({
      tag: h.tagName,
      text: h.innerText.trim().replace(/\n/g, ' '),
      offsetTop: h.offsetTop
    }));
  });

  console.log(`Found ${data.length} headings.`);
  data.forEach((h, i) => {
    // approx page assuming ~1050px per page if continuous
    console.log(`${i+1}. [${h.tag}] offset=${h.offsetTop}px : ${h.text}`);
  });

  await browser.close();
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
