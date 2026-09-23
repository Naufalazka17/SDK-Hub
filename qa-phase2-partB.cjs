/**
 * SDK Hub QA Interactive Test — Phase 2 Part B:
 * Tests 2.4 (Projects Directory), 2.5 (Create Project), 2.6 (Project Detail),
 * 2.7 (Orchestration Board / Kanban), 2.8 (Timeline Gantt), 2.9 (Global Timeline)
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
  console.log('🧪 FASE 2 Part B: PROJECTS, KANBAN, TIMELINES (ADMIN)');
  console.log('===============================================================\n');

  // Login as ADMIN
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await sleep(800);
  await setReactInput(page, '#usernameOrEmail', 'arya.admin@subaga.id');
  await setReactInput(page, '#password', 'password123');
  const submitBtn = await page.waitForSelector('button[type="submit"]');
  await submitBtn.click();
  await sleep(2500);

  // --- Test 2.4: Projects Directory ---
  console.log('--- Test 2.4: Projects Directory ---');
  await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await takeSnap(page, 'test_2_4_projects_directory_initial');

  // Search filter
  console.log('Testing Projects search filter...');
  const searchInput = await page.$('input[placeholder*="Cari"], input[placeholder*="Search"]');
  if (searchInput) {
    await searchInput.type('SDK');
    await sleep(600);
    await takeSnap(page, 'test_2_4_search_filtered');
    await page.evaluate(() => {
      const el = document.querySelector('input[placeholder*="Cari"], input[placeholder*="Search"]');
      if (el) el.value = '';
    });
  }

  // Filter dropdowns
  console.log('Testing status and client dropdowns...');
  const selects = await page.$$('select');
  for (let i = 0; i < selects.length; i++) {
    const options = await selects[i].$$('option');
    if (options.length > 1) {
      const val = await page.evaluate(el => el.value, options[1]);
      await selects[i].select(val);
      await sleep(400);
    }
  }
  await takeSnap(page, 'test_2_4_filters_selected');

  // Test Delete modal & Cancel
  console.log('Testing Delete button & confirmation modal...');
  const deleteClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const del = btns.find(b => b.title?.includes('Hapus') || b.querySelector('.lucide-trash2, .lucide-trash'));
    if (del) {
      del.scrollIntoView({ block: 'center' });
      del.click();
      return true;
    }
    return false;
  });
  if (deleteClicked) {
    await sleep(600);
    await takeSnap(page, 'test_2_4_delete_modal_open');
    // Click Cancel
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cancel = btns.find(b => b.textContent.includes('Batal') || b.textContent.includes('Cancel'));
      if (cancel) cancel.click();
    });
    await sleep(500);
    await takeSnap(page, 'test_2_4_delete_modal_cancelled');
  }

  // --- Test 2.5: Create Project (Project Canvas) ---
  console.log('\n--- Test 2.5: Create Project ---');
  await page.goto(`${BASE_URL}/projects/new`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await takeSnap(page, 'test_2_5_create_project_initial');

  // Fill Project Name
  const projNameInput = await page.$('input[name="title"], input[placeholder*="proyek"], input[placeholder*="Project"]');
  if (projNameInput) {
    await projNameInput.type('Test Project QA Interactive');
  }

  // Select Client
  console.log('Selecting Client...');
  const clientSelect = await page.$('select[name="client_id"], select');
  if (clientSelect) {
    const opts = await clientSelect.$$('option');
    if (opts.length > 1) {
      const val = await page.evaluate(el => el.value, opts[1]);
      await clientSelect.select(val);
    }
  }

  // Select Delivery Model & Template
  console.log('Selecting Delivery Model & Template...');
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Custom') || text.includes('Healthcare') || text.includes('Kustom')) {
      await btn.click().catch(() => {});
      await sleep(200);
    }
  }
  await takeSnap(page, 'test_2_5_form_filled');

  // Submit form
  console.log('Submitting Project form...');
  const createProjBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const save = btns.find(b => b.textContent.includes('Buat Proyek') || b.textContent.includes('Simpan') || b.textContent.includes('Create Project'));
    if (save) { save.click(); return true; }
    return false;
  });
  await sleep(2500);
  await takeSnap(page, 'test_2_5_project_created_redirect');

  // --- Test 2.6: Project Detail ---
  console.log('\n--- Test 2.6: Project Detail ---');
  await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  // Click first project card or row
  const firstProjLink = await page.$('a[href*="/projects/"], tr[class*="cursor-pointer"]');
  if (firstProjLink) {
    await firstProjLink.click();
    await sleep(2000);
  } else {
    // Navigate directly to first project
    await page.goto(`${BASE_URL}/projects/SDK-PRJ-2026-001`, { waitUntil: 'domcontentloaded' });
    await sleep(1500);
  }
  await takeSnap(page, 'test_2_6_project_detail_overview');

  // Test tabs in project detail
  const projTabs = ['Orkestrasi', 'Jadwal', 'Berkas', 'Kokpit', 'Board', 'Timeline', 'Files', 'Cockpit'];
  for (const tabText of projTabs) {
    const clicked = await page.evaluate((text) => {
      const tabs = Array.from(document.querySelectorAll('button, a'));
      const t = tabs.find(el => el.textContent.includes(text));
      if (t) { t.click(); return true; }
      return false;
    }, tabText);
    if (clicked) {
      await sleep(1000);
      await takeSnap(page, `test_2_6_tab_${tabText.toLowerCase()}`);
    }
  }

  // --- Test 2.7: Orchestration Board (Kanban) ---
  console.log('\n--- Test 2.7: Orchestration Board (Kanban) ---');
  await page.goto(`${BASE_URL}/kanban`, { waitUntil: 'domcontentloaded' });
  await sleep(2000);
  await takeSnap(page, 'test_2_7_kanban_board');

  // Horizontal scroll test
  console.log('Testing Kanban horizontal scroll...');
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('.overflow-x-auto, [class*="overflow-x"]');
    if (scrollContainer) scrollContainer.scrollLeft = 800;
  });
  await sleep(500);
  await takeSnap(page, 'test_2_7_kanban_scrolled_right');
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('.overflow-x-auto, [class*="overflow-x"]');
    if (scrollContainer) scrollContainer.scrollLeft = 0;
  });

  // Priority filter test
  console.log('Testing Kanban Priority filter...');
  const prioSelect = await page.$('select');
  if (prioSelect) {
    const opts = await prioSelect.$$('option');
    if (opts.length > 1) {
      const val = await page.evaluate(el => el.value, opts[1]);
      await prioSelect.select(val);
      await sleep(500);
      await takeSnap(page, 'test_2_7_priority_filtered');
    }
  }

  // Test Create Task Modal
  console.log('Testing Create Task modal on Kanban...');
  const createTaskBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(el => el.textContent.includes('Tambah Tugas') || el.textContent.includes('Tugas Baru') || el.textContent.includes('Create Task'));
    if (b) { b.click(); return true; }
    return false;
  });
  await sleep(1000);
  await takeSnap(page, 'test_2_7_create_task_modal_open');

  // Fill Task Form
  const taskTitleInput = await page.$('input[placeholder*="Judul"], input[placeholder*="Title"], input[name="title"]');
  if (taskTitleInput) {
    await taskTitleInput.type('QA Interactive Verification Task');
    await sleep(300);
  }
  // Check Blocked checkbox if present
  const blockedCheckbox = await page.$('input[type="checkbox"]');
  if (blockedCheckbox) {
    await blockedCheckbox.click();
    await sleep(300);
    await takeSnap(page, 'test_2_7_task_blocked_checked');
  }

  // Cancel modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cancel = btns.find(b => b.textContent.includes('Batal') || b.textContent.includes('Cancel'));
    if (cancel) cancel.click();
  });
  await sleep(600);
  await takeSnap(page, 'test_2_7_create_task_modal_closed');

  // View Switcher (Kanban / Table)
  console.log('Testing View Switcher (Kanban / Table)...');
  const viewSwitchClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const tableBtn = btns.find(b => b.textContent.includes('Tabel') || b.textContent.includes('Table') || b.querySelector('.lucide-table'));
    if (tableBtn) { tableBtn.click(); return true; }
    return false;
  });
  if (viewSwitchClicked) {
    await sleep(1000);
    await takeSnap(page, 'test_2_7_kanban_table_view');
  }

  // --- Test 2.8: Timeline Gantt ---
  console.log('\n--- Test 2.8: Timeline Gantt ---');
  await page.goto(`${BASE_URL}/timeline`, { waitUntil: 'domcontentloaded' });
  await sleep(2000);
  await takeSnap(page, 'test_2_8_timeline_gantt_initial');

  // Test Period Navigation
  console.log('Testing Timeline Prev / Next period...');
  await page.evaluate(() => {
    const navBtns = document.querySelectorAll('button');
    for (const b of navBtns) {
      if (b.querySelector('.lucide-chevron-left')) b.click();
    }
  });
  await sleep(600);
  await takeSnap(page, 'test_2_8_period_prev');

  await page.evaluate(() => {
    const navBtns = document.querySelectorAll('button');
    for (const b of navBtns) {
      if (b.querySelector('.lucide-chevron-right')) b.click();
    }
  });
  await sleep(600);
  await takeSnap(page, 'test_2_8_period_next');

  // Click Today
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const today = btns.find(b => b.textContent.includes('Hari Ini') || b.textContent.includes('Today'));
    if (today) today.click();
  });
  await sleep(600);
  await takeSnap(page, 'test_2_8_period_today');

  // --- Test 2.9: Global Timeline ---
  console.log('\n--- Test 2.9: Global Timeline ---');
  await page.goto(`${BASE_URL}/timeline/global`, { waitUntil: 'domcontentloaded' });
  await sleep(2000);
  await takeSnap(page, 'test_2_9_global_timeline_initial');

  // Prev / Next Year
  await page.evaluate(() => {
    const navBtns = document.querySelectorAll('button');
    for (const b of navBtns) {
      if (b.querySelector('.lucide-chevron-left')) b.click();
    }
  });
  await sleep(600);
  await takeSnap(page, 'test_2_9_prev_year');

  await page.evaluate(() => {
    const navBtns = document.querySelectorAll('button');
    for (const b of navBtns) {
      if (b.querySelector('.lucide-chevron-right')) b.click();
    }
  });
  await sleep(600);
  await takeSnap(page, 'test_2_9_next_year');

  console.log('\n✅ FASE 2 Part B (Tests 2.4, 2.5, 2.6, 2.7, 2.8, 2.9) COMPLETED!\n');
  await browser.close();
})();
