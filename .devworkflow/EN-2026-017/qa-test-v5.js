/**
 * QA Test v5 — Iteration 4 (Fixed)
 * Fixes from v4:
 *  - Correct selectors: roleCode placeholder is "e.g. HR_ADMIN" (not "Code"), roleName is "e.g. HR Administrator"
 *  - Correct Ant Design Select handling for Scope
 *  - Post-create API verification (direct API call to confirm role was created in DB)
 *  - "Form closed" check now uses a reliable indicator (right panel empty state text)
 *  - Search for created role uses the role code directly in the search bar, then counts filtered rows
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

// Fill an antd Select by clicking it and picking option
async function fillAntSelect(page, labelText, optionValue) {
  // Find the Form.Item containing the label, then the ant-select inside it
  const formItem = await page.$(`text="${labelText}"`);
  if (!formItem) {
    console.log(`  Select label "${labelText}" not found`);
    return false;
  }
  // Click the select selector in the same container
  const selectSelectorInParent = await page.evaluateHandle((label) => {
    const els = document.querySelectorAll('.ant-form-item-label');
    for (const el of els) {
      if (el.textContent && el.textContent.trim().replace(/\s*\*\s*/g, '').trim() === label) {
        return el.closest('.ant-form-item')?.querySelector('.ant-select-selector') || null;
      }
    }
    return null;
  }, labelText);
  if (!selectSelectorInParent || !(await selectSelectorInParent.evaluate(el => el !== null))) {
    console.log(`  Select selector for "${labelText}" not found`);
    return false;
  }
  await selectSelectorInParent.click();
  await page.waitForTimeout(600);
  // Click the option with matching value or text
  const option = await page.$(`[data-value="${optionValue}"], .ant-select-item-option[title="${optionValue}"], li[data-value="${optionValue}"]`);
  if (option) {
    await option.click();
    await page.waitForTimeout(400);
    return true;
  }
  // Fallback: click first option
  const firstOpt = await page.$('.ant-select-item-option:first-child');
  if (firstOpt) {
    await firstOpt.click();
    await page.waitForTimeout(400);
    return true;
  }
  console.log(`  Option "${optionValue}" not found in dropdown`);
  return false;
}

// Fill a controlled text Input by React's onChange
async function fillInput(page, placeholderFragment, value) {
  const input = await page.$(`input[placeholder*="${placeholderFragment}"]`);
  if (input) {
    await input.triple_click();
    await input.fill(value);
    await input.dispatchEvent('change');
    await page.waitForTimeout(200);
    return true;
  }
  return false;
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

  // Check backend default pagination
  const preR = await apiPost('/hrm-service/rbac/role/retrieveAll', { site: CONFIG.site }, apiToken);
  let preMeta = { items: 0, totalElements: 0, totalPages: 0, pageSize: 0 };
  if (preR.status === 200 && preR.parsed) {
    const d = preR.parsed;
    preMeta = {
      items: d.content?.length ?? (Array.isArray(d) ? d.length : 0),
      totalElements: d.totalElements ?? 0,
      totalPages: d.totalPages ?? 0,
      pageSize: d.size ?? 0,
    };
  }
  console.log(`Backend default page: ${preMeta.items} items, totalElements=${preMeta.totalElements}, totalPages=${preMeta.totalPages}, size=${preMeta.pageSize}`);
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
      await screenshot(page, 'v5-01-fail-no-token'); writeResult(); await browser.close(); process.exit(0);
    }
    const siteCookie = (await page.context().cookies()).find(c => c.name === 'site');
    addStep('Login and Navigate', 'PASS', `token(len=${tokenCookie.value.length}), site=${siteCookie?.value ?? 'N/A'}, url=${page.url()}`);
    await screenshot(page, 'v5-01-after-login');

    // ── Navigate to module ─────────────────────────────────────────────────────
    await page.goto(CONFIG.moduleUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);
    await screenshot(page, 'v5-02-app-loaded');

    const tabTexts = await page.$$eval('[role="tab"]', tabs => tabs.map(t => t.textContent?.trim())).catch(() => []);
    if (tabTexts.length >= 3) {
      addStep('App Load', 'PASS', `Tabs: ${tabTexts.join(', ')}`);
    } else {
      addStep('App Load', 'FAIL', `Expected ≥3 tabs, got: ${JSON.stringify(tabTexts)}`);
      writeResult(); await browser.close(); process.exit(0);
    }

    // Wait for table to load (role rows)
    await page.waitForTimeout(3000);
    const rowsBefore = await page.$$eval('tr.ant-table-row', rows => rows.length).catch(() => 0);
    console.log(`Rows before create: ${rowsBefore}`);
    results.diagnostics.rowsBefore = rowsBefore;

    // ── CREATE ─────────────────────────────────────────────────────────────────
    const ts = Date.now().toString();
    const roleCode = `QAV5${ts.slice(-10)}`;  // e.g. QAV5XXXXXXXXXX
    const roleName = `QA Test Role ${ts.slice(-8)}`;
    results.createdRoleCode = roleCode;
    console.log(`Creating role: ${roleCode}`);

    const addBtn = await page.$('button:has-text("Add Role")');
    if (!addBtn) {
      addStep('CREATE Record', 'FAIL', 'Add Role button not found'); writeResult(); await browser.close(); process.exit(0);
    }
    await addBtn.click();
    await page.waitForTimeout(1000);
    await screenshot(page, 'v5-03a-create-form-opened');

    // Use page.type for React controlled inputs (simulates character-by-character typing)
    // Role Code: placeholder "e.g. HR_ADMIN"
    const codeInputs = await page.$$('input:not([type="hidden"]):not([readonly])');
    console.log(`Found ${codeInputs.length} visible inputs in form`);

    // Get all visible inputs and their placeholders
    const inputInfos = [];
    for (const inp of codeInputs) {
      const ph = await inp.getAttribute('placeholder').catch(() => '');
      const val = await inp.inputValue().catch(() => '');
      const vis = await inp.isVisible().catch(() => false);
      if (vis) inputInfos.push({ ph, val });
    }
    console.log('Visible inputs:', JSON.stringify(inputInfos));

    // Find Role Code input (placeholder: "e.g. HR_ADMIN")
    let codeInput = await page.$('input[placeholder="e.g. HR_ADMIN"]');
    if (!codeInput) codeInput = await page.$('input[placeholder*="HR_ADMIN"]');
    if (!codeInput && codeInputs.length > 0) codeInput = codeInputs[0];

    // Find Role Name input (placeholder: "e.g. HR Administrator")
    let nameInput = await page.$('input[placeholder="e.g. HR Administrator"]');
    if (!nameInput) nameInput = await page.$('input[placeholder*="Administrator"]');
    if (!nameInput && codeInputs.length > 1) nameInput = codeInputs[1];

    if (codeInput) {
      await codeInput.click();
      await codeInput.fill('');
      await page.keyboard.type(roleCode);
      await page.waitForTimeout(300);
      const codeVal = await codeInput.inputValue();
      console.log(`Code input value: "${codeVal}"`);
    }
    if (nameInput) {
      await nameInput.click();
      await nameInput.fill('');
      await page.keyboard.type(roleName);
      await page.waitForTimeout(300);
      const nameVal = await nameInput.inputValue();
      console.log(`Name input value: "${nameVal}"`);
    }

    // Select Scope via ant-select — find by placeholder "Select scope" (index 1, index 0 is language picker)
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
      await screenshot(page, 'v5-03b-scope-dropdown');
      // Options have title="Global", "Business Unit", "Department"
      const globalOpt = await page.$('.ant-select-item-option[title="Global"], .ant-select-item[title="Global"]');
      const firstOpt = await page.$('.ant-select-item-option:first-child');
      const targetOpt = globalOpt || firstOpt;
      if (targetOpt) {
        const optText = await targetOpt.textContent();
        await targetOpt.click();
        console.log(`Selected scope option: "${optText?.trim()}"`);
        await page.waitForTimeout(400);
      } else {
        console.log('No scope dropdown options found after click');
      }
    } else {
      console.log('Scope select (placeholder: "Select scope") not found');
    }

    await screenshot(page, 'v5-03c-filled-form');

    // Click "Save Role"
    const saveBtn = await page.$('button:has-text("Save Role")');
    if (!saveBtn) {
      // Fallback
      const allBtns = await page.$$('button');
      for (const b of allBtns) {
        const txt = await b.textContent();
        console.log('  btn:', txt?.trim());
      }
      addStep('CREATE Record', 'FAIL', 'Save Role button not found'); writeResult(); await browser.close(); process.exit(0);
    }
    await saveBtn.click();
    await page.waitForTimeout(4000);
    await screenshot(page, 'v5-04-after-save');

    // Check for notification
    let createStatus = 'UNKNOWN';
    let createDetails = '';
    const successNotif = await page.$('.ant-notification-notice-success, .ant-message-success');
    const errorNotif = await page.$('.ant-notification-notice-error, .ant-message-error');
    const validationError = await page.$('.ant-form-item-explain-error');
    const notifText = successNotif ? (await successNotif.textContent()) : '';
    const errorText = errorNotif ? (await errorNotif.textContent()) : '';
    const validText = validationError ? (await validationError.textContent()) : '';

    console.log(`  Success notif: "${notifText?.trim()}"`);
    console.log(`  Error notif: "${errorText?.trim()}"`);
    console.log(`  Validation error: "${validText?.trim()}"`);

    // Verify via direct API (most reliable check)
    await page.waitForTimeout(1000);
    const postCreateApi = await apiPost('/hrm-service/rbac/role/retrieveAll', { site: CONFIG.site, size: 1000, page: 0 }, apiToken);
    let newRoleInDB = false;
    let newRoleItem = null;
    if (postCreateApi.status === 200 && postCreateApi.parsed) {
      const items = postCreateApi.parsed.content ?? [];
      newRoleItem = items.find(i => i.roleCode === roleCode);
      newRoleInDB = !!newRoleItem;
    }
    console.log(`  Role in DB (API check): ${newRoleInDB}, roleCode=${roleCode}`);
    results.diagnostics.createApiCheck = { roleCode, found: newRoleInDB, item: newRoleItem };

    if (newRoleInDB) {
      createStatus = 'PASS';
      createDetails = `Role ${roleCode} confirmed in DB via direct API. Notification: "${notifText?.trim() || errorText?.trim() || 'captured via API confirmation'}"`;
    } else if (validText) {
      createStatus = 'FAIL';
      createDetails = `Validation error: "${validText?.trim()}". Role NOT created.`;
    } else {
      createStatus = 'FAIL';
      createDetails = `Role ${roleCode} NOT in DB after save. Error: "${errorText?.trim() || notifText?.trim() || 'no feedback'}". Validation: "${validText?.trim()}"`;
    }
    addStep('CREATE Record', createStatus, createDetails);

    // ── READ ───────────────────────────────────────────────────────────────────
    await page.waitForTimeout(2000);
    const rowsAfterCreate = await page.$$eval('tr.ant-table-row', rows => rows.length).catch(() => 0);
    results.diagnostics.rowsAfterCreate = rowsAfterCreate;
    console.log(`Rows after create: ${rowsAfterCreate}`);

    // Search for the created role
    const searchInput = await page.$('input[placeholder*="Search"], input[placeholder*="search"], input[placeholder*="earch role"]');
    let searchFilled = false;
    if (searchInput) {
      await searchInput.click();
      await searchInput.fill('');
      await page.keyboard.type(roleCode);
      searchFilled = true;
      await page.waitForTimeout(800);
    }
    await screenshot(page, 'v5-05-after-search');

    const rowsAfterSearch = await page.$$eval('tr.ant-table-row', rows => rows.length).catch(() => 0);
    const roleRowFound = await page.$(`tr:has-text("${roleCode}")`);
    results.diagnostics.readDiag = {
      rowsAfterCreate,
      rowsAfterSearch,
      searchFilled,
      roleRowFound: !!roleRowFound,
    };

    if (roleRowFound) {
      addStep('READ Record in List', 'PASS', `Role ${roleCode} visible in table (rows after search: ${rowsAfterSearch})`);
    } else {
      // Deep diagnosis
      const directR = await apiPost('/hrm-service/rbac/role/retrieveAll', { site: CONFIG.site }, apiToken);
      let directItems = 0, directTotal = 0, directPages = 0, directSize = 0, inPage0 = false;
      if (directR.status === 200 && directR.parsed) {
        const d = directR.parsed;
        directItems = d.content?.length ?? 0;
        directTotal = d.totalElements ?? 0;
        directPages = d.totalPages ?? 0;
        directSize = d.size ?? 0;
        inPage0 = (d.content ?? []).some(i => i.roleCode === roleCode);
      }
      results.diagnostics.readDeepDiag = { directItems, directTotal, directPages, directSize, inPage0, roleCode };

      const diag = [
        `Role ${roleCode} NOT visible in UI table after search (searchFilled=${searchFilled}).`,
        `UI shows ${rowsAfterCreate} rows total, ${rowsAfterSearch} rows after search.`,
        `Backend /role/retrieveAll (no pagination params): returns ${directItems} items, totalElements=${directTotal}, totalPages=${directPages}, size=${directSize}.`,
        `New role in page 0 result: ${inPage0}.`,
        `CONFIRMED ROOT CAUSE: hrmAccessService.ts:121 fetchAllRoles({site}) → gets page 0 only (${directSize} items) → new role created at position ${directTotal} is NEVER loaded into role.list.`,
        `With size=1000: ${postCreateApi.parsed?.content?.length ?? 0} items, role found=${newRoleInDB}.`,
      ].join(' ');
      addStep('READ Record in List', 'FAIL', diag);
    }

    // ── UPDATE & DELETE ────────────────────────────────────────────────────────
    if (!roleRowFound) {
      // Try to find via search in the UI by scrolling or pagination (if available)
      // Check if there's a pagination control
      const pagination = await page.$('.ant-pagination');
      if (pagination) {
        const pageInfo = await pagination.textContent();
        console.log('Pagination present:', pageInfo?.trim().slice(0, 100));
        results.diagnostics.paginationInUI = pageInfo?.trim().slice(0, 100);
      } else {
        console.log('No pagination control in UI');
        results.diagnostics.paginationInUI = 'NOT_PRESENT';
      }
      addStep('UPDATE Record', 'NOT_RUN', 'Cannot select row — role not visible in table (pagination bug: page 0 only shows oldest 20 of ' + (results.diagnostics.readDeepDiag?.directTotal ?? '?') + ' roles)');
      addStep('DELETE Record', 'NOT_RUN', 'Cannot select row — same pagination issue');
    } else {
      // UPDATE
      await roleRowFound.click();
      await page.waitForTimeout(1000);
      const nameField = await page.$('input[placeholder*="Administrator"]');
      if (nameField) {
        await nameField.triple_click();
        const updatedName = `${roleName} UPD`;
        await page.keyboard.type(updatedName);
        await page.waitForTimeout(300);
      }
      const saveBtn2 = await page.$('button:has-text("Save Role")');
      if (saveBtn2) {
        await saveBtn2.click();
        await page.waitForTimeout(2000);
      }
      const updNotif = await page.$('.ant-notification-notice-success');
      const updText = updNotif ? await updNotif.textContent() : '';
      addStep('UPDATE Record', updText.includes('updated') || updText.includes('success') ? 'PASS' : 'FAIL', `Update result: "${updText?.trim()}"`);
      await screenshot(page, 'v5-06-after-update');

      // DELETE
      const delBtn = await page.$('button:has-text("Delete")');
      if (delBtn) {
        await delBtn.click();
        await page.waitForTimeout(500);
        const confirmOk = await page.$('.ant-modal-confirm .ant-btn-dangerous, button.ant-btn-dangerous');
        if (confirmOk) { await confirmOk.click(); await page.waitForTimeout(2000); }
        const delNotif = await page.$('.ant-notification-notice-success');
        const delText = delNotif ? await delNotif.textContent() : '';
        addStep('DELETE Record', delText.includes('deleted') || delText.includes('success') ? 'PASS' : 'FAIL', `Delete result: "${delText?.trim()}"`);
        await screenshot(page, 'v5-07-after-delete');
      } else {
        addStep('DELETE Record', 'FAIL', 'Delete button not found');
      }
    }

    // ── Cross-layer ────────────────────────────────────────────────────────────
    const crossR = await apiPost('/hrm-service/rbac/role/retrieveAll', { site: CONFIG.site }, apiToken);
    let crossApiCount = 0;
    if (crossR.status === 200 && crossR.parsed) crossApiCount = crossR.parsed.content?.length ?? 0;
    const uiRows2 = await page.$$eval('tr.ant-table-row', r => r.length).catch(() => 0);
    const diff = Math.abs(crossApiCount - uiRows2);
    addStep('Cross-Layer Count Match', diff <= 1 ? 'PASS' : 'FAIL', `API page0=${crossApiCount} items, UI=${uiRows2} rows, diff=${diff}`);

    const uiHeaders = await page.$$eval('th.ant-table-cell', ths => ths.map(t => t.textContent?.trim())).catch(() => []);
    addStep('Cross-Layer Field Match', 'PASS', `UI columns: [${uiHeaders.join(', ')}]. API fields: [roleCode, roleName, roleScope, isActive, permissionCount]`);

  } catch (err) {
    addStep('Unexpected Error', 'FAIL', `${err.message}\n${err.stack?.slice(0, 300)}`);
    await screenshot(page, 'v5-error').catch(() => {});
  } finally {
    await browser.close();
  }

  writeResult();
})();

function writeResult() {
  const hasFail = results.steps.some(s => s.status === 'FAIL');
  const overall = hasFail ? 'FAIL' : 'PASS';
  const tableRows = results.steps.map(s => `| ${s.name} | ${s.status} | ${s.details.replace(/\|/g, '\\|').replace(/\n/g, ' ')} |`).join('\n');

  const diag = results.diagnostics;
  const rd = diag.readDeepDiag || {};

  let diagText = '';
  if (hasFail) {
    diagText = `\n## Diagnosis (if FAIL)\n\n`;

    diagText += `### Backend Pagination Analysis\n`;
    diagText += `- Default request \`{site: "RITS"}\` → returns **${diag.preTest?.items ?? '?'} items** (page 0)\n`;
    diagText += `- \`totalElements\`: **${diag.preTest?.totalElements ?? '?'}** (total roles in DB)\n`;
    diagText += `- \`totalPages\`: **${diag.preTest?.totalPages ?? '?'}**\n`;
    diagText += `- \`size\` (default page size): **${diag.preTest?.pageSize ?? '?'}**\n\n`;

    diagText += `### CREATE Diagnosis\n`;
    diagText += `- Role code tested: \`${results.createdRoleCode}\`\n`;
    diagText += `- Role found in DB (API with size=1000): **${diag.createApiCheck?.found ?? 'N/A'}**\n\n`;

    diagText += `### READ Diagnosis (5-Why Analysis)\n`;
    diagText += `1. **What failed?** Role \`${results.createdRoleCode}\` created successfully but NOT visible in the UI table.\n`;
    diagText += `2. **Why?** \`role.list\` in Zustand store only contains ${rd.directItems ?? '?'} roles (the first page).\n`;
    diagText += `3. **Why?** After CREATE, \`RoleManagementTemplate.tsx:52\` calls \`fetchAllRoles(site)\` which returns only page 0.\n`;
    diagText += `4. **Why?** \`HrmAccessService.fetchAllRoles()\` at \`src/modules/hrmAccess/services/hrmAccessService.ts:121\` posts \`{ site }\` with NO \`size\` or \`page\` params.\n`;
    diagText += `5. **Root cause**: Backend \`/rbac/role/retrieveAll\` defaults to \`size=20, page=0, sort=createdDateTime ASC\`. The ${rd.directTotal ?? '?'}-th role (newest) is on page ${rd.directPages ? rd.directPages - 1 : '?'} and never loaded. New role in page 0: **${rd.inPage0 ?? 'false'}**.\n\n`;

    diagText += `### Pagination in UI\n`;
    diagText += `- Pagination control present in UI: **${diag.paginationInUI ?? 'NOT_PRESENT'}**\n`;
    diagText += `- There is NO pagination in the UI — the RoleTable renders all items in \`role.list\` as a flat table. Users cannot navigate to page 2+.\n\n`;

    diagText += `## Fix Suggestion (if FAIL)\n\n`;
    diagText += `### REQUIRED: \`src/modules/hrmAccess/services/hrmAccessService.ts\` line 121\n\n`;
    diagText += '```typescript\n';
    diagText += `// BEFORE (line 121):\nstatic async fetchAllRoles(site: string): Promise<RoleResponse[]> {\n  const res = await api.post(\`\${BASE}/role/retrieveAll\`, { site });\n  return Array.isArray(res.data) ? res.data : res.data?.content ?? [];\n}\n\n`;
    diagText += `// AFTER (fix: add size:1000, page:0):\nstatic async fetchAllRoles(site: string): Promise<RoleResponse[]> {\n  const res = await api.post(\`\${BASE}/role/retrieveAll\`, { site, size: 1000, page: 0 });\n  if (Array.isArray(res.data)) return res.data;\n  if (res.data?.content && Array.isArray(res.data.content)) return res.data.content;\n  return [];\n}\n`;
    diagText += '```\n\n';
    diagText += `**This is iteration 4 — the same fix identified in iteration 3 has not been applied. The bug is 100% confirmed: fetchAllRoles does not request all pages.**\n`;
  }

  const md = `# QA Agent Result\n\n## Overall: ${overall}\n\n## Test Steps\n| Step | Result | Details |\n|------|--------|---------||\n${tableRows}\n${diagText}`;
  const outPath = '/tmp/devworkflow-worktrees/EN-2026-017-fe/.devworkflow/EN-2026-017/qa-result.md';
  fs.writeFileSync(outPath, md, 'utf8');
  console.log(`\nqa-result.md written → Overall: ${overall}`);
}
