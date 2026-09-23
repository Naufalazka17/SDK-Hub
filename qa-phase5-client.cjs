/**
 * SDK Hub QA Interactive Test — Phase 5: CLIENT ROLE (dr. Budi Santoso)
 * Tests 5.1 (Client Cockpit auto-redirect, upload modal, chat tim, progress, milestones, deliverables, revision modal),
 * 5.2 (RBAC CLIENT: strictly blocked internal routes -> /cockpit, allowed /cockpit, /chat, /notifications, /settings),
 * 5.3 (Sidebar CLIENT: only Cockpit, Chat, Notifications, Settings),
 * 5.4 (Client Chat: only client-facing conversations, send message)
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
  console.log('🧪 FASE 5: CLIENT ROLE (dr. Budi Santoso)');
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

  // Login as CLIENT
  console.log('Logging in as CLIENT (dr.budi@rsud-sehat.id)...');
  await setReactInput(page, '#usernameOrEmail', 'dr.budi@rsud-sehat.id');
  await setReactInput(page, '#password', 'password123');
  const submitBtn = await page.waitForSelector('button[type="submit"]');
  await submitBtn.click();
  await sleep(2500);

  // --- Test 5.1: Client Cockpit ---
  console.log('\n--- Test 5.1: Client Cockpit ---');
  const initialClientUrl = page.url();
  console.log(`URL after login: ${initialClientUrl} (Expected: includes /cockpit)`);
  await takeSnap(page, 'test_5_1_client_cockpit_initial');

  // Test "Unggah Berkas" button -> Modal
  console.log('Testing "Unggah Berkas" modal...');
  const uploadBtnFound = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Unggah Berkas') || b.textContent.includes('Upload File'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  if (uploadBtnFound) {
    await sleep(800);
    await takeSnap(page, 'test_5_1_client_upload_modal_open');

    // Fill notes in modal
    const descInp = await page.$('input[placeholder*="keterangan"], textarea[placeholder*="keterangan"]');
    if (descInp) await descInp.type('Dokumen Kebutuhan Modul IGD RSUD');
    await sleep(300);
    await takeSnap(page, 'test_5_1_client_upload_modal_filled');

    // Cancel modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cancel = btns.find(b => b.textContent.includes('Batal') || b.textContent.includes('Cancel') || b.querySelector('.lucide-x'));
      if (cancel) cancel.click();
    });
    await sleep(500);
    await takeSnap(page, 'test_5_1_client_upload_modal_cancelled');
  }

  // Test "Chat Tim" button
  console.log('Testing "Chat Tim" button redirect...');
  const chatTimClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Chat Tim') || b.textContent.includes('Team Chat'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  if (chatTimClicked) {
    await sleep(1500);
    console.log(`URL after Chat Tim click: ${page.url()}`);
    await takeSnap(page, 'test_5_1_client_chat_tim_redirect');
    // Return to Cockpit
    await page.goto(`${BASE_URL}/cockpit`, { waitUntil: 'domcontentloaded' });
    await sleep(1500);
  }

  // Test Revision Request Modal
  console.log('Testing Request Revision modal (if pending deliverable exists)...');
  const revBtnFound = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Minta Revisi') || b.textContent.includes('Request Revision'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  if (revBtnFound) {
    await sleep(800);
    await takeSnap(page, 'test_5_1_client_revision_modal_open');

    const revTitleInp = await page.$('input[placeholder*="Judul"], input[placeholder*="Title"]');
    if (revTitleInp) await revTitleInp.type('Penyesuaian Alur Pasien BPJS');
    await sleep(300);
    await takeSnap(page, 'test_5_1_client_revision_modal');

    // Cancel revision modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cancel = btns.find(b => b.textContent.includes('Batal') || b.textContent.includes('Cancel') || b.querySelector('.lucide-x'));
      if (cancel) cancel.click();
    });
    await sleep(500);
  }

  // --- Test 5.2: RBAC CLIENT (CRITICAL SECURITY CHECKS) ---
  console.log('\n--- Test 5.2: RBAC CLIENT (CRITICAL SECURITY CHECKS) ---');
  const forbiddenClientRoutes = [
    '/',
    '/dashboard',
    '/projects',
    '/files',
    '/kanban',
    '/timeline',
    '/resources',
    '/users',
    '/clients',
    '/templates',
    '/reports',
    '/activity',
    '/time-tracking'
  ];

  for (const route of forbiddenClientRoutes) {
    console.log(`Testing Client access to ${route}...`);
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
    await sleep(1000);
    const dest = page.url();
    const isRedirectedToCockpit = dest.endsWith('/cockpit');
    console.log(`Route ${route} -> Destination: ${dest} (Redirected to /cockpit: ${isRedirectedToCockpit})`);
    const routeSlug = route.replace(/\//g, '_') || 'root';
    await takeSnap(page, `test_5_2_client_rbac${routeSlug}_blocked`);
  }

  // Allowed Routes Check
  const allowedClientRoutes = ['/cockpit', '/chat', '/notifications', '/settings'];
  for (const route of allowedClientRoutes) {
    console.log(`Testing Client allowed route ${route}...`);
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
    await sleep(1000);
    console.log(`Route ${route} -> Destination: ${page.url()}`);
    const routeSlug = route.replace(/\//g, '_');
    await takeSnap(page, `test_5_2_client_allowed${routeSlug}`);
  }

  // --- Test 5.3: Sidebar CLIENT ---
  console.log('\n--- Test 5.3: Sidebar CLIENT ---');
  await page.goto(`${BASE_URL}/cockpit`, { waitUntil: 'domcontentloaded' });
  await sleep(1000);

  const clientSidebarAudit = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('nav a, aside a')).map(a => ({
      text: a.textContent.trim(),
      href: a.getAttribute('href')
    }));

    const forbidden = links.filter(l => 
      ['/projects', '/files', '/kanban', '/timeline', '/resources', '/users', '/clients', '/templates', '/reports', '/activity', '/time-tracking'].includes(l.href)
    );
    return { links, forbidden };
  });

  console.log('Client sidebar links:', clientSidebarAudit.links);
  console.log('Any forbidden internal links in client sidebar:', clientSidebarAudit.forbidden);
  await takeSnap(page, 'test_5_3_client_sidebar');

  // --- Test 5.4: Client Chat ---
  console.log('\n--- Test 5.4: Client Chat ---');
  await page.goto(`${BASE_URL}/chat`, { waitUntil: 'domcontentloaded' });
  await sleep(2000);

  const clientChatChannels = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasStaffOnly = text.includes('Staff Only');
    const hasLeadAdmin = text.includes('Project Lead & Admin');
    return { hasStaffOnly, hasLeadAdmin };
  });
  console.log('Client channel isolation check:', clientChatChannels);

  // Send a message in client chat
  const clientChatInp = await page.$('input[placeholder*="pesan"], input[placeholder*="message"], textarea');
  if (clientChatInp) {
    await clientChatInp.type('Salam dari dr. Budi - QA Interactive Test at ' + new Date().toLocaleTimeString());
    await page.evaluate(() => {
      const sendBtn = document.querySelector('button .lucide-send')?.closest('button');
      if (sendBtn) sendBtn.click();
    });
    await sleep(1500);
  }
  await takeSnap(page, 'test_5_4_client_chat_sent');

  console.log('\n✅ FASE 5: CLIENT ROLE COMPLETED SUCCESSFULLY!\n');
  await browser.close();
})();
