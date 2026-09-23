/**
 * SDK Hub QA Interactive Test — Phase 2 Part D:
 * Tests 2.16 (Time Tracking), 2.17 (Reports & Analytics), 2.18 (Activity Log),
 * 2.19 (Notifications), 2.20 (Settings)
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
  console.log('🧪 FASE 2 Part D: TIME TRACKING, REPORTS, LOGS, NOTIFS, SETTINGS');
  console.log('===============================================================\n');

  // Login as ADMIN
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await sleep(800);
  await setReactInput(page, '#usernameOrEmail', 'arya.admin@subaga.id');
  await setReactInput(page, '#password', 'password123');
  const submitBtn = await page.waitForSelector('button[type="submit"]');
  await submitBtn.click();
  await sleep(2500);

  // --- Test 2.16: Time Tracking ---
  console.log('--- Test 2.16: Time Tracking ---');
  await page.goto(`${BASE_URL}/time-tracking`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await takeSnap(page, 'test_2_16_timetracking_initial');

  // Test tabs: Timesheet, Audit Aktivitas, Analitik Eksekutif
  console.log('Testing Time Tracking tabs...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const actTab = btns.find(b => b.textContent.includes('Audit') || b.textContent.includes('Activity'));
    if (actTab) actTab.click();
  });
  await sleep(600);
  await takeSnap(page, 'test_2_16_tab_audit');

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const analTab = btns.find(b => b.textContent.includes('Analitik') || b.textContent.includes('Analytics'));
    if (analTab) analTab.click();
  });
  await sleep(600);
  await takeSnap(page, 'test_2_16_tab_analytics');

  // Back to Timesheet
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const tsTab = btns.find(b => b.textContent.includes('Timesheet'));
    if (tsTab) tsTab.click();
  });
  await sleep(600);

  // Test Clock In / Out
  console.log('Testing Clock In / Out form...');
  const notesInput = await page.$('input[placeholder*="Catatan"], input[placeholder*="notes"]');
  if (notesInput) {
    await notesInput.type('Automated QA Shift Test Notes');
    // Click clock in
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const clockIn = btns.find(b => b.textContent.includes('Mulai Shift') || b.textContent.includes('Clock In'));
      if (clockIn) clockIn.click();
    });
    await sleep(2000);
    await takeSnap(page, 'test_2_16_clocked_in');

    // Now test Clock Out
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const clockOut = btns.find(b => b.textContent.includes('Clock Out') || b.textContent.includes('Simpan Durasi'));
      if (clockOut) clockOut.click();
    });
    await sleep(2000);
    await takeSnap(page, 'test_2_16_clocked_out');
  }

  // --- Test 2.17: Reports & Analytics ---
  console.log('\n--- Test 2.17: Reports & Analytics ---');
  await page.goto(`${BASE_URL}/reports`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await takeSnap(page, 'test_2_17_reports_initial');

  // Test Time Range & Project Filters
  console.log('Testing Reports filters...');
  const repSelects = await page.$$('select');
  if (repSelects.length > 0) {
    // select time range
    const opts = await repSelects[0].$$('option');
    if (opts.length > 1) {
      const val = await page.evaluate(el => el.value, opts[1]);
      await repSelects[0].select(val);
      await sleep(500);
    }
  }
  if (repSelects.length > 1) {
    // select project
    const opts = await repSelects[1].$$('option');
    if (opts.length > 1) {
      const val = await page.evaluate(el => el.value, opts[1]);
      await repSelects[1].select(val);
      await sleep(500);
    }
  }
  await takeSnap(page, 'test_2_17_reports_filtered');

  // --- Test 2.18: Activity Log ---
  console.log('\n--- Test 2.18: Activity Log ---');
  await page.goto(`${BASE_URL}/activity`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await takeSnap(page, 'test_2_18_activity_initial');

  // Test Category Pills
  console.log('Testing category pills in Activity Log...');
  const actPills = ['task', 'project', 'time', 'file', 'chat'];
  for (const cat of actPills) {
    await page.evaluate((c) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const pill = btns.find(b => b.textContent.toLowerCase().includes(c));
      if (pill) pill.click();
    }, cat);
    await sleep(250);
  }
  await takeSnap(page, 'test_2_18_category_pill_selected');

  // Test Expand / Collapse All
  console.log('Testing Expand & Collapse All...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const exp = btns.find(b => b.textContent.includes('Buka Semua') || b.textContent.includes('Expand All'));
    if (exp) exp.click();
  });
  await sleep(600);
  await takeSnap(page, 'test_2_18_expanded_all');

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const col = btns.find(b => b.textContent.includes('Tutup Semua') || b.textContent.includes('Collapse All'));
    if (col) col.click();
  });
  await sleep(600);
  await takeSnap(page, 'test_2_18_collapsed_all');

  // --- Test 2.19: Notifications ---
  console.log('\n--- Test 2.19: Notifications ---');
  await page.goto(`${BASE_URL}/notifications`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await takeSnap(page, 'test_2_19_notifications_initial');

  // Test tabs: All, Unread, Mentions
  console.log('Testing Notification tabs...');
  const notifTabs = ['Belum Dibaca', 'Sebutan', 'Unread', 'Mentions', 'Semua', 'All'];
  for (const t of notifTabs) {
    await page.evaluate((txt) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tab = btns.find(b => b.textContent.includes(txt));
      if (tab) tab.click();
    }, t);
    await sleep(300);
  }
  await takeSnap(page, 'test_2_19_tabs_tested');

  // Test click notification item -> Drawer
  console.log('Testing click notification item...');
  await page.evaluate(() => {
    const notifItems = Array.from(document.querySelectorAll('div.cursor-pointer, button.cursor-pointer'));
    if (notifItems.length > 0) notifItems[0].click();
  });
  await sleep(1000);
  await takeSnap(page, 'test_2_19_notification_drawer_open');

  // Close Drawer
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button[aria-label*="Close"], button .lucide-x')?.closest('button');
    if (closeBtn) closeBtn.click();
  });
  await sleep(500);

  // --- Test 2.20: Settings ---
  console.log('\n--- Test 2.20: Settings ---');
  await page.goto(`${BASE_URL}/settings`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await takeSnap(page, 'test_2_20_settings_profile_tab');

  // Test Tab: Account & Avatar
  console.log('Testing Settings Tab: Account & Avatar...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const accTab = btns.find(b => b.textContent.includes('Akun') || b.textContent.includes('Account'));
    if (accTab) accTab.click();
  });
  await sleep(600);
  await takeSnap(page, 'test_2_20_settings_account_tab');

  // Test Avatar Crop Modal Open & Close
  console.log('Testing Avatar Crop Modal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const chgBtn = btns.find(b => b.textContent.includes('Ganti Foto') || b.textContent.includes('Change Photo'));
    if (chgBtn) chgBtn.click();
  });
  await sleep(1000);
  await takeSnap(page, 'test_2_20_avatar_crop_modal_open');

  // Close Cropper Modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cancel = btns.find(b => b.textContent.includes('Batal') || b.textContent.includes('Cancel') || b.querySelector('.lucide-x'));
    if (cancel) cancel.click();
  });
  await sleep(600);

  // Test Reset Password button
  console.log('Testing Reset Password button...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const reset = btns.find(b => b.textContent.includes('Kirim Reset') || b.textContent.includes('Send Reset'));
    if (reset) reset.click();
  });
  await sleep(800);
  await takeSnap(page, 'test_2_20_reset_password_triggered');

  // Test Tab: Appearance (Dark, Light, System)
  console.log('Testing Settings Tab: Appearance (Theme Switches)...');
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
  await takeSnap(page, 'test_2_20_theme_light');

  // Click Dark theme
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div.cursor-pointer'));
    const dark = cards.find(c => c.textContent.includes('Gelap') || c.textContent.includes('Dark'));
    if (dark) dark.click();
  });
  await sleep(600);
  await takeSnap(page, 'test_2_20_theme_dark');

  // Test Tab: Preferences
  console.log('Testing Settings Tab: Preferences...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const prefTab = btns.find(b => b.textContent.includes('Preferensi') || b.textContent.includes('Preferences'));
    if (prefTab) prefTab.click();
  });
  await sleep(600);

  // Test Language Switch in Preferences
  const prefSelects = await page.$$('select');
  if (prefSelects.length > 0) {
    await prefSelects[0].select('en');
    await sleep(500);
    await takeSnap(page, 'test_2_20_preferences_lang_en');
    await prefSelects[0].select('id');
    await sleep(500);
    await takeSnap(page, 'test_2_20_preferences_lang_id');
  }

  console.log('\n✅ FASE 2 Part D (Tests 2.16, 2.17, 2.18, 2.19, 2.20) COMPLETED!\n');
  await browser.close();
})();
