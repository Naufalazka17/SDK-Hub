/**
 * SDK Hub QA Interactive Test — Phase 3: PROJECT_LEAD ROLE
 * Tests 3.1 (Dashboard Project Lead), 3.2 (Sidebar PROJECT_LEAD),
 * 3.3 (RBAC & Shared Admin features: /users blocked, /clients, /templates, /reports, /activity non-admin)
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
  console.log('🧪 FASE 3: PROJECT_LEAD ROLE (Ulba)');
  console.log('===============================================================\n');

  // 1. Go to login page
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await sleep(1000);

  // Clear any existing session
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.removeItem('sdk_current_user_profile');
    localStorage.removeItem('sdk_current_role');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(800);

  // Login as PROJECT_LEAD
  console.log('Logging in as PROJECT_LEAD (ulba.lead@subaga.id)...');
  await setReactInput(page, '#usernameOrEmail', 'ulba.lead@subaga.id');
  await setReactInput(page, '#password', 'password123');
  const submitBtn = await page.waitForSelector('button[type="submit"]');
  await submitBtn.click();
  await sleep(2500);

  // --- Test 3.1: Dashboard Project Lead ---
  console.log('\n--- Test 3.1: Dashboard Project Lead ---');
  await takeSnap(page, 'test_3_1_lead_dashboard_initial');

  // Verify URL is / or /dashboard
  const currentUrl = page.url();
  console.log(`Current URL: ${currentUrl}`);

  // Verify Role Badge and User Name in DOM
  const dashboardInfo = await page.evaluate(() => {
    return {
      bodyText: document.body.innerText.slice(0, 500),
      hasLeadBadge: !!Array.from(document.querySelectorAll('span, div')).find(el => el.textContent.includes('PROJECT LEAD') || el.textContent.includes('PROJECT_LEAD')),
      hasUlbaName: document.body.innerText.includes('Ulba'),
      hasOverdueBanner: !!document.querySelector('.bg-amber-500\\/10, [class*="amber"]'),
    };
  });
  console.log('Dashboard Info:', dashboardInfo);

  // Click Follow-up via Chat if banner exists
  const chatFollowUpClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Tindak Lanjut via Chat') || b.textContent.includes('Follow-up via Chat'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  if (chatFollowUpClicked) {
    console.log('Clicked Follow-up via Chat button -> verifying /chat redirect');
    await sleep(1500);
    await takeSnap(page, 'test_3_1_lead_chat_redirected');
    // Navigate back to dashboard
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await sleep(1500);
  }

  // Click KPI cards in Project Lead Dashboard
  console.log('Clicking Project Lead KPI cards...');
  await page.evaluate(() => {
    const cards = document.querySelectorAll('div[class*="grid-cols"] > div[class*="rounded-xl"]');
    cards.forEach(c => {
      if (c instanceof HTMLElement) c.click();
    });
  });
  await sleep(600);
  await takeSnap(page, 'test_3_1_lead_kpis_clicked');

  // Test "Proyek Binaan Saya" actions
  console.log('Testing "Proyek Binaan Saya" project cards...');
  const projectDetailOpened = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const detailBtn = btns.find(b => b.textContent.trim() === 'Detail' || b.textContent.trim() === 'Details');
    if (detailBtn) {
      detailBtn.click();
      return true;
    }
    return false;
  });

  if (projectDetailOpened) {
    await sleep(1000);
    await takeSnap(page, 'test_3_1_lead_project_detail_modal');
    // Close modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label*="Close"], button .lucide-x')?.closest('button');
      if (closeBtn) closeBtn.click();
    });
    await sleep(600);
  }

  // Verify Pie Chart is rendered
  const hasPieChart = await page.evaluate(() => {
    return !!document.querySelector('.recharts-responsive-container, svg.recharts-surface');
  });
  console.log(`Pie Chart rendered: ${hasPieChart}`);
  await takeSnap(page, 'test_3_1_lead_pie_chart');

  // --- Test 3.2: Sidebar PROJECT_LEAD ---
  console.log('\n--- Test 3.2: Sidebar PROJECT_LEAD ---');
  const sidebarAudit = await page.evaluate(() => {
    const sidebar = document.querySelector('aside, div[class*="bg-[var(--bg-sidebar)]"], nav');
    const links = Array.from(document.querySelectorAll('nav a, aside a')).map(a => ({
      text: a.textContent.trim(),
      href: a.getAttribute('href')
    }));
    const hasUsersLink = links.some(l => l.href === '/users' || l.text.includes('Pengguna') || l.text.includes('Users'));
    return { links, hasUsersLink };
  });

  console.log(`Sidebar has /users link: ${sidebarAudit.hasUsersLink} (Expected: false)`);
  console.log('Total links in Project Lead sidebar:', sidebarAudit.links.length);
  await takeSnap(page, 'test_3_2_lead_sidebar');

  // --- Test 3.3: RBAC & Shared Admin Features ---
  console.log('\n--- Test 3.3: RBAC & Shared Admin Features ---');

  // 1. Direct navigation to /users must be BLOCKED
  console.log('Testing direct navigation to /users (RBAC security)...');
  await page.goto(`${BASE_URL}/users`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  const usersAccessUrl = page.url();
  console.log(`URL after attempting /users: ${usersAccessUrl}`);
  await takeSnap(page, 'test_3_3_lead_users_blocked');

  // 2. Direct navigation to /clients (must be ACCESSIBLE)
  console.log('Testing access to /clients...');
  await page.goto(`${BASE_URL}/clients`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  console.log(`URL on /clients: ${page.url()}`);
  await takeSnap(page, 'test_3_3_lead_clients_accessible');

  // 3. Direct navigation to /templates (must be ACCESSIBLE)
  console.log('Testing access to /templates...');
  await page.goto(`${BASE_URL}/templates`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  console.log(`URL on /templates: ${page.url()}`);
  await takeSnap(page, 'test_3_3_lead_templates_accessible');

  // 4. Direct navigation to /reports (must be ACCESSIBLE)
  console.log('Testing access to /reports...');
  await page.goto(`${BASE_URL}/reports`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  console.log(`URL on /reports: ${page.url()}`);
  await takeSnap(page, 'test_3_3_lead_reports_accessible');

  // 5. Direct navigation to /activity (must be ACCESSIBLE, but Admin logs hidden)
  console.log('Testing access to /activity & non-admin logs verification...');
  await page.goto(`${BASE_URL}/activity`, { waitUntil: 'domcontentloaded' });
  await sleep(2000);
  const activityLogs = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasAdminScope = text.includes('Cakupan: Seluruh Sistem (Penuh)');
    const hasNonAdminScope = text.includes('Cakupan: Tim Non-Admin') || text.includes('Scope: Non-Admin Team');
    return { hasAdminScope, hasNonAdminScope };
  });
  console.log('Activity scope check:', activityLogs);
  await takeSnap(page, 'test_3_3_lead_activity_non_admin');

  console.log('\n✅ FASE 3: PROJECT_LEAD ROLE COMPLETED SUCCESSFULLY!\n');
  await browser.close();
})();
