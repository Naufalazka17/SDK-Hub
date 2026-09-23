const fs = require('fs');
const path = require('path');

const manualGenPath = path.join(__dirname, 'generate-manual.cjs');
let code = fs.readFileSync(manualGenPath, 'utf8');

console.log('Original generate-manual.cjs size:', code.length);

// 1. EMOJI REPLACEMENTS
// -------------------------------------------------------------
const emojiReplacements = [
  // Callouts & feature cards
  ['<strong>⚠️ CONFIDENTIAL & PROPRIETARY</strong>', '<strong>PERINGATAN: DOKUMEN TERTUTUP (CONFIDENTIAL & PROPRIETARY)</strong>'],
  ['<h4>🎨 1. Project Canvas & Inisiasi Adaptif</h4>', '<h4>1. Project Canvas & Inisiasi Adaptif</h4>'],
  ['<h4>📋 2. Orchestration Board & Template Khusus</h4>', '<h4>2. Orchestration Board & Template Khusus</h4>'],
  ['<h4>⏱️ 3. Resource & Timeline Orchestrator</h4>', '<h4>3. Resource & Timeline Orchestrator</h4>'],
  ['<h4>🏢 4. Client Cockpit (Portal Transparansi Klien)</h4>', '<h4>4. Client Cockpit (Portal Transparansi Klien)</h4>'],
  ['<strong>💡 Portabilitas PWA (Progressive Web App)</strong>', '<strong>Catatan Teknis: Portabilitas PWA (Progressive Web App)</strong>'],
  ['<strong>⚠️ Penandaan Tugas Terhambat (Is Blocked)</strong>', '<strong>Perhatian: Penandaan Tugas Terhambat (Is Blocked)</strong>'],
  ['<strong>⏱️ Kepatuhan Timesheet</strong>', '<strong>Ketentuan: Kepatuhan Timesheet</strong>'],

  // RBAC table
  ['<td style="text-align: center;">✅ Penuh</td>', '<td style="text-align: center;">Penuh</td>'],
  ['<td style="text-align: center;">✅ Khusus Lead</td>', '<td style="text-align: center;">Khusus Lead</td>'],
  ['<td style="text-align: center;">✅ Khusus Staff</td>', '<td style="text-align: center;">Khusus Staff</td>'],
  ['<td style="text-align: center;">❌ Dibatasi</td>', '<td style="text-align: center; color: #94A3B8;">Dibatasi</td>'],
  ['<td style="text-align: center;">✅ Semua Proyek</td>', '<td style="text-align: center;">Semua Proyek</td>'],
  ['<td style="text-align: center;">✅ Hanya Terdaftar</td>', '<td style="text-align: center;">Hanya Terdaftar</td>'],
  ['<td style="text-align: center;">✅ Ya</td>', '<td style="text-align: center;">Ya</td>'],
  ['<td style="text-align: center;">✅ Baca / Tulis</td>', '<td style="text-align: center;">Baca / Tulis</td>'],
  ['<td style="text-align: center;">✅ Update Tugas</td>', '<td style="text-align: center;">Update Tugas</td>'],
  ['<td style="text-align: center;">👁️ Lihat Saja</td>', '<td style="text-align: center;">Lihat Saja</td>'],
  ['<td style="text-align: center;">✅ Supervisi</td>', '<td style="text-align: center;">Supervisi</td>'],
  ['<td style="text-align: center;">✅ Portal Utama</td>', '<td style="text-align: center;">Portal Utama</td>'],
  ['<td style="text-align: center;">✅ Upload/Download</td>', '<td style="text-align: center;">Upload / Download</td>'],
  ['<td style="text-align: center;">✅ Sesuai Proyek</td>', '<td style="text-align: center;">Sesuai Proyek</td>'],
  ['<td style="text-align: center;">✅ Semua Channel</td>', '<td style="text-align: center;">Semua Channel</td>'],
  ['<td style="text-align: center;">✅ Channel Proyek</td>', '<td style="text-align: center;">Channel Proyek</td>'],
  ['<td style="text-align: center;">✅ Channel Tim</td>', '<td style="text-align: center;">Channel Tim</td>'],
  ['<td style="text-align: center;">✅ Channel Resmi</td>', '<td style="text-align: center;">Channel Resmi</td>'],
  ['<td style="text-align: center;">✅ Audit Seluruh Tim</td>', '<td style="text-align: center;">Audit Seluruh Tim</td>'],
  ['<td style="text-align: center;">✅ Rekapitulasi Tim</td>', '<td style="text-align: center;">Rekapitulasi Tim</td>'],
  ['<td style="text-align: center;">✅ Presensi Pribadi</td>', '<td style="text-align: center;">Presensi Pribadi</td>'],
  ['<td style="text-align: center;">✅ Buat & Edit</td>', '<td style="text-align: center;">Buat & Edit</td>'],
  ['<td style="text-align: center;">👁️ Gunakan Template</td>', '<td style="text-align: center;">Gunakan Template</td>'],
  ['<td style="text-align: center;">✅ Penuh (CRUD)</td>', '<td style="text-align: center;">Penuh (CRUD)</td>'],
  ['<td style="text-align: center;">✅ Laporan Proyek</td>', '<td style="text-align: center;">Laporan Proyek</td>'],
  ['<td style="text-align: center;">👁️ Proyek Terkait</td>', '<td style="text-align: center;">Proyek Terkait</td>'],
  ['<td style="text-align: center;">✅ Ada</td>', '<td style="text-align: center;">Tersedia</td>'],

  // Contact & SLA table
  ['<strong>📧 Email Dukungan Resmi</strong>', '<strong>Email Dukungan Resmi</strong>'],
  ['<strong>📞 Telepon / WhatsApp Helpline</strong>', '<strong>Telepon / WhatsApp Helpline</strong>'],
  ['<strong>🌐 Portal Web Resmi</strong>', '<strong>Portal Web Resmi</strong>'],
  ['<strong>📍 Alamat Kantor Operasional</strong>', '<strong>Alamat Kantor Operasional</strong>'],
  ['<strong>🕒 Jam Operasional Tim Support</strong>', '<strong>Jam Operasional Tim Dukungan Teknis</strong>'],

  // Closing team credits
  ['👨‍💻 <strong>Naufal Azka Pradifa Utomo</strong>', '<strong>Naufal Azka Pradifa Utomo</strong>'],
  ['🎨 <strong>Hadid Firdaus</strong>', '<strong>Hadid Firdaus</strong>'],
  ['⚡ <strong>Muhammad Abrurrahman Arrody</strong>', '<strong>Muhammad Abrurrahman Arrody</strong>'],
  ['🏢 <strong>Klien & Organisasi Penerima:</strong>', '<strong>Klien & Organisasi Penerima:</strong>'],
  ["console.log('✅ Successfully generated", "console.log('Successfully generated"]
];

let replacedCount = 0;
for (const [target, replacement] of emojiReplacements) {
  if (code.includes(target)) {
    code = code.split(target).join(replacement);
    replacedCount++;
  } else {
    console.warn('Target not found:', target);
  }
}
console.log(`Executed ${replacedCount}/${emojiReplacements.length} emoji block replacements.`);

// Also check for any residual emoji characters
const residualRegex = /[\u{1F300}-\u{1FAD6}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu;
const residualMatches = code.match(residualRegex) || [];
if (residualMatches.length > 0) {
  console.warn('Residual emojis found:', [...new Set(residualMatches)]);
} else {
  console.log('Zero residual emojis found in code text!');
}

// 2. CSS & PAGE BREAK ADJUSTMENTS
// -------------------------------------------------------------
// We need to update:
// - .cover-page: max-height: 270mm; page-break-after: always; margin-bottom: 0;
// - doc-control section: page-break-before: always; page-break-after: always;
// - .toc section: page-break-before: always; page-break-after: always;
// - h1: page-break-before: always; break-before: page; page-break-after: avoid; break-after: avoid; margin-top: 0;
// - h2: page-break-before: always; break-before: page; page-break-after: avoid; break-after: avoid; margin-top: 0;
// - h1 + h2, h1 + p + h2: page-break-before: avoid !important; break-before: avoid !important;

// Update CSS rules
const oldCssHeadings = `    /* HEADINGS */
    h1 {
      font-size: 22pt;
      font-weight: 800;
      color: #F97316;
      border-bottom: 3px solid #F97316;
      padding-bottom: 10px;
      margin: 45px 0 22px;
      page-break-before: always;
      page-break-after: avoid;
      letter-spacing: -0.015em;
    }

    h1:first-of-type,
    h1.no-break {
      page-break-before: avoid;
      margin-top: 10px;
    }

    h2 {
      font-size: 16pt;
      font-weight: 700;
      color: #0B0F19;
      margin: 32px 0 14px;
      page-break-after: avoid;
      display: flex;
      align-items: center;
      gap: 8px;
    }`;

const newCssHeadings = `    /* HEADINGS - EVERY HEADING STARTS AT BEGINNING OF PAGE */
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

if (code.includes(oldCssHeadings)) {
  code = code.replace(oldCssHeadings, newCssHeadings);
  console.log('Updated Headings CSS successfully.');
} else {
  console.warn('oldCssHeadings not found exactly. Checking partial match...');
}

// Update Cover page CSS
const oldCoverCss = `    /* COVER PAGE */
    .cover-page {
      page: cover;
      page-break-after: always;
      min-height: 280mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 60px 40px;
      background: linear-gradient(145deg, #0B0F19 0%, #172033 100%);
      color: white;
      position: relative;
      border-radius: 8px;
      margin-bottom: 40px;
    }`;

const newCoverCss = `    /* COVER PAGE */
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

if (code.includes(oldCoverCss)) {
  code = code.replace(oldCoverCss, newCoverCss);
  console.log('Updated Cover page CSS successfully.');
} else {
  console.warn('oldCoverCss not found exactly.');
}

// Update Print Media CSS
const oldPrintCss = `    @media print {
      body {
        background: white;
        padding: 0;
      }
      .page-container {
        max-width: none;
        padding: 0;
        box-shadow: none;
      }
      .no-print {
        display: none !important;
      }
      a {
        color: #1e293b;
        text-decoration: none;
      }
      .page-break {
        page-break-before: always;
      }
      .avoid-break {
        page-break-inside: avoid;
      }
    }`;

const newPrintCss = `    @media print {
      body {
        background: white;
        padding: 0;
      }
      .page-container {
        max-width: none;
        padding: 0;
        box-shadow: none;
      }
      .no-print {
        display: none !important;
      }
      a {
        color: #1e293b;
        text-decoration: none;
      }
      .page-break {
        page-break-before: always;
        break-before: page;
      }
      .page-break-after {
        page-break-after: always;
        break-after: page;
      }
      .avoid-break {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .screenshot {
        page-break-inside: avoid;
        break-inside: avoid;
        margin: 14px 0 18px;
      }
      .screenshot img {
        max-height: 380px !important;
      }
      table {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .callout, .feature-card {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .steps > li {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      h1 {
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
      }
    }`;

if (code.includes(oldPrintCss)) {
  code = code.replace(oldPrintCss, newPrintCss);
  console.log('Updated Print CSS successfully.');
} else {
  console.warn('oldPrintCss not found exactly.');
}

// Update section tags for Document Control & Table of Contents
const oldDocControl = `<section class="avoid-break" style="margin-top: 30px;">
    <h2 style="margin-top: 0;">Informasi Pengendalian Dokumen & Tim Pengembang</h2>`;

const newDocControl = `<section id="doc-control" style="page-break-before: always; break-before: page; page-break-after: always; break-after: page; padding-top: 10px;">
    <h2 style="margin-top: 0;">Informasi Pengendalian Dokumen & Tim Pengembang</h2>`;

if (code.includes(oldDocControl)) {
  code = code.replace(oldDocControl, newDocControl);
  console.log('Updated Document Control section tag.');
}

const oldToc = `<section class="toc" id="daftar-isi">
    <h1 class="no-break">Daftar Isi</h1>`;

const newToc = `<section class="toc" id="daftar-isi" style="page-break-before: always; break-before: page; page-break-after: always; break-after: page; padding-top: 10px;">
    <h1 style="page-break-before: avoid; margin-top: 0;">Daftar Isi</h1>`;

if (code.includes(oldToc)) {
  code = code.replace(oldToc, newToc);
  console.log('Updated Table of Contents section tag.');
}

// Save modified code
fs.writeFileSync(manualGenPath, code, 'utf8');
console.log('Saved updated generate-manual.cjs successfully!');
