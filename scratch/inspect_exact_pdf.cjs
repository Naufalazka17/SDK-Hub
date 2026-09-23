const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const manualPath = path.resolve('docs/user-manual.html');
  const fileUrl = 'file:///' + manualPath.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

  // Generate test PDF to scratch/test-out.pdf
  const pdfPath = path.resolve('scratch/test-out.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }
  });

  const stats = fs.statSync(pdfPath);
  console.log(`PDF created: ${pdfPath} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);

  // Now let's calculate the page number of every heading
  // In Chromium print layout, 1 page of A4 is 297mm.
  // With Puppeteer, we can evaluate element positions or count pages.
  const pageHeightPt = 841.89; // 297mm in points
  const pageWidthPt = 595.28; // 210mm in points

  // Let's inspect total pages in PDF
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfStr = pdfBytes.toString('latin1');
  const pageMatches = pdfStr.match(/\/Type\s*\/Page\b/g);
  const totalPages = pageMatches ? pageMatches.length : 0;
  console.log(`Total Pages in PDF: ${totalPages}`);

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
