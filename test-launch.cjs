const fs = require('fs');
const puppeteer = require('puppeteer-core');

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

async function testLaunch() {
  let executablePath = null;
  for (const p of chromePaths) {
    if (fs.existsSync(p)) {
      executablePath = p;
      console.log('Found browser at:', p);
      break;
    }
  }

  if (!executablePath) {
    console.error('No Chrome or Edge executable found!');
    process.exit(1);
  }

  console.log('Launching browser with puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });
  const title = await page.title();
  console.log('Page Title:', title);

  await browser.close();
  console.log('Browser launch test successful!');
}

testLaunch().catch(err => {
  console.error('Launch failed:', err);
  process.exit(1);
});
