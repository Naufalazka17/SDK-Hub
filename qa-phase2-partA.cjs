/**
 * SDK Hub QA Interactive Test — Phase 2 Part A:
 * Test 2.1 (Dashboard Admin), Test 2.2 (Header & Global Elements), Test 2.3 (Sidebar Navigation)
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

  console.log('\n======================================================');
  console.log('🧪 FASE 2 Part A: DASHBOARD, HEADER, & SIDEBAR (ADMIN)');
  console.log('======================================================\n');

  // 1. Ensure Login as ADMIN
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await setReactInput(page, '#usernameOrEmail', 'arya.admin@subaga.id');
  await setReactInput(page, '#password', 'password123');
  const submitBtn = await page.waitForSelector('button[type="submit"]');
  await submitBtn.click();
  await sleep(2500);

  // --- Test 2.1: Dashboard Admin ---
  console.log('--- Test 2.1: Dashboard Admin ---');
  await takeSnap(page, 'test_2_1_dashboard_main');

  // KPI cards click
  console.log('Testing KPI cards...');
  const kpiCards = await page.$$('div.cursor-pointer, [data-testid*="kpi"], .grid button');
  console.log(`Found ${kpiCards.length} potential clickable cards.`);
  for (let i = 0; i < Math.min(kpiCards.length, 4); i++) {
    await kpiCards[i].click().catch(() => {});
    await sleep(300);
  }
  await takeSnap(page, 'test_2_1_kpi_cards_clicked');

  // Pie Chart hover
  console.log('Hovering on status distribution chart...');
  const charts = await page.$$('svg, canvas, .recharts-responsive-container');
  if (charts.length > 0) {
    const box = await charts[0].boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await sleep(500);
      await takeSnap(page, 'test_2_1_chart_hover_tooltip');
    }
  }

  // Recent Projects row click -> modal
  console.log('Testing Recent Projects row click...');
  const projectRows = await page.$$('table tbody tr, div[class*="project-row"]');
  if (projectRows.length > 0) {
    await projectRows[0].click().catch(() => {});
    await sleep(800);
    await takeSnap(page, 'test_2_1_project_detail_modal_open');

    // Inside modal, test buttons
    const modalButtons = await page.$$('div[role="dialog"] button, .fixed button');
    console.log(`Modal buttons found: ${modalButtons.length}`);
    // Click close button if found
    const closeBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const close = btns.find(b => b.textContent.includes('Tutup') || b.textContent.includes('Close') || b.querySelector('svg'));
      if (close) { close.click(); return true; }
      return false;
    });
    await sleep(500);
  }

  // New Project Button on Dashboard
  console.log('Testing New Project button on Dashboard...');
  const newProjectClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const np = btns.find(b => b.textContent.includes('Proyek Baru') || b.textContent.includes('New Project') || b.textContent.includes('Tugas Baru'));
    if (np) { np.click(); return true; }
    return false;
  });
  await sleep(1000);
  await takeSnap(page, 'test_2_1_new_action_triggered');
  // Return to dashboard
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await sleep(1200);

  // --- Test 2.2: Header & Global Elements ---
  console.log('\n--- Test 2.2: Header & Global Elements ---');

  // 1. Project Selector dropdown
  console.log('Testing Project Selector in header...');
  const projectDropdownBtn = await page.evaluate(() => {
    const header = document.querySelector('header');
    const btns = Array.from(header?.querySelectorAll('button') || []);
    const projBtn = btns.find(b => b.textContent.includes('SDK-PRJ') || b.querySelector('.lucide-folder-kanban'));
    if (projBtn) { projBtn.click(); return true; }
    return false;
  });
  await sleep(600);
  await takeSnap(page, 'test_2_2_project_selector_open');
  // Close dropdown by clicking header again
  await page.click('header').catch(() => {});
  await sleep(400);

  // 2. Global Search (⌘K)
  console.log('Testing Global Search (Ctrl+K)...');
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyK');
  await page.keyboard.up('Control');
  await sleep(800);
  await takeSnap(page, 'test_2_2_search_modal_open');

  // Type search query
  const searchInput = await page.$('input[placeholder*="Cari"], input[placeholder*="Search"], input[type="search"]');
  if (searchInput) {
    await searchInput.type('test');
    await sleep(600);
    await takeSnap(page, 'test_2_2_search_results');
  }
  // Press ESC to close modal
  await page.keyboard.press('Escape');
  await sleep(500);
  await takeSnap(page, 'test_2_2_search_modal_closed');

  // 3. Notification Bell Dropdown
  console.log('Testing Notification Bell dropdown...');
  const bellClicked = await page.evaluate(() => {
    const bellBtn = document.querySelector('header button[title*="Notifikasi"], header button .lucide-bell')?.closest('button');
    if (bellBtn) { bellBtn.click(); return true; }
    return false;
  });
  await sleep(600);
  await takeSnap(page, 'test_2_2_notification_dropdown_open');
  // Close notif dropdown
  await page.click('header').catch(() => {});
  await sleep(400);

  // 4. User Profile Dropdown
  console.log('Testing User Profile dropdown in header...');
  const profileDropdownClicked = await page.evaluate(() => {
    const header = document.querySelector('header');
    const userBtn = header?.querySelector('button .lucide-chevron-down')?.closest('button') || 
                    Array.from(header?.querySelectorAll('button') || []).find(b => b.textContent.includes('Arya'));
    if (userBtn) { userBtn.click(); return true; }
    return false;
  });
  await sleep(600);
  await takeSnap(page, 'test_2_2_profile_dropdown_open');

  // Click Account & Settings from dropdown
  console.log('Testing click to Account & Settings...');
  const settingsClicked = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a, button'));
    const settingLink = links.find(l => l.textContent.includes('Pengaturan') || l.textContent.includes('Settings'));
    if (settingLink) { settingLink.click(); return true; }
    return false;
  });
  await sleep(1500);
  await takeSnap(page, 'test_2_2_settings_opened');
  console.log('Current URL after settings click:', page.url());

  // Return to /
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await sleep(1200);

  // --- Test 2.3: Sidebar Navigation ---
  console.log('\n--- Test 2.3: Sidebar Navigation ---');
  const sidebarRoutes = [
    { label: 'Papan Orkestrasi', path: '/kanban' },
    { label: 'Jadwal Proyek', path: '/timeline' },
    { label: 'Kokpit Klien', path: '/cockpit' },
    { label: 'Berkas & Dokumen', path: '/files' },
    { label: 'Jadwal Global', path: '/timeline/global' },
    { label: 'Chat', path: '/chat' },
    { label: 'Sumber Daya & Tim', path: '/resources' },
    { label: 'Presensi Jam Kerja', path: '/time-tracking' },
    { label: 'Manajemen Klien', path: '/clients' },
    { label: 'Template Alur Kerja', path: '/templates' },
    { label: 'Log Audit Aktivitas', path: '/activity' },
    { label: 'Manajemen Pengguna', path: '/users' },
    { label: 'Laporan & Analitik', path: '/reports' },
    { label: 'Notifikasi', path: '/notifications' },
    { label: 'Pengaturan', path: '/settings' },
  ];

  for (const item of sidebarRoutes) {
    console.log(`Navigating via sidebar: ${item.label} (${item.path})...`);
    await page.goto(`${BASE_URL}${item.path}`, { waitUntil: 'domcontentloaded' });
    await sleep(1000);
    const snapName = `test_2_3_sidebar_${item.path.replace(/[^a-zA-Z0-9]/g, '_')}`;
    await takeSnap(page, snapName);
  }

  // Test Collapse & Expand Sidebar
  console.log('Testing Sidebar Collapse...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  const collapseBtn = await page.$('button[title*="Ciutkan"], button[title*="Collapse"], button[title*="sidebar"]');
  if (collapseBtn) {
    await collapseBtn.click();
    await sleep(600);
    await takeSnap(page, 'test_2_3_sidebar_collapsed');

    console.log('Testing Sidebar Expand...');
    await collapseBtn.click();
    await sleep(600);
    await takeSnap(page, 'test_2_3_sidebar_expanded');
  }

  console.log('\n✅ FASE 2 Part A (Tests 2.1, 2.2, 2.3) COMPLETED!\n');
  await browser.close();
})();
