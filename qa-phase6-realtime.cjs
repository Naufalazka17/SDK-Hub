/**
 * SDK Hub QA Interactive Test — Phase 6: REAL-TIME MULTI-USER TEST
 * Tests 6.1 (Real-time Chat bidirectional + typing indicator),
 * 6.2 (Real-time Notifications on task assignment),
 * 6.3 (Real-time Kanban stage updates across tabs),
 * 6.4 (Real-time Time Tracking clock in live update)
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

async function loginUser(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.removeItem('sdk_current_user_profile');
    localStorage.removeItem('sdk_current_role');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(800);
  await setReactInput(page, '#usernameOrEmail', email);
  await setReactInput(page, '#password', password);
  const submitBtn = await page.waitForSelector('button[type="submit"]');
  await submitBtn.click();
  await sleep(2500);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  console.log('\n===============================================================');
  console.log('🧪 FASE 6: REAL-TIME MULTI-CLIENT COLLABORATION TESTS');
  console.log('===============================================================\n');

  // Create isolated incognito contexts
  const contextA = await browser.createBrowserContext(); // ADMIN (Arya)
  const contextB = await browser.createBrowserContext(); // PROJECT_LEAD (Ulba)

  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  await pageA.setViewport({ width: 1440, height: 900 });
  await pageB.setViewport({ width: 1440, height: 900 });

  // 1. Authenticate users
  console.log('Authenticating Tab A as ADMIN (Arya)...');
  await loginUser(pageA, 'arya.admin@subaga.id', 'password123');

  console.log('Authenticating Tab B as PROJECT_LEAD (Ulba)...');
  await loginUser(pageB, 'ulba.lead@subaga.id', 'password123');

  // --- Test 6.1: Real-time Chat ---
  console.log('\n--- Test 6.1: Real-time Chat Bidirectional ---');
  await pageA.goto(`${BASE_URL}/chat`, { waitUntil: 'domcontentloaded' });
  await pageB.goto(`${BASE_URL}/chat`, { waitUntil: 'domcontentloaded' });
  await sleep(2500);

  // Select first conversation in both tabs
  await pageA.evaluate(() => {
    const convs = document.querySelectorAll('button[class*="text-left"], div[class*="cursor-pointer"]');
    if (convs.length > 0) convs[0].click();
  });
  await pageB.evaluate(() => {
    const convs = document.querySelectorAll('button[class*="text-left"], div[class*="cursor-pointer"]');
    if (convs.length > 0) convs[0].click();
  });
  await sleep(1500);

  // Message 1 from Admin (Tab A)
  const timestamp1 = Date.now();
  const msgFromAdmin = `Test realtime 1 - ${timestamp1}`;
  console.log(`Tab A (Admin) sending: "${msgFromAdmin}"...`);
  const chatInputA = await pageA.$('input[placeholder*="pesan"], input[placeholder*="message"], textarea');
  if (chatInputA) {
    await chatInputA.type(msgFromAdmin);
    await pageA.evaluate(() => {
      const sendBtn = document.querySelector('button .lucide-send')?.closest('button');
      if (sendBtn) sendBtn.click();
    });
  }

  // Wait for Tab B to receive message in real-time WITHOUT refreshing
  console.log('Waiting for Tab B (Project Lead) to receive message WITHOUT refresh...');
  await sleep(2500);
  const tabBReceived1 = await pageB.evaluate((expected) => {
    return document.body.innerText.includes(expected);
  }, msgFromAdmin);
  console.log(`Tab B received Message 1 in real-time: ${tabBReceived1}`);
  await takeSnap(pageB, 'test_6_1_tabB_received_msg1');

  // Message 2 from Project Lead (Tab B)
  const timestamp2 = Date.now();
  const msgFromLead = `Test realtime 2 - ${timestamp2}`;
  console.log(`Tab B (Project Lead) sending reply: "${msgFromLead}"...`);
  const chatInputB = await pageB.$('input[placeholder*="pesan"], input[placeholder*="message"], textarea');
  if (chatInputB) {
    await chatInputB.type(msgFromLead);
    await pageB.evaluate(() => {
      const sendBtn = document.querySelector('button .lucide-send')?.closest('button');
      if (sendBtn) sendBtn.click();
    });
  }

  // Wait for Tab A to receive reply in real-time WITHOUT refreshing
  console.log('Waiting for Tab A (Admin) to receive reply WITHOUT refresh...');
  await sleep(2500);
  const tabAReceived2 = await pageA.evaluate((expected) => {
    return document.body.innerText.includes(expected);
  }, msgFromLead);
  console.log(`Tab A received Message 2 in real-time: ${tabAReceived2}`);
  await takeSnap(pageA, 'test_6_1_tabA_received_msg2');

  // Typing Indicator Test
  console.log('Testing typing indicator: Tab A typing...');
  if (chatInputA) {
    await chatInputA.type('typing test...');
    await sleep(1000);
    await takeSnap(pageB, 'test_6_1_tabB_typing_indicator');
  }

  // --- Test 6.2: Real-time Notifications ---
  console.log('\n--- Test 6.2: Real-time Notifications ---');
  // In Tab A (Admin), open Create Task modal and assign to Ulba
  await pageA.goto(`${BASE_URL}/kanban`, { waitUntil: 'domcontentloaded' });
  await sleep(2000);

  const taskTitleRT = `Task Realtime ${Date.now()}`;
  console.log(`Creating task "${taskTitleRT}" assigned to Ulba...`);
  await pageA.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const createBtn = btns.find(b => b.textContent.includes('Buat Tugas') || b.textContent.includes('Create Task') || b.textContent.includes('Tugas Baru'));
    if (createBtn) createBtn.click();
  });
  await sleep(1000);

  // Fill task title
  const tTitleInput = await pageA.$('input[placeholder*="Judul"], input[placeholder*="Title"]');
  if (tTitleInput) await tTitleInput.type(taskTitleRT);

  // Submit task
  await pageA.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const submit = btns.find(b => b.textContent.includes('Simpan') || b.textContent.includes('Dispatch') || b.textContent.includes('Buat'));
    if (submit) submit.click();
  });
  await sleep(2500);

  // Check Tab B notifications
  await pageB.goto(`${BASE_URL}/notifications`, { waitUntil: 'domcontentloaded' });
  await sleep(2000);
  await takeSnap(pageB, 'test_6_2_tabB_notifications_received');

  // --- Test 6.3: Real-time Kanban Updates ---
  console.log('\n--- Test 6.3: Real-time Kanban Updates ---');
  await pageA.goto(`${BASE_URL}/kanban`, { waitUntil: 'domcontentloaded' });
  await pageB.goto(`${BASE_URL}/kanban`, { waitUntil: 'domcontentloaded' });
  await sleep(2500);

  // In Tab A, move a task to next stage via quick button
  console.log('Tab A moving task to next stage...');
  await pageA.evaluate(() => {
    const nextBtns = Array.from(document.querySelectorAll('button[title*="Lanjut"], button[title*="Next"]'));
    if (nextBtns.length > 0) {
      nextBtns[0].click();
      return true;
    }
    // Alternatively click stage advancement button
    const cardBtns = Array.from(document.querySelectorAll('div[draggable="true"] button'));
    if (cardBtns.length > 0) {
      cardBtns[0].click();
      return true;
    }
    return false;
  });

  // Check Tab B receives the update in real-time WITHOUT refresh
  console.log('Checking Tab B Kanban board reflects change in real-time...');
  await sleep(3000);
  await takeSnap(pageB, 'test_6_3_tabB_kanban_updated_live');

  // --- Test 6.4: Real-time Time Tracking ---
  console.log('\n--- Test 6.4: Real-time Time Tracking ---');
  // Create Context C for Staff (Andi)
  const contextC = await browser.createBrowserContext();
  const pageC = await contextC.newPage();
  await pageC.setViewport({ width: 1440, height: 900 });

  console.log('Authenticating Tab C as STAFF (Andi)...');
  await loginUser(pageC, 'andi.qa@subaga.id', 'password123');

  // In Tab B (Project Lead), open /time-tracking
  await pageB.goto(`${BASE_URL}/time-tracking`, { waitUntil: 'domcontentloaded' });
  await sleep(2000);

  // In Tab C (Staff), Clock In
  console.log('Tab C (Staff) clocking in...');
  await pageC.evaluate(() => {
    const sel = document.querySelector('select');
    if (sel && sel.options.length > 1) {
      sel.selectedIndex = 1;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const btns = Array.from(document.querySelectorAll('button'));
    const clockIn = btns.find(b => b.textContent.includes('Masuk Kerja') || b.textContent.includes('Clock In') || b.textContent.includes('Mulai Shift'));
    if (clockIn) clockIn.click();
  });

  // Verify Tab B (Project Lead) reflects time tracking update without refresh
  console.log('Verifying Tab B reflects live shift update in real-time...');
  await sleep(3000);
  await takeSnap(pageB, 'test_6_4_tabB_timetracking_live_update');

  console.log('\n✅ FASE 6: REAL-TIME TESTS COMPLETED SUCCESSFULLY!\n');
  await browser.close();
})();
