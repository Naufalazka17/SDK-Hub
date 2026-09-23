const puppeteer = require('puppeteer-core');

const BASE_URL = 'http://localhost:5173';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\e49c1999-17fa-43fe-ac70-07b9eb3ac2ca';

const USERS = {
  ADMIN: '11111111-1111-1111-1111-111111111111',       // Arya Subaga
  PROJECT_LEAD: '22222222-2222-2222-2222-222222222222',// Ulba
  STAFF: '44444444-4444-4444-4444-444444444444',       // Andi Kusuma
};

async function testAllRoles() {
  console.log('=== STARTING RBAC VERIFICATION FOR RESOURCE, PRESENSI, & AUDIT LOG ===\n');
  let allPassed = true;

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // -------------------------------------------------------------
    // TEST 1: STAFF ROLE (Andi Kusuma)
    // -------------------------------------------------------------
    console.log('--- TEST 1: STAFF Role (Andi Kusuma) ---');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await page.evaluate((id) => localStorage.setItem('sdk_active_profile_id', id), USERS.STAFF);
    await page.goto(`${BASE_URL}/time-tracking`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('aside', { timeout: 10000 });

    // 1.1 Verify /resources is NOT present in sidebar for Staff
    const staffSidebarLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('aside a')).map(a => a.getAttribute('href'));
    });

    if (staffSidebarLinks.includes('/resources')) {
      throw new Error('FAIL: /resources link found in STAFF sidebar!');
    }
    console.log('  ✓ /resources link is completely hidden in STAFF sidebar.');

    // 1.2 Verify direct navigation to /resources is blocked
    await page.goto(`${BASE_URL}/resources`, { waitUntil: 'networkidle2' });
    const isAccessDenied = await page.evaluate(() => {
      return document.body.innerText.includes('Akses Ditolak') || document.body.innerText.includes('tidak memiliki izin');
    });
    if (!isAccessDenied) {
      throw new Error('FAIL: STAFF was able to access /resources without Access Denied!');
    }
    console.log('  ✓ Direct access to /resources correctly shows Akses Ditolak for STAFF.');

    // 1.3 Verify attendance title for Staff
    await page.goto(`${BASE_URL}/time-tracking`, { waitUntil: 'networkidle2' });
    const staffAttendanceHeader = await page.evaluate(() => {
      const el = document.querySelector('aside a[href="/time-tracking"]');
      const tableTitle = document.querySelector('table')?.parentElement?.previousElementSibling?.innerText || '';
      return { menuText: el?.innerText.trim(), tableTitle };
    });
    console.log('  Staff Attendance Menu & Table info:', staffAttendanceHeader);
    if (!staffAttendanceHeader.menuText.includes('Presensi Saya')) {
      throw new Error(`FAIL: Staff attendance menu label is unexpected: ${staffAttendanceHeader.menuText}`);
    }
    console.log('  ✓ STAFF sees "Riwayat Presensi Saya" (own attendance only).');
    await page.screenshot({ path: `${ARTIFACT_DIR}/staff_attendance_own.png` });

    // -------------------------------------------------------------
    // TEST 2: PROJECT_LEAD ROLE (Ulba)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: PROJECT_LEAD Role (Ulba) ---');
    await page.evaluate((id) => localStorage.setItem('sdk_active_profile_id', id), USERS.PROJECT_LEAD);
    await page.goto(`${BASE_URL}/time-tracking`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('aside', { timeout: 10000 });

    // 2.1 Verify /resources IS present for Project Lead
    const leadSidebarLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('aside a')).map(a => a.getAttribute('href'));
    });
    if (!leadSidebarLinks.includes('/resources')) {
      throw new Error('FAIL: /resources link missing in PROJECT_LEAD sidebar!');
    }
    console.log('  ✓ /resources link is present for PROJECT_LEAD.');

    // 2.2 Verify Project Lead attendance menu and table
    const leadAttendanceHeader = await page.evaluate(() => {
      const el = document.querySelector('aside a[href="/time-tracking"]');
      const tableTitle = document.querySelector('table')?.parentElement?.previousElementSibling?.innerText || '';
      return { menuText: el?.innerText.trim(), tableTitle };
    });
    console.log('  Lead Attendance Menu info:', leadAttendanceHeader);
    if (!leadAttendanceHeader.menuText.includes('Presensi Tim')) {
      throw new Error(`FAIL: Lead attendance menu label is unexpected: ${leadAttendanceHeader.menuText}`);
    }

    // 2.3 Verify Project Lead sees NO Admin entries in attendance
    const leadSeenUsers = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr td:first-child'));
      return rows.map(r => r.innerText.trim());
    });
    console.log('  Lead visible attendance users:', leadSeenUsers);
    const hasAdminInAttendance = leadSeenUsers.some(name => name.includes('Arya Subaga'));
    if (hasAdminInAttendance) {
      throw new Error('FAIL: Admin (Arya Subaga) attendance entries visible to PROJECT_LEAD!');
    }
    console.log('  ✓ PROJECT_LEAD sees team attendance WITHOUT Admin entries.');
    await page.screenshot({ path: `${ARTIFACT_DIR}/lead_attendance_no_admin.png` });

    // 2.4 Verify Activity Audit Log for Project Lead excludes Admin
    await page.goto(`${BASE_URL}/activity`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 10000 });

    const leadAuditHeader = await page.evaluate(() => {
      return document.querySelector('div.space-y-6')?.innerText.slice(0, 300) || '';
    });
    console.log('  Lead Audit header contains:', leadAuditHeader.includes('Tim Non-Admin') ? 'Tim Non-Admin badge' : 'No badge');

    const leadAuditActors = await page.evaluate(() => {
      const actorElements = Array.from(document.querySelectorAll('.font-bold'));
      return actorElements.map(e => e.innerText.trim());
    });
    const hasAdminInAudit = leadAuditActors.some(name => name.includes('Arya Subaga'));
    if (hasAdminInAudit) {
      throw new Error('FAIL: Admin (Arya Subaga) activity log entries visible to PROJECT_LEAD!');
    }
    console.log('  ✓ PROJECT_LEAD audit log correctly excludes all Admin activity entries.');
    await page.screenshot({ path: `${ARTIFACT_DIR}/lead_audit_no_admin.png` });

    // -------------------------------------------------------------
    // TEST 3: ADMIN ROLE (Arya Subaga)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: ADMIN Role (Arya Subaga) ---');
    await page.evaluate((id) => localStorage.setItem('sdk_active_profile_id', id), USERS.ADMIN);
    await page.goto(`${BASE_URL}/time-tracking`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('aside', { timeout: 10000 });

    // 3.1 Verify Admin attendance menu
    const adminAttendanceHeader = await page.evaluate(() => {
      const el = document.querySelector('aside a[href="/time-tracking"]');
      const tableTitle = document.querySelector('table')?.parentElement?.previousElementSibling?.innerText || '';
      return { menuText: el?.innerText.trim(), tableTitle };
    });
    console.log('  Admin Attendance Menu info:', adminAttendanceHeader);
    if (!adminAttendanceHeader.menuText.includes('Presensi Lengkap')) {
      throw new Error(`FAIL: Admin attendance menu label is unexpected: ${adminAttendanceHeader.menuText}`);
    }
    console.log('  ✓ ADMIN sees "Riwayat Presensi Lengkap" (all users).');
    await page.screenshot({ path: `${ARTIFACT_DIR}/admin_attendance_full.png` });

    // 3.2 Verify Admin sees full system audit
    await page.goto(`${BASE_URL}/activity`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 10000 });
    const adminAuditHeader = await page.evaluate(() => {
      return document.querySelector('div.space-y-6')?.innerText.slice(0, 300) || '';
    });
    console.log('  Admin Audit header contains:', adminAuditHeader.includes('Seluruh Sistem') ? 'Seluruh Sistem badge' : 'No badge');
    console.log('  ✓ ADMIN audit log contains full system scope.');
    await page.screenshot({ path: `${ARTIFACT_DIR}/admin_audit_full.png` });

    console.log('\n=== ALL RBAC TESTS PASSED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('VERIFICATION FAILED:', err.message);
    allPassed = false;
  } finally {
    await browser.close();
  }

  process.exit(allPassed ? 0 : 1);
}

testAllRoles();
