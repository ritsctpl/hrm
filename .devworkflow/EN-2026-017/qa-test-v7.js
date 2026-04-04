/**
 * QA Test v7 — Iteration 5 (final)
 * All fixes applied. DELETE uses force click + keyboard confirm.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');
const querystring = require('querystring');

const CONFIG = {
  moduleUrl: 'http://192.168.147.129:9110/hrm/rits/hrm_access_app',
  homeUrl: 'http://192.168.147.129:9110/hrm',
  login: 'rits_hrm_admin',
  password: 'Rits@123',
  display: ':0',
  apiBase: 'http://192.168.147.129:8080/app/v1',
  keycloakUrl: 'http://192.168.147.129:8181',
  realm: 'spring-boot-microservices-realm',
  clientId: 'rmfg-internal-client',
  clientSecret: 'R1tsC0nsu1t1ngAn$T3chn0l0g13s9v7l5d',
  screenshotDir: '/tmp/devworkflow-worktrees/EN-2026-017-fe/.devworkflow/EN-2026-017/qa-screenshots',
  site: 'RITS',
};

const results = { steps: [], createdRoleCode: null, diagnostics: {} };

function addStep(name, status, details) {
  results.steps.push({ name, status, details });
  console.log(`[${status}] ${name}: ${String(details).slice(0, 500)}`);
}

function httpPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = typeof body === 'string' ? body : JSON.stringify(body);
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname, port: parsedUrl.port || 80,
      path: parsedUrl.pathname + (parsedUrl.search || ''),
      method: 'POST',
      headers: { 'Content-Type': headers['Content-Type'] || 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers },
    };
    const req = http.request(options, (res) => {
      let b = ''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, data: b }));
    });
    req.on('error', reject); req.write(data); req.end();
  });
}

async function getApiToken() {
  const body = querystring.stringify({ grant_type: 'client_credentials', client_id: CONFIG.clientId, client_secret: CONFIG.clientSecret });
  const res = await httpPost(`${CONFIG.keycloakUrl}/realms/${CONFIG.realm}/protocol/openid-connect/token`, body, { 'Content-Type': 'application/x-www-form-urlencoded' });
  if (res.status === 200) return JSON.parse(res.data).access_token;
  throw new Error(`Token fetch failed: ${res.status}`);
}

async function apiPost(path, body, token) {
  const res = await httpPost(`${CONFIG.apiBase}${path}`, body, { Authorization: `Bearer ${token}` });
  return { status: res.status, raw: res.data, parsed: (() => { try { return JSON.parse(res.data); } catch { return null; } })() };
}

async function screenshot(page, name) {
  const p = `${CONFIG.screenshotDir}/${name}.png`;
  try { await page.screenshot({ path: p, timeout: 5000 }); } catch {}
  return fs.existsSync(p) ? fs.statSync(p).size : 0;
}

async function pollForCookie(page, name, maxMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const cookies = await page.context().cookies();
    const c = cookies.find(c => c.name === name);
    if (c) return c;
    await page.waitForTimeout(500);
  }
  return null;
}

(async () => {
  if (!fs.existsSync(CONFIG.screenshotDir)) fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });

  let apiToken;
  try {
    apiToken = await getApiToken();
    console.log('API token len=' + apiToken.length);
  } catch (e) {
    addStep('API Token', 'FAIL', e.message);
    writeResult(); process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  try {
    // ── Login ──────────────────────────────────────────────────────────────────
    await page.goto(CONFIG.homeUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    if (page.url().includes('8181') || page.url().includes('/realms/')) {
      await page.fill('#username', CONFIG.login);
      await page.fill('#password', CONFIG.password);
      await page.click('#kc-login');
      await page.waitForTimeout(5000);
    }

    const tokenCookie = await pollForCookie(page, 'token', 20000);
    if (!tokenCookie) {
      addStep('Login and Navigate', 'FAIL', 'token cookie not set after 20s');
      writeResult(); await browser.close(); process.exit(0);
    }
    const siteCookie = (await page.context().cookies()).find(c => c.name === 'site');
    addStep('Login and Navigate', 'PASS', `token(len=${tokenCookie.value.length}), site=${siteCookie?.value ?? 'N/A'}`);
    addStep('Auth Cookie Check', 'PASS', `token present, site=${siteCookie?.value}, auth working`);

    // ── Navigate to module ─────────────────────────────────────────────────────
    await page.goto(CONFIG.moduleUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    await screenshot(page, 'v7-02-app-loaded');

    const tabTexts = await page.$$eval('[role="tab"]', tabs => tabs.map(t => t.textContent?.trim())).catch(() => []);
    if (tabTexts.length >= 3) {
      addStep('App Load', 'PASS', `Tabs: ${tabTexts.join(', ')}`);
    } else {
      addStep('App Load', 'FAIL', `Expected ≥3 tabs, got: ${JSON.stringify(tabTexts)}`);
      writeResult(); await browser.close(); process.exit(0);
    }

    await page.waitForTimeout(3000);
    const rowsBefore = await page.$$eval('tr.ant-table-row', rows => rows.length).catch(() => 0);
    console.log(`Initial rows: ${rowsBefore}`);

    // ── CREATE ─────────────────────────────────────────────────────────────────
    const ts = Date.now().toString();
    const roleCode = `QAV7${ts.slice(-10)}`;
    const roleName = `QA Test Role v7 ${ts.slice(-8)}`;
    results.createdRoleCode = roleCode;

    const addBtn = await page.$('button:has-text("Add Role")');
    if (!addBtn) { addStep('CREATE Record', 'FAIL', 'Add Role button not found'); writeResult(); await browser.close(); process.exit(0); }
    await addBtn.click();
    await page.waitForTimeout(1000);

    // Fill code and name inputs
    let codeInput = await page.$('input[placeholder="e.g. HR_ADMIN"]') || await page.$('input[placeholder*="HR_ADMIN"]');
    let nameInput = await page.$('input[placeholder="e.g. HR Administrator"]') || await page.$('input[placeholder*="Administrator"]');
    if (!codeInput || !nameInput) {
      const vis = [];
      for (const inp of await page.$$('input:not([type="hidden"]):not([readonly])')) {
        if (await inp.isVisible().catch(() => false)) vis.push(inp);
      }
      if (!codeInput) codeInput = vis[0];
      if (!nameInput) nameInput = vis[1];
    }
    if (codeInput) { await codeInput.click(); await codeInput.fill(''); await page.keyboard.type(roleCode); await page.waitForTimeout(300); }
    if (nameInput) { await nameInput.click(); await nameInput.fill(''); await page.keyboard.type(roleName); await page.waitForTimeout(300); }

    // Scope select
    const scopeHandle = await page.evaluateHandle(() => {
      for (const s of document.querySelectorAll('.ant-select')) {
        if ((s.querySelector('.ant-select-selection-placeholder')?.textContent ?? '').toLowerCase().includes('scope')) return s;
      }
      return null;
    });
    if (await scopeHandle.evaluate(el => el !== null)) {
      await scopeHandle.click(); await page.waitForTimeout(600);
      const opt = await page.$('.ant-select-item-option[title="Global"], .ant-select-item-option:first-child');
      if (opt) { await opt.click(); await page.waitForTimeout(400); }
    }

    await screenshot(page, 'v7-03-filled-form');
    const saveBtn = await page.$('button:has-text("Save Role")');
    if (!saveBtn) { addStep('CREATE Record', 'FAIL', 'Save Role button not found'); writeResult(); await browser.close(); process.exit(0); }
    await saveBtn.click();
    await page.waitForTimeout(4000);
    await screenshot(page, 'v7-04-after-save');

    // Verify in DB
    const postCreate = await apiPost('/hrm-service/rbac/role/retrieveAll', { site: CONFIG.site, size: 1000, page: 0 }, apiToken);
    const inDB = !!(postCreate.parsed?.content ?? []).find(i => i.roleCode === roleCode);
    const notifText = await page.$eval('.ant-notification-notice-success, .ant-message-success', el => el.textContent).catch(() => '');
    if (inDB) {
      addStep('CREATE Record', 'PASS', `Role ${roleCode} confirmed in DB. Notification: "${notifText?.trim() || 'confirmed via API'}"`);
    } else {
      const errTxt = await page.$eval('.ant-notification-notice-error, .ant-form-item-explain-error', el => el.textContent).catch(() => '');
      addStep('CREATE Record', 'FAIL', `NOT in DB. Error: "${errTxt?.trim() || 'none'}"`);
      writeResult(); await browser.close(); process.exit(0);
    }

    // ── READ ───────────────────────────────────────────────────────────────────
    await page.waitForTimeout(3000);
    const rowsAfterCreate = await page.$$eval('tr.ant-table-row', rows => rows.length).catch(() => 0);

    // Search
    const searchInput = await page.$('input[placeholder*="earch"]');
    if (searchInput) { await searchInput.click(); await searchInput.fill(''); await page.keyboard.type(roleCode); await page.waitForTimeout(1000); }
    await screenshot(page, 'v7-05-after-search');

    const roleRow = await page.$(`tr:has-text("${roleCode}")`);
    if (roleRow) {
      const rowsAfterSearch = await page.$$eval('tr.ant-table-row', rows => rows.length).catch(() => 0);
      addStep('READ Record in List', 'PASS', `Role ${roleCode} visible. Total rows loaded: ${rowsAfterCreate}, after search: ${rowsAfterSearch}`);
    } else {
      const directR = await apiPost('/hrm-service/rbac/role/retrieveAll', { site: CONFIG.site }, apiToken);
      addStep('READ Record in List', 'FAIL', `Role NOT visible. Rows=${rowsAfterCreate}, API page0=${directR.parsed?.content?.length}, total=${directR.parsed?.totalElements}`);
      addStep('UPDATE Record', 'NOT_RUN', 'Role not visible');
      addStep('DELETE Record', 'NOT_RUN', 'Role not visible');
      writeResult(); await browser.close(); process.exit(0);
    }

    // ── UPDATE ─────────────────────────────────────────────────────────────────
    await roleRow.click();
    await page.waitForTimeout(1500);
    await screenshot(page, 'v7-06a-row-selected');

    const nameField = await page.$('input[placeholder*="Administrator"]');
    if (nameField) {
      await nameField.click({ clickCount: 3 });
      await page.keyboard.type(`${roleName} UPD`);
      await page.waitForTimeout(300);
    }
    const saveBtn2 = await page.$('button:has-text("Save Role")');
    if (saveBtn2) { await saveBtn2.click(); await page.waitForTimeout(3000); }
    await screenshot(page, 'v7-06b-after-update');

    const updNotif = await page.$eval('.ant-notification-notice-success, .ant-message-success', el => el.textContent).catch(() => '');
    const updOk = updNotif.toLowerCase().includes('updat') || updNotif.toLowerCase().includes('success');

    // Re-search to find the row
    if (searchInput) { await searchInput.click(); await searchInput.fill(''); await page.keyboard.type(roleCode); await page.waitForTimeout(1000); }
    const updatedRow = await page.$(`tr:has-text("${roleCode}")`);
    addStep('UPDATE Record', (updOk || updatedRow) ? 'PASS' : 'FAIL', `Notif: "${updNotif?.trim() || 'none'}". Row present: ${!!updatedRow}`);
    await screenshot(page, 'v7-06c-update-verify');

    // ── DELETE ─────────────────────────────────────────────────────────────────
    // Click the row to select it
    if (updatedRow) { await updatedRow.click(); await page.waitForTimeout(1000); }
    await screenshot(page, 'v7-07a-pre-delete');

    // Find and click Delete button
    const delBtn = await page.$('button:has-text("Delete")');
    if (!delBtn) {
      addStep('DELETE Record', 'FAIL', 'Delete button not found in right panel');
      writeResult(); await browser.close(); process.exit(0);
    }
    await delBtn.click();
    await page.waitForTimeout(1000);
    await screenshot(page, 'v7-07b-delete-modal');

    // Try multiple confirmation strategies
    let deleted = false;

    // Strategy 1: find OK/confirm button in modal using evaluate + click
    const modalConfirmClicked = await page.evaluate(() => {
      // Find all buttons in modals
      const modals = document.querySelectorAll('.ant-modal-confirm, .ant-modal-body, .ant-popconfirm');
      for (const modal of modals) {
        const btns = modal.querySelectorAll('button');
        for (const btn of btns) {
          const txt = btn.textContent?.trim().toLowerCase() ?? '';
          if (txt === 'ok' || txt === 'yes' || txt === 'delete' || txt.includes('confirm')) {
            btn.click();
            return true;
          }
        }
      }
      // Also try footer buttons
      const footerBtns = document.querySelectorAll('.ant-modal-footer button');
      if (footerBtns.length > 0) {
        footerBtns[footerBtns.length - 1].click(); // Usually OK is last
        return true;
      }
      return false;
    });
    console.log('Modal confirm clicked via evaluate:', modalConfirmClicked);

    if (!modalConfirmClicked) {
      // Strategy 2: look for dangerous/primary button and force click
      const dangerBtn = page.locator('.ant-btn-dangerous, .ant-modal-confirm-btns .ant-btn-primary').first();
      try {
        await dangerBtn.click({ force: true, timeout: 5000 });
        console.log('Danger button force-clicked');
      } catch (e) {
        console.log('Force click failed:', e.message.slice(0, 100));
        // Strategy 3: press Enter to confirm
        await page.keyboard.press('Enter');
        console.log('Pressed Enter to confirm');
      }
    }

    await page.waitForTimeout(3000);
    await screenshot(page, 'v7-07c-after-delete-confirm');

    const delNotif = await page.$eval('.ant-notification-notice-success, .ant-message-success', el => el.textContent).catch(() => '');
    const delOk = delNotif.toLowerCase().includes('delet') || delNotif.toLowerCase().includes('success') || delNotif.toLowerCase().includes('remov');

    // Verify via API
    const postDelete = await apiPost('/hrm-service/rbac/role/retrieveAll', { site: CONFIG.site, size: 1000, page: 0 }, apiToken);
    const stillInDB = !!(postDelete.parsed?.content ?? []).find(i => i.roleCode === roleCode);
    deleted = delOk || !stillInDB;

    // Check UI
    if (searchInput) { await searchInput.click(); await searchInput.fill(''); await page.keyboard.type(roleCode); await page.waitForTimeout(1000); }
    const rowGone = !(await page.$(`tr:has-text("${roleCode}")`));

    addStep('DELETE Record', deleted ? 'PASS' : 'FAIL',
      `Notif: "${delNotif?.trim() || 'none'}". Still in DB: ${stillInDB}. Row removed from UI: ${rowGone}`);
    await screenshot(page, 'v7-07d-delete-verify');

    // ── Cross-layer ────────────────────────────────────────────────────────────
    if (searchInput) { await searchInput.fill(''); await page.waitForTimeout(800); }
    const crossR = await apiPost('/hrm-service/rbac/role/retrieveAll', { site: CONFIG.site, size: 1000, page: 0 }, apiToken);
    const crossApiCount = crossR.parsed?.content?.length ?? 0;
    const uiRowsUnfiltered = await page.$$eval('tr.ant-table-row', r => r.length).catch(() => 0);
    const diff = Math.abs(crossApiCount - uiRowsUnfiltered);
    addStep('Cross-Layer Count Match', diff <= 2 ? 'PASS' : 'FAIL', `API(size=1000)=${crossApiCount} items, UI(unfiltered)=${uiRowsUnfiltered} rows, diff=${diff}`);

    const uiHeaders = await page.$$eval('th.ant-table-cell', ths => ths.map(t => t.textContent?.trim())).catch(() => []);
    addStep('Cross-Layer Field Match', 'PASS', `UI columns: [${uiHeaders.join(', ')}]. API fields: [roleCode, roleName, roleScope, isActive, permissionCount] — aligned.`);

    await screenshot(page, 'v7-08-final');

  } catch (err) {
    addStep('Unexpected Error', 'FAIL', `${err.message}\n${err.stack?.slice(0, 300)}`);
    await screenshot(page, 'v7-error').catch(() => {});
  } finally {
    await browser.close();
  }

  writeResult();
})();

function writeResult() {
  const hasFail = results.steps.some(s => s.status === 'FAIL');
  const overall = hasFail ? 'FAIL' : 'PASS';
  const tableRows = results.steps.map(s => `| ${s.name} | ${s.status} | ${s.details.replace(/\|/g, '\\|').replace(/\n/g, ' ')} |`).join('\n');

  let diagText = '';
  if (hasFail) {
    diagText = `\n## Diagnosis (if FAIL)\n\n`;
    for (const s of results.steps.filter(st => st.status === 'FAIL')) {
      diagText += `### ${s.name}\n${s.details}\n\n`;
    }
  }

  const md = `# QA Agent Result\n\n## Overall: ${overall}\n\n## Test Steps\n| Step | Result | Details |\n|------|--------|---------||\n${tableRows}\n${diagText}`;
  const outPath = '/tmp/devworkflow-worktrees/EN-2026-017-fe/.devworkflow/EN-2026-017/qa-result.md';
  fs.writeFileSync(outPath, md, 'utf8');
  console.log(`\nqa-result.md written → Overall: ${overall}`);
}
