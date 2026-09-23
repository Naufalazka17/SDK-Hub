/**
 * SDK Hub QA Interactive Test — Phase 7: RESPONSIVE MULTI-VIEWPORT TEST
 * Viewports:
 * Mobile: 360px, 375px, 390px, 414px, 430px
 * Tablet: 768px, 820px, 900px
 * Desktop: 1024px, 1280px, 1440px, 1536px, 1920px
 * Pages: Dashboard, Kanban, Chat, Projects, Settings
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
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  console.log('\n===============================================================');
  console.log('🧪 FASE 7: MULTI-VIEWPORT RESPONSIVE SUITE');
  console.log('===============================================================\n');

  // Authenticate as Admin
  await page.setViewport({ width: 1440, height: 900 });
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

  const viewports = [
    // Mobile
    { label: 'mobile-360', width: 360, height: 800 },
    { label: 'mobile-375', width: 375, height: 667 },
    { label: 'mobile-390', width: 390, height: 844 },
    { label: 'mobile-414', width: 414, height: 896 },
    { label: 'mobile-430', width: 430, height: 932 },
    // Tablet
    { label: 'tablet-768', width: 768, height: 1024 },
    { label: 'tablet-820', width: 820, height: 1180 },
    { label: 'tablet-900', width: 900, height: 1200 },
    // Desktop
    { label: 'desktop-1024', width: 1024, height: 768 },
    { label: 'desktop-1280', width: 1280, height: 800 },
    { label: 'desktop-1440', width: 1440, height: 900 },
    { label: 'desktop-1536', width: 1536, height: 864 },
    { label: 'desktop-1920', width: 1920, height: 1080 },
  ];

  const testPages = [
    { name: 'dashboard', path: '/' },
    { name: 'kanban', path: '/kanban' },
    { name: 'chat', path: '/chat' },
    { name: 'projects', path: '/projects' },
    { name: 'settings', path: '/settings' },
  ];

  for (const vp of viewports) {
    console.log(`\n--- Testing Viewport: ${vp.label} (${vp.width}x${vp.height}) ---`);
    await page.setViewport({ width: vp.width, height: vp.height });

    for (const p of testPages) {
      await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'domcontentloaded' });
      await sleep(1000);

      // Check overflow (except kanban which deliberately scrolls horizontally inside its board)
      const overflowInfo = await page.evaluate((isKanban) => {
        const bodyWidth = document.body.scrollWidth;
        const windowWidth = window.innerWidth;
        const hasMobileMenuBtn = !!document.querySelector('button[aria-label*="menu"], button .lucide-menu');
        return {
          overflow: !isKanban && bodyWidth > windowWidth + 2,
          bodyWidth,
          windowWidth,
          hasMobileMenuBtn
        };
      }, p.name === 'kanban');

      if (overflowInfo.overflow) {
        console.warn(`[OVERFLOW WARN] ${vp.label} on ${p.name}: Body ${overflowInfo.bodyWidth}px > Window ${overflowInfo.windowWidth}px`);
      }

      await takeSnap(page, `test_7_${vp.label}_${p.name}`);
    }

    // Special mobile test on mobile-375: Test Hamburger menu drawer
    if (vp.label === 'mobile-375') {
      console.log('Testing Mobile Drawer opening on mobile-375...');
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await sleep(800);
      const menuOpened = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const menuBtn = btns.find(b => b.querySelector('.lucide-menu') || b.getAttribute('aria-label')?.includes('menu'));
        if (menuBtn) {
          menuBtn.click();
          return true;
        }
        return false;
      });

      if (menuOpened) {
        await sleep(600);
        await takeSnap(page, 'test_7_mobile_drawer_open');
      }
    }
  }

  console.log('\n✅ FASE 7: RESPONSIVE MULTI-VIEWPORT TESTS COMPLETED!\n');
  await browser.close();
})();
