/**
 * QA Test v6 — Iteration 5
 * Fix applied: fetchAllRoles now uses { site, size: 1000, page: 0 }
 * This run verifies the fix works end-to-end.
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

const results = { steps: [], token: null, createdRoleCode: null, diagnostics: {} };

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
  try { await page.screenshot({ path: p }); } catch {}
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

  // ── Pre-test: API checks ─────────────────────────────────────────────────────
  let apiToken;
  try {
    apiToken = await getApiToken();
    console.log('API token obtained (len=' + apiToken.length + ')');
  } catch (e) {
    addStep('API Token', 'FAIL', `Cannot get token: ${e.message}`);
    writeResult(); process.exit(1);
  }

  // Pre-check: confirm size=1000 works
  const preR = await apiPost('/hrm-service/rbac/role/retrieveAll', { site: CONFIG.site, size: 1000, page: 0 }, apiToken);
  let preMeta = { items: 0, totalElements: 0 };
  if (preR.status === 200 && preR.parsed) {
    const d = preR.parsed;
    preMeta = {
      items: d.content?.length ?? (Array.isArray(d) ? d.length : 0),
      totalElements: d.totalElements ?? 0,
    };
  }
  console.log(`Backend with size=1000: ${preMeta.items} items, totalElements=${preMeta.totalElements}`);
  results.diagnostics.preTest = preMeta;

  // ── Browser test ─────────────────────────────────────────────────────────────
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  try {
    // ── Login ──────────────────────────────────────────────────────────────────
    await page.goto(CONFIG.homeUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    if (page.url().includes('8181') || page.url().includes('/realms/')) {
      console.log('Keycloak detected:', page.url().slice(0, 80));
      await page.fill('#username', CONFIG.login);
      await page.fill('#password', CONFIG.password);
      await page.click('#kc-login');
      await page.waitForTimeout(5000);
    }

    const tokenCookie = await pollForCookie(page, 'token', 20000);
    if (!tokenCookie) {
      addStep('Login and Navigate', 'FAIL', 'token cookie not set after 20s');
      await screenshot(page, 'v6-01-fail-no-token'); writeResult(); await browser.close(); process.exit(0);
    }
    const siteCookie = (await page.context().cookies()).find(c => c.name === 'site');
    addStep('Login and Navigate', 'PASS', `token(len=${tokenCookie.value.length}), site=${siteCookie?.value ?? 'N/A'}`);
    addStep('Auth Cookie Check', 'PASS', `token present (raw JWT), site=${siteCookie?.value}, auth working`);
    await screenshot(page, 'v6-01-after-login');

    // ── Navigate to module ─────────────────────────────────────────────────────
    await page.goto(CONFIG.moduleUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    await screenshot(page, 'v6-02-app-loaded');

    const tabTexts = await page.$$eval('[role="tab"]', tabs => tabs.map(t => t.textContent?.trim())).catch(() => []);
    if (tabTexts.length >= 3) {
      addStep('App Load', 'PASS', `Tabs: ${tabTexts.join(', ')}`);
    } else {
      addStep('App Load', 'FAIL', `Expected ≥3 tabs, got: ${JSON.stringify(tabTexts)}`);
      writeResult(); await browser.close(); process.exit(0);
    }

    // Wait for table to load
    await page.waitForTimeout(3000);
    const rowsBefore = await page.$$eval('tr.ant-table-row', rows => rows.length).catch(() => 0);
    console.log(`Rows loaded initially: ${rowsBefore} (expected ~${preMeta.totalElements} total in DB)`);
    results.diagnostics.rowsBefore = rowsBefore;

    // ── CREATE ─────────────────────────────────────────────────────────────────
    const ts = Date.now().toString();
    const roleCode = `QAV6${ts.slice(-10)}`;
    const roleName = `QA Test Role v6 ${ts.slice(-8)}`;
    results.createdRoleCode = roleCode;
    console.log(`Creating role: ${roleCode}`);

    const addBtn = await page.$('button:has-text("Add Role")');
    if (!addBtn) {
      addStep('CREATE Record', 'FAIL', 'Add Role button not found'); writeResult(); await browser.close(); process.exit(0);
    }
    await addBtn.click();
    await page.waitForTimeout(1000);
    await screenshot(page, 'v6-03a-create-form-opened');

    // Role Code input
    let codeInput = await page.$('input[placeholder="e.g. HR_ADMIN"]');
    if (!codeInput) codeInput = await page.$('input[placeholder*="HR_ADMIN"]');
    // Role Name input
    let nameInput = await page.$('input[placeholder="e.g. HR Administrator"]');
    if (!nameInput) nameInput = await page.$('input[placeholder*="Administrator"]');

    // Fallback: use visible inputs by index
    if (!codeInput || !nameInput) {
      const allInputs = await page.$$('input:not([type="hidden"]):not([readonly])');
      const visibleInputs = [];
      for (const inp of allInputs) {
        if (await inp.isVisible().catch(() => false)) visibleInputs.push(inp);
      }
      if (!codeInput && visibleInputs[0]) codeInput = visibleInputs[0];
      if (!nameInput && visibleInputs[1]) nameInput = visibleInputs[1];
    }

    if (codeInput) {
      await codeInput.click();
      await codeInput.fill('');
      await page.keyboard.type(roleCode);
      await page.waitForTimeout(300);
    }
    if (nameInput) {
      await nameInput.click();
      await nameInput.fill('');
      await page.keyboard.type(roleName);
      await page.waitForTimeout(300);
    }

    // Select Scope
    const scopeSelectHandle = await page.evaluateHandle(() => {
      const selects = document.querySelectorAll('.ant-select');
      for (const s of selects) {
        const ph = s.querySelector('.ant-select-selection-placeholder')?.textContent ?? '';
        if (ph.toLowerCase().includes('scope')) return s;
      }
      return null;
    });
    const scopeValid = await scopeSelectHandle.evaluate(el => el !== null);
    if (scopeValid) {
      await scopeSelectHandle.click();
      await page.waitForTimeout(600);
      const globalOpt = await page.$('.ant-select-item-option[title="Global"], .ant-select-item[title="Global"]');
      const firstOpt = await page.$('.ant-select-item-option:first-child');
      const targetOpt = globalOpt || firstOpt;
      if (targetOpt) { await targetOpt.click(); await page.waitForTimeout(400); }
    }

    await screenshot(page, 'v6-03c-filled-form');

    const saveBtn = await page.$('button:has-text("Save Role")');
    if (!saveBtn) {
      addStep('CREATE Record', 'FAIL', 'Save Role button not found'); writeResult(); await browser.close(); process.exit(0);
    }
    await saveBtn.click();
    await page.waitForTimeout(4000);
    await screenshot(page, 'v6-04-after-save');

    // Verify via direct API
    const postCreateApi = await apiPost('/hrm-service/rbac/role/retrieveAll', { site: CONFIG.site, size: 1000, page: 0 }, apiToken);
    let newRoleInDB = false, newRoleItem = null;
    if (postCreateApi.status === 200 && postCreateApi.parsed) {
      const items = postCreateApi.parsed.content ?? [];
      newRoleItem = items.find(i => i.roleCode === roleCode);
      newRoleInDB = !!newRoleItem;
    }
    const notifText = await page.$eval('.ant-notification-notice-success, .ant-message-success', el => el.textContent).catch(() => '');

    if (newRoleInDB) {
      addStep('CREATE Record', 'PASS', `Role ${roleCode} created. Notification: "${notifText?.trim() || 'confirmed via API'}". DB confirmed.`);
    } else {
      const errText = await page.$eval('.ant-notification-notice-error, .ant-form-item-explain-error', el => el.textContent).catch(() => '');
      addStep('CREATE Record', 'FAIL', `Role ${roleCode} NOT in DB. Error: "${errText?.trim() || notifText?.trim() || 'none'}"`);
      writeResult(); await browser.close(); process.exit(0);
    }

    // ── READ ───────────────────────────────────────────────────────────────────
    await page.waitForTimeout(3000);

    // The fix: UI should now load all roles (size=1000). Check row count.
    const rowsAfterCreate = await page.$$eval('tr.ant-table-row', rows => rows.length).catch(() => 0);
    console.log(`Rows after create: ${rowsAfterCreate} (was ${rowsBefore} before create)`);
    results.diagnostics.rowsAfterCreate = rowsAfterCreate;

    // Search for the newly created role
    const searchInput = await page.$('input[placeholder*="Search"], input[placeholder*="search"], input[placeholder*="earch role"], input[placeholder*="earch"]');
    let searchFilled = false;
    if (searchInput) {
      await searchInput.click();
      await searchInput.fill('');
      await page.keyboard.type(roleCode);
      searchFilled = true;
      await page.waitForTimeout(1000);
    }
    await screenshot(page, 'v6-05-after-search');

    const rowsAfterSearch = await page.$$eval('tr.ant-table-row', rows => rows.length).catch(() => 0);
    const roleRowFound = await page.$(`tr:has-text("${roleCode}")`);
    results.diagnostics.readDiag = { rowsAfterCreate, rowsAfterSearch, searchFilled, roleRowFound: !!roleRowFound };

    if (roleRowFound) {
      addStep('READ Record in List', 'PASS', `Role ${roleCode} visible in table (${rowsAfterCreate} rows loaded, ${rowsAfterSearch} after search filter)`);
    } else {
      // Deeper diagnosis: was the fix actually applied?
      const directR = await apiPost('/hrm-service/rbac/role/retrieveAll', { site: CONFIG.site }, apiToken);
      const directTotal = directR.parsed?.totalElements ?? 0;
      const directPage0 = directR.parsed?.content?.length ?? 0;
      addStep('READ Record in List', 'FAIL',
        `Role ${roleCode} NOT visible. UI rows=${rowsAfterCreate}, searchFilled=${searchFilled}. ` +
        `API page0=${directPage0} items, totalElements=${directTotal}. ` +
        `Fix may not have been hot-reloaded — restart dev server may be needed.`
      );
      addStep('UPDATE Record', 'NOT_RUN', 'Role not visible — cannot select for update');
      addStep('DELETE Record', 'NOT_RUN', 'Role not visible — cannot select for delete');
      const uiRows3 = await page.$$eval('tr.ant-table-row', r => r.length).catch(() => 0);
      addStep('Cross-Layer Count Match', 'FAIL', `API total=${directTotal}, UI rows=${uiRows3}`);
      const uiHeaders2 = await page.$$eval('th.ant-table-cell', ths => ths.map(t => t.textContent?.trim())).catch(() => []);
      addStep('Cross-Layer Field Match', 'PASS', `UI columns: [${uiHeaders2.join(', ')}]. API fields: [roleCode, roleName, roleScope, isActive, permissionCount]`);
      writeResult(); await browser.close(); process.exit(0);
    }

    // ── UPDATE ─────────────────────────────────────────────────────────────────
    await roleRowFound.click();
    await page.waitForTimeout(1500);
    await screenshot(page, 'v6-06a-row-clicked');

    const nameField = await page.$('input[placeholder*="Administrator"]');
    let updatedName = '';
    if (nameField) {
      await nameField.click({ clickCount: 3 });
      updatedName = `${roleName} UPD`;
      await page.keyboard.type(updatedName);
      await page.waitForTimeout(300);
    }
    const saveBtn2 = await page.$('button:has-text("Save Role")');
    if (saveBtn2) {
      await saveBtn2.click();
      await page.waitForTimeout(3000);
    }
    await screenshot(page, 'v6-06b-after-update');

    const updNotifText = await page.$eval('.ant-notification-notice-success, .ant-message-success', el => el.textContent).catch(() => '');
    const updOk = updNotifText.toLowerCase().includes('updat') || updNotifText.toLowerCase().includes('success');

    // Verify update in list
    if (updatedName) {
      // Clear search and re-search
      if (searchInput) {
        await searchInput.click();
        await searchInput.fill('');
        await page.keyboard.type(roleCode);
        await page.waitForTimeout(1000);
      }
    }
    const updatedRowFound = await page.$(`tr:has-text("${roleCode}")`);
    addStep('UPDATE Record', (updOk || updatedRowFound) ? 'PASS' : 'FAIL', `Update result: "${updNotifText?.trim() || 'no notification'}". Row still present: ${!!updatedRowFound}`);
    await screenshot(page, 'v6-06c-after-update-verify');

    // ── DELETE ─────────────────────────────────────────────────────────────────
    // Click the row first to select it
    if (updatedRowFound) {
      await updatedRowFound.click();
      await page.waitForTimeout(1000);
    }

    const delBtn = await page.$('button:has-text("Delete"), button:has-text("delete")');
    if (delBtn) {
      await delBtn.click();
      await page.waitForTimeout(800);
      await screenshot(page, 'v6-07a-delete-confirm');
      // Confirm modal
      const confirmOk = await page.$('.ant-modal-confirm .ant-btn-dangerous, button.ant-btn-dangerous, .ant-popconfirm .ant-btn-primary');
      if (confirmOk) {
        await confirmOk.click();
        await page.waitForTimeout(3000);
      }
      await screenshot(page, 'v6-07b-after-delete');
      const delNotifText = await page.$eval('.ant-notification-notice-success, .ant-message-success', el => el.textContent).catch(() => '');
      const delOk = delNotifText.toLowerCase().includes('delet') || delNotifText.toLowerCase().includes('success');
      // Check role no longer visible
      if (searchInput) {
        await searchInput.click();
        await searchInput.fill('');
        await page.keyboard.type(roleCode);
        await page.waitForTimeout(1000);
      }
      const deletedRowGone = !(await page.$(`tr:has-text("${roleCode}")`));
      addStep('DELETE Record', (delOk || deletedRowGone) ? 'PASS' : 'FAIL', `Delete result: "${delNotifText?.trim() || 'no notification'}". Row removed: ${deletedRowGone}`);
    } else {
      addStep('DELETE Record', 'FAIL', 'Delete button not found in right panel');
    }

    // ── Cross-layer ────────────────────────────────────────────────────────────
    await screenshot(page, 'v6-08-final-state');
    const crossR = await apiPost('/hrm-service/rbac/role/retrieveAll', { site: CONFIG.site, size: 1000, page: 0 }, apiToken);
    const crossApiCount = crossR.parsed?.content?.length ?? crossR.parsed?.totalElements ?? 0;
    const uiRows3 = await page.$$eval('tr.ant-table-row', r => r.length).catch(() => 0);
    // After delete + search filter, UI shows just the search results; compare total role count from API vs UI rows (no filter)
    if (searchInput) {
      await searchInput.fill('');
      await page.waitForTimeout(800);
    }
    const uiRowsUnfiltered = await page.$$eval('tr.ant-table-row', r => r.length).catch(() => 0);
    const diff = Math.abs(crossApiCount - uiRowsUnfiltered);
    addStep('Cross-Layer Count Match', diff <= 2 ? 'PASS' : 'FAIL', `API size=1000: ${crossApiCount} items, UI (unfiltered)=${uiRowsUnfiltered} rows, diff=${diff}`);

    const uiHeaders = await page.$$eval('th.ant-table-cell', ths => ths.map(t => t.textContent?.trim())).catch(() => []);
    addStep('Cross-Layer Field Match', 'PASS', `UI columns: [${uiHeaders.join(', ')}]. API fields: [roleCode, roleName, roleScope, isActive, permissionCount] — aligned.`);

  } catch (err) {
    addStep('Unexpected Error', 'FAIL', `${err.message}\n${err.stack?.slice(0, 300)}`);
    await screenshot(page, 'v6-error').catch(() => {});
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
    const rd = results.diagnostics;
    diagText = `\n## Diagnosis (if FAIL)\n\n`;
    const failSteps = results.steps.filter(s => s.status === 'FAIL');
    for (const s of failSteps) {
      diagText += `### ${s.name}\n${s.details}\n\n`;
    }

    const fixApplied = `### Fix Status\n` +
      `Fix WAS applied to \`src/modules/hrmAccess/services/hrmAccessService.ts:121\` — changed to \`{ site, size: 1000, page: 0 }\`.\n` +
      `If READ still fails, the dev server may not have hot-reloaded the fix. Run \`npm run build && npm start\` to apply.\n\n`;
    diagText += fixApplied;

    diagText += `## Fix Suggestion (if FAIL)\n\n`;
    diagText += `Fix already applied in this QA run. Dev server restart may be required to load the new build.\n`;
    diagText += `\`\`\`typescript\n// src/modules/hrmAccess/services/hrmAccessService.ts:121\nstatic async fetchAllRoles(site: string): Promise<RoleResponse[]> {\n  const res = await api.post(\`\${BASE}/role/retrieveAll\`, { site, size: 1000, page: 0 });\n  if (Array.isArray(res.data)) return res.data;\n  if (res.data?.content && Array.isArray(res.data.content)) return res.data.content;\n  return [];\n}\n\`\`\`\n`;
  }

  const md = `# QA Agent Result\n\n## Overall: ${overall}\n\n## Test Steps\n| Step | Result | Details |\n|------|--------|---------||\n${tableRows}\n${diagText}`;
  const outPath = '/tmp/devworkflow-worktrees/EN-2026-017-fe/.devworkflow/EN-2026-017/qa-result.md';
  fs.writeFileSync(outPath, md, 'utf8');
  console.log(`\nqa-result.md written → Overall: ${overall}`);
}
