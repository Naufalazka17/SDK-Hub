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
  await page.setViewport({ width: 1200, height: 1600 });
  
  const pdfUrl = 'file:///' + path.resolve('scratch/test-footer.pdf').replace(/\\/g, '/');
  console.log('Loading PDF URL:', pdfUrl);
  await page.goto(pdfUrl, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  const screenshotPath = path.resolve('scratch/pdf_viewer_footer_shot.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Saved PDF viewer screenshot:', screenshotPath);

  await browser.close();
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
