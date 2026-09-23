const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

async function main() {
  const manualPath = path.join(__dirname, '..', 'docs', 'user-manual.html');
  const pdfPath = path.join(__dirname, '..', 'docs', 'SDK-Orchestration-Hub-User-Manual-v2.5.pdf');
  const screenshotsDir = path.join(__dirname, '..', 'docs', 'screenshots');

  // 1. Verify all image references
  const htmlContent = fs.readFileSync(manualPath, 'utf8');
  const imgRegex = /src="screenshots\/([^"]+)"/g;
  let match;
  const referencedImages = new Set();
  const missingImages = [];

  while ((match = imgRegex.exec(htmlContent)) !== null) {
    const imgName = match[1];
    referencedImages.add(imgName);
    const fullImgPath = path.join(screenshotsDir, imgName);
    if (!fs.existsSync(fullImgPath)) {
      missingImages.push(imgName);
    }
  }

  console.log('--- Image Verification ---');
  console.log(`Total unique images referenced in user-manual.html: ${referencedImages.size}`);
  if (missingImages.length > 0) {
    console.error('❌ Missing images:', missingImages);
  } else {
    console.log('✅ ALL referenced images exist on disk!');
  }

  // 2. Launch browser
  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];

  let executablePath = null;
  for (const p of chromePaths) {
    if (fs.existsSync(p)) {
      executablePath = p;
      break;
    }
  }

  if (!executablePath) {
    console.error('No Chrome or Edge found!');
    process.exit(1);
  }

  console.log(`Using browser: ${executablePath}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--allow-file-access-from-files'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const fileUrl = 'file:///' + manualPath.replace(/\\/g, '/');
  console.log(`Loading URL: ${fileUrl}`);

  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

  // Take screenshot of rendered cover & intro
  const previewPath = path.join(screenshotsDir, 'manual-preview-desktop.png');
  await page.screenshot({ path: previewPath, fullPage: false });
  console.log(`✅ Saved preview screenshot to: ${previewPath}`);

  // 3. Generate PDF
  console.log('Generating PDF: SDK-Orchestration-Hub-User-Manual-v2.5.pdf ...');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: {
      top: '0mm',
      bottom: '0mm',
      left: '0mm',
      right: '0mm'
    }
  });

  const pdfStats = fs.statSync(pdfPath);
  console.log(`✅ PDF generated successfully!`);
  console.log(`   Path: ${pdfPath}`);
  console.log(`   Size: ${(pdfStats.size / (1024 * 1024)).toFixed(2)} MB`);

  await browser.close();
}

main().catch(err => {
  console.error('Error during verification and PDF generation:', err);
  process.exit(1);
});
