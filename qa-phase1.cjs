/**
 * SDK Hub QA Interactive Test — Phase 1: Login & Authentication
 * Tests 1.1 & 1.2
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

  const logEvents = [];
  page.on('console', msg => logEvents.push({ type: 'console', text: msg.text() }));
  page.on('pageerror', err => logEvents.push({ type: 'pageerror', text: err.toString() }));

  console.log('\n========================================');
  console.log('🧪 FASE 1: LOGIN & AUTHENTICATION TESTS');
  console.log('========================================\n');

  // Step 1: Open /login
  console.log('--- Test 1.1: Halaman Login ---');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await takeSnap(page, 'test_1_1_login_initial');

  // Step 2: Theme toggle
  console.log('Testing Theme Toggle...');
  const themeBtn = await page.waitForSelector('button[title*="Tema"], button[title*="Theme"]', { timeout: 5000 });
  await themeBtn.click();
  await sleep(800);
  await takeSnap(page, 'test_1_1_theme_toggled');
  // Toggle back or observe
  await themeBtn.click();
  await sleep(800);

  // Step 3: Language toggle
  console.log('Testing Language Toggle (ID/EN)...');
  const langBtn = await page.waitForSelector('button[title*="Bahasa"], button[title*="Language"]', { timeout: 5000 });
  await langBtn.click();
  await sleep(800);
  await takeSnap(page, 'test_1_1_language_en');
  await langBtn.click();
  await sleep(800);
  await takeSnap(page, 'test_1_1_language_id');

  // Step 4: Show/Hide Password
  console.log('Testing Show/Hide Password...');
  const passInput = await page.waitForSelector('#password');
  await passInput.type('secretPassword123');
  const eyeBtn = await page.waitForSelector('button[aria-label*="password visibility"]');
  await eyeBtn.click();
  await sleep(400);
  const typeAfterShow = await page.$eval('#password', el => el.type);
  console.log('Password type after toggle:', typeAfterShow);
  await takeSnap(page, 'test_1_1_password_shown');
  await eyeBtn.click();
  await sleep(400);
  // Clear password
  await page.$eval('#password', el => el.value = '');

  // Step 5: Role Simulator Buttons
  console.log('Testing Role Simulator presets...');
  const roleButtons = await page.$$('button[title*="kredensial"]');
  console.log(`Found ${roleButtons.length} persona buttons.`);
  for (let i = 0; i < roleButtons.length; i++) {
    await roleButtons[i].click();
    await sleep(400);
    const emailVal = await page.$eval('#usernameOrEmail', el => el.value);
    console.log(`Preset ${i + 1} clicked -> email set to: ${emailVal}`);
  }
  await takeSnap(page, 'test_1_1_role_presets_tested');

  // Step 6: Test Login with empty email
  console.log('Testing Login with empty email...');
  await setReactInput(page, '#usernameOrEmail', '');
  await setReactInput(page, '#password', '');
  const submitBtn = await page.waitForSelector('button[type="submit"]');
  await submitBtn.click();
  await sleep(800);
  await takeSnap(page, 'test_1_1_empty_login_validation');

  // Step 7: Test Login with wrong email
  console.log('Testing Login with wrong email...');
  await setReactInput(page, '#usernameOrEmail', 'nonexistent@invalid.com');
  await setReactInput(page, '#password', 'wrongpass123');
  await submitBtn.click();
  await sleep(1200);
  await takeSnap(page, 'test_1_1_wrong_email_toast');

  // Step 8: Test Login with wrong password
  console.log('Testing Login with wrong password for valid user...');
  await setReactInput(page, '#usernameOrEmail', 'arya.admin@subaga.id');
  await setReactInput(page, '#password', 'completelyWrongPass');
  await submitBtn.click();
  await sleep(1200);
  await takeSnap(page, 'test_1_1_wrong_password_toast');

  // Step 9: Forgot Password verification
  const hasForgotPassword = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a, button')).some(el =>
      el.textContent.toLowerCase().includes('forgot') || el.textContent.toLowerCase().includes('lupa')
    );
  });
  console.log('Forgot Password link present:', hasForgotPassword);

  // Step 10: Test 1.2: Login as ADMIN
  console.log('\n--- Test 1.2: Login sebagai ADMIN ---');
  await setReactInput(page, '#usernameOrEmail', 'arya.admin@subaga.id');
  await setReactInput(page, '#password', 'password123');
  await takeSnap(page, 'test_1_2_admin_credentials_typed');
  await submitBtn.click();
  await sleep(3000);

  const adminUrl = page.url();
  console.log('Redirected URL:', adminUrl);
  await takeSnap(page, 'test_1_2_admin_dashboard_loaded');

  // Verify Admin Name and Role in Header
  const headerUserText = await page.evaluate(() => {
    return document.querySelector('header')?.innerText || '';
  });
  console.log('Header text snippet:', headerUserText.replace(/\n/g, ' '));
  const hasArya = headerUserText.includes('Arya') || headerUserText.includes('arya');
  const hasAdminRole = headerUserText.includes('ADMIN') || headerUserText.includes('Admin');
  console.log(`Verification: Name has Arya: ${hasArya}, Role has ADMIN: ${hasAdminRole}`);

  console.log('\n✅ FASE 1 COMPLETED SUCCESSFULLY!\n');
  await browser.close();
})();
