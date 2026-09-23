const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

async function main() {
  const manualGenPath = path.join(__dirname, 'generate-manual.cjs');
  let content = fs.readFileSync(manualGenPath, 'utf8');

  // 1. Fix Cover Page and @page :first margin in CSS
  const oldPageCss = `    @page {
      size: A4;
      margin: 20mm 15mm;
      @bottom-center {
        content: "SDK Orchestration Hub — User Manual v2.5 • Halaman " counter(page);
        font-size: 8.5pt;
        color: #64748B;
        font-family: 'Inter', sans-serif;
      }
    }

    @page :first {
      @bottom-center {
        content: none;
      }
    }

    @page cover {
      margin: 0;
    }`;

  const newPageCss = `    @page {
      size: A4;
      margin: 18mm 15mm;
    }

    @page :first {
      margin: 0;
    }`;

  if (content.includes(oldPageCss)) {
    content = content.replace(oldPageCss, newPageCss);
    console.log('Updated @page and @page :first margin.');
  }

  // Ensure cover page fills 100% on first page without white border
  const oldCoverStyle = `    /* COVER PAGE */
    .cover-page {
      page: cover;
      page-break-before: avoid;
      break-before: avoid;
      page-break-after: always;
      break-after: page;
      min-height: 250mm;
      max-height: 265mm;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 40px 30px;
      background: linear-gradient(145deg, #0B0F19 0%, #172033 100%);
      color: white;
      position: relative;
      border-radius: 8px;
      margin-bottom: 0;
    }`;

  const newCoverStyle = `    /* COVER PAGE */
    .cover-page {
      page: cover;
      page-break-before: avoid;
      break-before: avoid;
      page-break-after: always;
      break-after: page;
      height: 297mm;
      min-height: 297mm;
      max-height: 297mm;
      width: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 50px 40px;
      background: linear-gradient(145deg, #0B0F19 0%, #172033 100%);
      color: white;
      position: relative;
      border-radius: 0;
      margin: 0;
    }`;

  if (content.includes(oldCoverStyle)) {
    content = content.replace(oldCoverStyle, newCoverStyle);
    console.log('Updated cover page style to full height 297mm.');
  }

  // 2. Remove double breaks from doc-control and toc
  // #doc-control should have break-before: always; but NOT break-after: always (since toc has break-before: always)
  content = content.replace(
    'page-break-before: always; break-before: page; page-break-after: always; break-after: page; padding-top: 10px;',
    'page-break-before: always; break-before: page; padding-top: 10px;'
  );

  // #daftar-isi should have break-before: always; but NOT break-after: always (since chapter 1 has break-before: always)
  content = content.replace(
    'page-break-before: always; break-before: page; page-break-after: always; break-after: page; padding-top: 10px;',
    'page-break-before: always; break-before: page; padding-top: 10px;'
  );

  fs.writeFileSync(manualGenPath, content, 'utf8');
  console.log('Saved generate-manual.cjs with corrected page breaks.');

  // Regenerate user-manual.html
  require('./generate-manual.cjs');
  console.log('Regenerated user-manual.html');
}

main().catch(console.error);
