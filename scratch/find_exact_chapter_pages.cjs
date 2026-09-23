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

  // Open the PDF
  const pdfPath = path.resolve('scratch/test-out.pdf');
  const pdfUrl = 'file:///' + pdfPath.replace(/\\/g, '/');
  console.log('Loading PDF URL:', pdfUrl);
  await page.goto(pdfUrl, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  // In Chrome PDF viewer, the document title shows "SDK Orchestration Hub — User Manual v2.5"
  // Let's take screenshots of the thumbnail sidebar scrolled down to see all page thumbnails!
  // To scroll thumbnail sidebar:
  const thumbSidebar = await page.$('embed');
  
  // Let's take screenshots of sidebar scrolled at 0%, 25%, 50%, 75%, 100%
  const shotsDir = path.resolve('scratch/pages_check');
  if (!fs.existsSync(shotsDir)) fs.mkdirSync(shotsDir, { recursive: true });

  for (let p of [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75]) {
    await page.goto(`${pdfUrl}#page=${p}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(shotsDir, `page_${p}.png`) });
    console.log(`Captured screenshot for page ${p}`);
  }

  await browser.close();
}

main().catch(console.error);
