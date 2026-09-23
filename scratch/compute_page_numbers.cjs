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
  // Viewport matching printable width
  await page.setViewport({ width: 794, height: 1123 });

  const manualPath = path.resolve('docs/user-manual.html');
  await page.goto('file:///' + manualPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await page.emulateMediaType('print');

  const pageHeight = 986; // printable height in px at 96dpi

  const chapterAnchors = [
    { id: 'pendahuluan', name: '1. Pendahuluan' },
    { id: 'roles', name: '2. Daftar Role & Matriks Hak Akses' },
    { id: 'getting-started', name: '3. Panduan Memulai (Getting Started)' },
    { id: 'admin', name: '4. Panduan Lengkap Administrator (ADMIN)' },
    { id: 'project-lead', name: '5. Panduan Project Lead (PROJECT_LEAD)' },
    { id: 'staff', name: '6. Panduan Staff Engineer (STAFF)' },
    { id: 'client', name: '7. Panduan Pengguna Klien (CLIENT)' },
    { id: 'flow', name: '8. Alur Kerja Terpadu End-to-End (E2E Scenario)' },
    { id: 'faq', name: '9. Pertanyaan yang Sering Diajukan (FAQ)' },
    { id: 'troubleshooting', name: '10. Panduan Troubleshooting & Pemecahan Masalah' },
    { id: 'contact', name: '11. Kontak & Dukungan Teknis' }
  ];

  // Measure each section and its subsections
  const result = await page.evaluate((anchors) => {
    // Collect all elements with break-before: page
    const items = [];
    const elements = document.querySelectorAll('section.cover-page, section#doc-control, section#daftar-isi, section[id] > h1, section[id] > h2');
    
    return anchors.map(a => {
      const el = document.getElementById(a.id);
      return {
        id: a.id,
        name: a.name,
        exists: !!el
      };
    });
  }, chapterAnchors);

  console.log('Chapter anchors validation:', result);

  await browser.close();
}

main().catch(console.error);
