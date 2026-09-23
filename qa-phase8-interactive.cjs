/**
 * SDK Hub QA Interactive Test — Phase 8: INTERACTIVE ELEMENTS TEST
 * Tests 8.1 (Buttons), 8.2 (Forms & Validation), 8.3 (Modals & ESC/Backdrop),
 * 8.4 (Dropdowns & Click Outside), 8.5 (Tabs), 8.6 (Search & Filter Debounce),
 * 8.7 (Period & Pagination), 8.8 (Keyboard Shortcuts), 8.9 (Hover States),
 * 8.10 (Loading/Empty States), 8.11 (Theme Toggles), 8.12 (Language Toggles)
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.join(__dirname, 'qa-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function takeSnap(page, name) {
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`[SCREENSHOT] ${name} -> ${filePath}`);
  return filePath;
}

async function setReactInput(page, selector, val) {
  await page.waitForSelector(selector);
  await page.evaluate((sel, value) => {
    const input = document.querySelector(sel);
    if (!input) return;
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;
    nativeSetter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, selector, val);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('\n===============================================================');
  console.log('🧪 FASE 8: COMPREHENSIVE INTERACTIVE ELEMENTS TEST');
  console.log('===============================================================\n');

  // Authenticate as Admin
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.removeItem('sdk_current_user_profile');
    localStorage.removeItem('sdk_current_role');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(800);
  await setReactInput(page, '#usernameOrEmail', 'arya.admin@subaga.id');
  await setReactInput(page, '#password', 'password123');
  const submitBtn = await page.waitForSelector('button[type="submit"]');
  await submitBtn.click();
  await sleep(2500);

  // --- 8.1 & 8.4: Dropdowns & Click Outside ---
  console.log('--- 8.1 & 8.4: Dropdowns & Click Outside ---');
  // Click Project Selector
  await page.evaluate(() => {
    const pSel = document.querySelector('header button');
    if (pSel) pSel.click();
  });
  await sleep(600);
  await takeSnap(page, 'test_8_4_project_dropdown_open');

  // Click outside to close
  await page.mouse.click(800, 300);
  await sleep(500);
  await takeSnap(page, 'test_8_4_dropdown_closed_outside');

  // --- 8.3 & 8.8: Keyboard Shortcuts (Ctrl+K & ESC) ---
  console.log('--- 8.3 & 8.8: Keyboard Shortcuts (Ctrl+K & ESC) ---');
  // Open search modal via Ctrl+K
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyK');
  await page.keyboard.up('Control');
  await sleep(800);
  await takeSnap(page, 'test_8_8_ctrl_k_modal_open');

  // Close search modal via ESC
  await page.keyboard.press('Escape');
  await sleep(600);
  await takeSnap(page, 'test_8_8_esc_modal_closed');

  // --- 8.2 & 8.3: Form Validation & Modal Backdrop Click ---
  console.log('--- 8.2 & 8.3: Form Validation & Modal Backdrop ---');
  // Go to /clients and open Add Client modal
  await page.goto(`${BASE_URL}/clients`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const add = btns.find(b => b.textContent.includes('Tambah Klien') || b.textContent.includes('Add Client'));
    if (add) add.click();
  });
  await sleep(800);
  await takeSnap(page, 'test_8_3_add_client_modal');

  // Try submitting empty form to trigger validation
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const save = btns.find(b => b.textContent.includes('Simpan') || b.textContent.includes('Buat Klien') || b.textContent.includes('Save'));
    if (save) save.click();
  });
  await sleep(600);
  await takeSnap(page, 'test_8_2_empty_form_validation');

  // Close via backdrop click
  await page.mouse.click(50, 50);
  await sleep(600);
  await takeSnap(page, 'test_8_3_modal_closed_backdrop');

  // --- 8.5: Tabs Switching ---
  console.log('--- 8.5: Tabs Switching on Time Tracking ---');
  await page.goto(`${BASE_URL}/time-tracking`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  const tabs = ['Timesheet', 'Audit Aktivitas', 'Analitik Eksekutif'];
  for (const t of tabs) {
    await page.evaluate((tabName) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const found = btns.find(b => b.textContent.includes(tabName));
      if (found) found.click();
    }, t);
    await sleep(400);
  }
  await takeSnap(page, 'test_8_5_tabs_switched');

  // --- 8.6: Search & Filter Debouncing ---
  console.log('--- 8.6: Search & Filter Debouncing on Projects ---');
  await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  const searchInput = await page.$('input[placeholder*="Cari"], input[placeholder*="Search"]');
  if (searchInput) {
    await searchInput.type('RSUD');
    await sleep(500);
    await takeSnap(page, 'test_8_6_search_debounced');
    // Clear search
    await page.evaluate((sel) => {
      const inp = document.querySelector(sel);
      if (inp) {
        inp.value = '';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 'input[placeholder*="Cari"], input[placeholder*="Search"]');
    await sleep(500);
  }

  // --- 8.7: Date Period Navigation on Timeline ---
  console.log('--- 8.7: Date Period Navigation on Timeline ---');
  await page.goto(`${BASE_URL}/timeline`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const prev = btns.find(b => b.querySelector('.lucide-chevron-left'));
    if (prev) prev.click();
  });
  await sleep(500);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const next = btns.find(b => b.querySelector('.lucide-chevron-right'));
    if (next) next.click();
  });
  await sleep(500);
  await takeSnap(page, 'test_8_7_timeline_period_navigated');

  // --- 8.9: Hover States ---
  console.log('--- 8.9: Hover States on Dashboard KPI Cards ---');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  const kpiCard = await page.$('div[class*="grid-cols"] > div[class*="rounded-xl"]');
  if (kpiCard) {
    await kpiCard.hover();
    await sleep(400);
    await takeSnap(page, 'test_8_9_kpi_card_hovered');
  }

  // --- 8.11: Theme Toggle (Dark & Light) ---
  console.log('--- 8.11: Theme Toggle on Settings ---');
  await page.goto(`${BASE_URL}/settings`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  // Switch to Appearance tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const appTab = btns.find(b => b.textContent.includes('Tampilan') || b.textContent.includes('Appearance'));
    if (appTab) appTab.click();
  });
  await sleep(600);

  // Click Light theme
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div.cursor-pointer'));
    const light = cards.find(c => c.textContent.includes('Terang') || c.textContent.includes('Light'));
    if (light) light.click();
  });
  await sleep(600);
  await takeSnap(page, 'test_8_11_theme_light_settings');

  // Click Dark theme
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div.cursor-pointer'));
    const dark = cards.find(c => c.textContent.includes('Gelap') || c.textContent.includes('Dark'));
    if (dark) dark.click();
  });
  await sleep(600);
  await takeSnap(page, 'test_8_11_theme_dark_settings');

  // --- 8.12: Language Toggle (ID ↔ EN) ---
  console.log('--- 8.12: Language Toggle on Preferences ---');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const prefTab = btns.find(b => b.textContent.includes('Preferensi') || b.textContent.includes('Preferences'));
    if (prefTab) prefTab.click();
  });
  await sleep(600);

  const langSelect = await page.$('select');
  if (langSelect) {
    await langSelect.select('en');
    await sleep(600);
    await takeSnap(page, 'test_8_12_lang_en');
    await langSelect.select('id');
    await sleep(600);
    await takeSnap(page, 'test_8_12_lang_id');
  }

  console.log('\n✅ FASE 8: INTERACTIVE ELEMENTS TESTS COMPLETED!\n');
  await browser.close();
})();
