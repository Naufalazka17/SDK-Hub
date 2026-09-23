const fs = require('fs');
const path = require('path');

const manualGenPath = path.join(__dirname, 'generate-manual.cjs');
let code = fs.readFileSync(manualGenPath, 'utf8');

// Replace the CSS headings block
const oldCssBlock = `    /* HEADINGS - EVERY HEADING STARTS AT BEGINNING OF PAGE */
    h1 {
      font-size: 20pt;
      font-weight: 800;
      color: #F97316;
      border-bottom: 3px solid #F97316;
      padding-bottom: 8px;
      margin: 0 0 18px 0;
      page-break-before: always;
      break-before: page;
      page-break-after: avoid;
      break-after: avoid;
      letter-spacing: -0.015em;
    }

    h1:first-of-type {
      page-break-before: avoid;
      break-before: avoid;
      margin-top: 0;
    }

    h2 {
      font-size: 14.5pt;
      font-weight: 700;
      color: #0B0F19;
      margin: 0 0 14px 0;
      padding-top: 0;
      page-break-before: always;
      break-before: page;
      page-break-after: avoid;
      break-after: avoid;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* First H2 immediately following H1 (or H1 + intro text) stays on the chapter start page */
    h1 + h2,
    h1 + p + h2,
    h1 + div + h2,
    .no-break-top {
      page-break-before: avoid !important;
      break-before: avoid !important;
      margin-top: 16px;
    }`;

const newCssBlock = `    /* HEADINGS - EVERY CHAPTER AND SUBSECTION TITLE STARTS AT BEGINNING OF PAGE */
    section[id] {
      page-break-before: always;
      break-before: page;
    }

    h1 {
      font-size: 20pt;
      font-weight: 800;
      color: #F97316;
      border-bottom: 3px solid #F97316;
      padding-bottom: 8px;
      margin: 0 0 18px 0;
      page-break-before: always !important;
      break-before: page !important;
      page-break-after: avoid;
      break-after: avoid;
      letter-spacing: -0.015em;
    }

    .cover-page h1,
    .toc h1,
    h1.no-break {
      page-break-before: avoid !important;
      break-before: avoid !important;
      margin-top: 0;
    }

    h2 {
      font-size: 14.5pt;
      font-weight: 700;
      color: #0B0F19;
      margin: 0 0 14px 0;
      padding-top: 0;
      page-break-before: always !important;
      break-before: page !important;
      page-break-after: avoid;
      break-after: avoid;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* First H2 immediately following H1 (or H1 + intro text) stays on the chapter start page */
    h1 + h2,
    h1 + p + h2,
    h1 + div + h2,
    .no-break-top {
      page-break-before: avoid !important;
      break-before: avoid !important;
      margin-top: 16px;
    }`;

if (code.includes(oldCssBlock)) {
  code = code.replace(oldCssBlock, newCssBlock);
  console.log('Replaced oldCssBlock with newCssBlock successfully.');
} else {
  console.warn('oldCssBlock not found!');
}

// In @media print also ensure h1 and h2 rules match
const oldPrintBlock = `      h1 {
        page-break-before: always;
        break-before: page;
        page-break-after: avoid;
        break-after: avoid;
        margin-top: 0;
        padding-top: 0;
      }
      h2 {
        page-break-before: always;
        break-before: page;
        page-break-after: avoid;
        break-after: avoid;
        margin-top: 0;
        padding-top: 0;
      }
      h1 + h2,
      h1 + p + h2,
      h1 + div + h2,
      .no-break-top {
        page-break-before: avoid !important;
        break-before: avoid !important;
        margin-top: 16px;
      }`;

const newPrintBlock = `      section[id] {
        page-break-before: always;
        break-before: page;
      }
      h1 {
        page-break-before: always !important;
        break-before: page !important;
        page-break-after: avoid;
        break-after: avoid;
        margin-top: 0;
        padding-top: 0;
      }
      .cover-page h1,
      .toc h1,
      h1.no-break {
        page-break-before: avoid !important;
        break-before: avoid !important;
        margin-top: 0;
      }
      h2 {
        page-break-before: always !important;
        break-before: page !important;
        page-break-after: avoid;
        break-after: avoid;
        margin-top: 0;
        padding-top: 0;
      }
      h1 + h2,
      h1 + p + h2,
      h1 + div + h2,
      .no-break-top {
        page-break-before: avoid !important;
        break-before: avoid !important;
        margin-top: 16px;
      }`;

if (code.includes(oldPrintBlock)) {
  code = code.replace(oldPrintBlock, newPrintBlock);
  console.log('Replaced oldPrintBlock with newPrintBlock successfully.');
}

fs.writeFileSync(manualGenPath, code, 'utf8');
console.log('Saved generate-manual.cjs.');

// Regenerate user-manual.html
require('./generate-manual.cjs');
