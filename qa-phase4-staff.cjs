/**
 * SDK Hub QA Interactive Test — Phase 4: STAFF ROLE
 * Tests 4.1 (Dashboard Staff: Clock In/Out, Task Filter, Task Stage Change),
 * 4.2 (Sidebar STAFF menu filtering),
 * 4.3 (RBAC STAFF: blocked /users, /clients, /templates, /reports, /activity, /resources, /cockpit),
 * 4.4 (Allowed features: Dashboard, Projects, Kanban, Timeline, Files, Chat, Time Tracking, Notifs, Settings)
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
  console.log('🧪 FASE 4: STAFF ROLE (Andi Kusuma)');
  console.log('===============================================================\n');

  // 1. Go to login page & clear storage
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.removeItem('sdk_current_user_profile');
    localStorage.removeItem('sdk_current_role');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(800);

  // Login as STAFF
  console.log('Logging in as STAFF (andi.qa@subaga.id)...');
  await setReactInput(page, '#usernameOrEmail', 'andi.qa@subaga.id');
  await setReactInput(page, '#password', 'password123');
  const submitBtn = await page.waitForSelector('button[type="submit"]');
  await submitBtn.click();
  await sleep(2500);

  // --- Test 4.1: Dashboard Staff ---
  console.log('\n--- Test 4.1: Dashboard Staff ---');
  await takeSnap(page, 'test_4_1_staff_dashboard_initial');

  const staffDashInfo = await page.evaluate(() => {
    return {
      title: document.querySelector('h1')?.textContent.trim(),
      hasStaffBadge: !!Array.from(document.querySelectorAll('span, div')).find(el => el.textContent.includes('STAF') || el.textContent.includes('STAFF')),
      hasAndiName: document.body.innerText.includes('Andi'),
      hasClockInCard: !!document.querySelector('button .lucide-play, button .lucide-square')?.closest('div'),
    };
  });
  console.log('Staff Dashboard Info:', staffDashInfo);

  // Test Clock In
  console.log('Testing Staff Clock In...');
  const clockInTriggered = await page.evaluate(() => {
    const sel = document.querySelector('select');
    if (sel && sel.options.length > 1) {
      sel.selectedIndex = 1;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const btns = Array.from(document.querySelectorAll('button'));
    const clockInBtn = btns.find(b => b.textContent.includes('Masuk Kerja') || b.textContent.includes('Clock In'));
    if (clockInBtn) {
      clockInBtn.click();
      return true;
    }
    return false;
  });

  if (clockInTriggered) {
    await sleep(2000);
    await takeSnap(page, 'test_4_1_staff_clocked_in');

    // Test Clock Out
    console.log('Testing Staff Clock Out...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const clockOutBtn = btns.find(b => b.textContent.includes('Keluar Kerja') || b.textContent.includes('Clock Out'));
      if (clockOutBtn) clockOutBtn.click();
    });
    await sleep(2000);
    await takeSnap(page, 'test_4_1_staff_clocked_out');
  }

  // Test Staff Task Filters (All / In Progress / Done)
  console.log('Testing Staff Task Filters...');
  const taskFilters = ['Semua', 'Sedang Berjalan', 'Selesai', 'All', 'In Progress', 'Done'];
  for (const filter of taskFilters) {
    await page.evaluate((fText) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.trim() === fText);
      if (btn) btn.click();
    }, filter);
    await sleep(300);
  }
  await takeSnap(page, 'test_4_1_staff_task_filters');

  // Test Quick Task Stage action (Mulai Kerja / Selesai)
  console.log('Testing Staff quick task stage toggle...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const stageBtn = btns.find(b => b.textContent.includes('Mulai Kerja') || b.textContent.includes('Selesai'));
    if (stageBtn) stageBtn.click();
  });
  await sleep(1200);
  await takeSnap(page, 'test_4_1_staff_task_moved');

  // --- Test 4.2: Sidebar STAFF ---
  console.log('\n--- Test 4.2: Sidebar STAFF ---');
  const staffSidebarLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('nav a, aside a')).map(a => ({
      text: a.textContent.trim(),
      href: a.getAttribute('href')
    }));

    const forbiddenRoutes = ['/users', '/clients', '/templates', '/reports', '/activity', '/resources', '/cockpit'];
    const foundForbidden = links.filter(l => forbiddenRoutes.some(r => l.href === r));
    return { links, foundForbidden };
  });

  console.log('Total links in Staff sidebar:', staffSidebarLinks.links.length);
  console.log('Forbidden links found in Staff sidebar:', staffSidebarLinks.foundForbidden);
  await takeSnap(page, 'test_4_2_staff_sidebar');

  // --- Test 4.3: RBAC STAFF (Direct URL Navigation Tests) ---
  console.log('\n--- Test 4.3: RBAC STAFF (Direct URL Navigation Security) ---');
  const routesToTest = [
    { route: '/users', name: 'users' },
    { route: '/clients', name: 'clients' },
    { route: '/templates', name: 'templates' },
    { route: '/reports', name: 'reports' },
    { route: '/activity', name: 'activity' },
    { route: '/resources', name: 'resources' },
    { route: '/cockpit', name: 'cockpit' },
  ];

  for (const item of routesToTest) {
    console.log(`Testing forbidden route: ${item.route}...`);
    await page.goto(`${BASE_URL}${item.route}`, { waitUntil: 'domcontentloaded' });
    await sleep(1200);
    const destinationUrl = page.url();
    console.log(`Attempt ${item.route} -> Resulted in: ${destinationUrl}`);
    await takeSnap(page, `test_4_3_staff_${item.name}_blocked`);
  }

  // --- Test 4.4: Fitur STAFF yang Diizinkan ---
  console.log('\n--- Test 4.4: Fitur STAFF yang Diizinkan ---');

  // 1. Dashboard
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await takeSnap(page, 'test_4_4_staff_dashboard');

  // 2. Projects Directory
  await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await takeSnap(page, 'test_4_4_staff_projects');

  // 3. Kanban Board
  await page.goto(`${BASE_URL}/kanban`, { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await takeSnap(page, 'test_4_4_staff_kanban');

  // 4. Timeline
  await page.goto(`${BASE_URL}/timeline`, { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await takeSnap(page, 'test_4_4_staff_timeline');

  // 5. Files
  await page.goto(`${BASE_URL}/files`, { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await takeSnap(page, 'test_4_4_staff_files');

  // 6. Chat
  await page.goto(`${BASE_URL}/chat`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  // Send a test message as Andi
  const staffChatInp = await page.$('input[placeholder*="pesan"], input[placeholder*="message"], textarea');
  if (staffChatInp) {
    await staffChatInp.type('Staff QA status check message at ' + new Date().toLocaleTimeString());
    await page.evaluate(() => {
      const sendBtn = document.querySelector('button .lucide-send')?.closest('button');
      if (sendBtn) sendBtn.click();
    });
    await sleep(1200);
  }
  await takeSnap(page, 'test_4_4_staff_chat');

  // 7. Time Tracking (Only own records visible)
  await page.goto(`${BASE_URL}/time-tracking`, { waitUntil: 'domcontentloaded' });
  await sleep(1200);
  await takeSnap(page, 'test_4_4_staff_timetracking');

  // 8. Notifications
  await page.goto(`${BASE_URL}/notifications`, { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await takeSnap(page, 'test_4_4_staff_notifications');

  // 9. Settings
  await page.goto(`${BASE_URL}/settings`, { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await takeSnap(page, 'test_4_4_staff_settings');

  console.log('\n✅ FASE 4: STAFF ROLE COMPLETED SUCCESSFULLY!\n');
  await browser.close();
})();
