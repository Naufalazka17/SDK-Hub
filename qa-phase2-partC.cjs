/**
 * SDK Hub QA Interactive Test — Phase 2 Part C:
 * Tests 2.10 (Resources), 2.11 (Users), 2.12 (Clients),
 * 2.13 (Templates), 2.14 (Realtime Chat), 2.15 (Files Repository)
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
  console.log('🧪 FASE 2 Part C: RESOURCES, USERS, CLIENTS, CHAT, FILES (ADMIN)');
  console.log('===============================================================\n');

  // Login as ADMIN
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await sleep(800);
  await setReactInput(page, '#usernameOrEmail', 'arya.admin@subaga.id');
  await setReactInput(page, '#password', 'password123');
  const submitBtn = await page.waitForSelector('button[type="submit"]');
  await submitBtn.click();
  await sleep(2500);

  // --- Test 2.10: Resources Management ---
  console.log('--- Test 2.10: Resources Management ---');
  await page.goto(`${BASE_URL}/resources`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await takeSnap(page, 'test_2_10_resources_initial');

  // Filter dropdowns
  console.log('Testing Resources filters...');
  const resSelects = await page.$$('select');
  for (let i = 0; i < resSelects.length; i++) {
    const opts = await resSelects[i].$$('option');
    if (opts.length > 1) {
      const val = await page.evaluate(el => el.value, opts[1]);
      await resSelects[i].select(val);
      await sleep(300);
    }
  }
  await takeSnap(page, 'test_2_10_resources_filtered');

  // Click Resource row -> Drawer
  console.log('Testing Resource click -> Drawer...');
  const resRowClicked = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tbody tr, tr.cursor-pointer'));
    if (rows.length > 0) {
      rows[0].click();
      return true;
    }
    return false;
  });
  await sleep(1000);
  await takeSnap(page, 'test_2_10_resource_drawer_open');

  // Drawer Tabs: Overview, Tasks, Allocation
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('div[class*="drawer"] button, .fixed button'));
    const allocTab = tabs.find(t => t.textContent.includes('Alokasi') || t.textContent.includes('Allocation') || t.textContent.includes('Tugas'));
    if (allocTab) allocTab.click();
  });
  await sleep(600);
  await takeSnap(page, 'test_2_10_resource_drawer_tab');

  // Close Drawer
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button[aria-label*="Close"], button .lucide-x')?.closest('button');
    if (closeBtn) closeBtn.click();
  });
  await sleep(500);

  // --- Test 2.11: Users Management ---
  console.log('\n--- Test 2.11: Users Management ---');
  await page.goto(`${BASE_URL}/users`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await takeSnap(page, 'test_2_11_users_initial');

  // Test Add User Modal
  console.log('Testing Add User modal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent.includes('Tambah Pengguna') || b.textContent.includes('Add User') || b.textContent.includes('User Baru'));
    if (addBtn) addBtn.click();
  });
  await sleep(1000);
  await takeSnap(page, 'test_2_11_add_user_modal_open');

  // Close modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cancel = btns.find(b => b.textContent.includes('Batal') || b.textContent.includes('Cancel') || b.querySelector('.lucide-x'));
    if (cancel) cancel.click();
  });
  await sleep(500);

  // Click user row -> Edit Drawer
  console.log('Testing User row click -> Edit Drawer...');
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    if (rows.length > 0) rows[0].click();
  });
  await sleep(1000);
  await takeSnap(page, 'test_2_11_user_drawer_open');
  // Close drawer
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button[aria-label*="Close"], button .lucide-x')?.closest('button');
    if (closeBtn) closeBtn.click();
  });
  await sleep(500);

  // --- Test 2.12: Clients Management ---
  console.log('\n--- Test 2.12: Clients Management ---');
  await page.goto(`${BASE_URL}/clients`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await takeSnap(page, 'test_2_12_clients_initial');

  // Test Add Client Modal
  console.log('Testing Add Client modal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent.includes('Tambah Klien') || b.textContent.includes('Add Client') || b.textContent.includes('Klien Baru'));
    if (addBtn) addBtn.click();
  });
  await sleep(1000);
  await takeSnap(page, 'test_2_12_add_client_modal_open');

  // Fill Add Client form
  const nameInp = await page.$('input[name="name"], input[placeholder*="Nama Klien"], input[placeholder*="Client Name"]');
  if (nameInp) await nameInp.type('RS Hermina Sehat');
  const compInp = await page.$('input[name="company"], input[placeholder*="Perusahaan"], input[placeholder*="Company"]');
  if (compInp) await compInp.type('PT Hermina Sehat Medika');
  const picNameInp = await page.$('input[name="pic_name"], input[placeholder*="PIC Name"], input[placeholder*="Nama PIC"]');
  if (picNameInp) await picNameInp.type('dr. Sarah Wijaya');
  const picEmailInp = await page.$('input[name="pic_email"], input[placeholder*="email"], input[placeholder*="Email"]');
  if (picEmailInp) await picEmailInp.type(`sarah.pic.${Date.now()}@hermina.id`);
  const picPhoneInp = await page.$('input[name="pic_phone"], input[placeholder*="telepon"], input[placeholder*="Phone"]');
  if (picPhoneInp) await picPhoneInp.type('081234567890');
  await sleep(400);
  await takeSnap(page, 'test_2_12_add_client_modal_filled');

  // Submit Client
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const save = btns.find(b => b.textContent.includes('Simpan') || b.textContent.includes('Buat Klien') || b.textContent.includes('Save') || b.textContent.includes('Create'));
    if (save) save.click();
  });
  await sleep(2000);
  await takeSnap(page, 'test_2_12_client_credentials_modal');

  // Close Credentials Modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const done = btns.find(b => b.textContent.includes('Selesai') || b.textContent.includes('Done') || b.textContent.includes('Tutup'));
    if (done) done.click();
  });
  await sleep(800);

  // --- Test 2.13: Templates ---
  console.log('\n--- Test 2.13: Templates ---');
  await page.goto(`${BASE_URL}/templates`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await takeSnap(page, 'test_2_13_templates_initial');

  // Preview Tasks modal
  console.log('Testing Preview Tasks modal on template...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const prev = btns.find(b => b.textContent.includes('Lihat Tugas') || b.textContent.includes('Preview') || b.textContent.includes('Detail'));
    if (prev) prev.click();
  });
  await sleep(1000);
  await takeSnap(page, 'test_2_13_template_preview_modal');

  // Close modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const close = btns.find(b => b.textContent.includes('Tutup') || b.textContent.includes('Close') || b.querySelector('.lucide-x'));
    if (close) close.click();
  });
  await sleep(600);

  // --- Test 2.14: Realtime Chat ---
  console.log('\n--- Test 2.14: Realtime Chat ---');
  await page.goto(`${BASE_URL}/chat`, { waitUntil: 'domcontentloaded' });
  await sleep(2000);
  await takeSnap(page, 'test_2_14_chat_initial');

  // Click New Group button -> modal
  console.log('Testing New Group Chat modal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const grp = btns.find(b => b.textContent.includes('Grup') || b.textContent.includes('Group') || b.querySelector('.lucide-plus'));
    if (grp) grp.click();
  });
  await sleep(800);
  await takeSnap(page, 'test_2_14_new_group_modal_open');

  // Close modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cancel = btns.find(b => b.textContent.includes('Batal') || b.textContent.includes('Cancel') || b.querySelector('.lucide-x'));
    if (cancel) cancel.click();
  });
  await sleep(500);

  // Select first conversation & send message
  console.log('Sending message in conversation...');
  await page.evaluate(() => {
    const convs = document.querySelectorAll('button[class*="text-left"], div[class*="cursor-pointer"]');
    if (convs.length > 0) convs[0].click();
  });
  await sleep(800);

  const msgInput = await page.$('input[placeholder*="pesan"], input[placeholder*="message"], textarea');
  if (msgInput) {
    await msgInput.type('Automated QA Interactive Test Message at ' + new Date().toLocaleTimeString());
    const sendBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const s = btns.find(b => b.querySelector('.lucide-send') || b.textContent.includes('Kirim') || b.textContent.includes('Send'));
      if (s) { s.click(); return true; }
      return false;
    });
    await sleep(1500);
    await takeSnap(page, 'test_2_14_message_sent');
  }

  // --- Test 2.15: Files Repository ---
  console.log('\n--- Test 2.15: Files Repository ---');
  await page.goto(`${BASE_URL}/files`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await takeSnap(page, 'test_2_15_files_initial');

  // Category filter tabs
  console.log('Testing category tabs in Files...');
  const catTabs = ['Semua', 'Desain', 'Dokumen', 'Kode', 'Lainnya', 'All', 'Design', 'Documents'];
  for (const cat of catTabs) {
    await page.evaluate((text) => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const t = tabs.find(el => el.textContent.includes(text));
      if (t) t.click();
    }, cat);
    await sleep(300);
  }
  await takeSnap(page, 'test_2_15_category_tab_clicked');

  console.log('\n✅ FASE 2 Part C (Tests 2.10, 2.11, 2.12, 2.13, 2.14, 2.15) COMPLETED!\n');
  await browser.close();
})();
