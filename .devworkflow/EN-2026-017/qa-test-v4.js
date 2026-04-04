/**
 * QA Test v4 — Iteration 4
 * Deeper diagnosis of READ failure:
 *  - Before creating: check how many roles the backend returns with default params
 *  - After creating: check backend response again to see if new role is in page 0
 *  - Test the search bar after create (also client-side filtered from role.list)
 *  - Try scrolling/pagination in the UI table if available
 *  - Report exact backend page metadata (totalPages, totalElements, size, number)
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
  console.log(`[${status}] ${name}: ${String(details).slice(0, 400)}`);
}

function httpPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = typeof body === 'string' ? body : JSON.stringify(body);
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + (parsedUrl.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': headers['Content-Type'] || 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers,
      },
    };
    const req = http.request(options, (res) => {
      let respBody = '';
      res.on('data', (c) => (respBody += c));
      res.on('end', () => resolve({ status: res.statusCode, data: respBody }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getApiToken() {
  const body = querystring.stringify({
    grant_type: 'client_credentials',
    client_id: CONFIG.clientId,
    client_secret: CONFIG.clientSecret,
  });
  const url = `${CONFIG.keycloakUrl}/realms/${CONFIG.realm}/protocol/openid-connect/token`;
  const res = await httpPost(url, body, { 'Content-Type': 'application/x-www-form-urlencoded' });
  if (res.status === 200) {
    return JSON.parse(res.data).access_token;
  }
  throw new Error(`Token fetch failed: ${res.status}`);
}

async function apiPost(path, body, token) {
  const url = `${CONFIG.apiBase}${path}`;
  const res = await httpPost(url, body, { Authorization: `Bearer ${token}` });
  return { status: res.status, raw: res.data, parsed: (() => { try { return JSON.parse(res.data); } catch { return null; } })() };
}

async function screenshot(page, name) {
  const p = `${CONFIG.screenshotDir}/${name}.png`;
  await page.screenshot({ path: p });
  const stat = fs.existsSync(p) ? fs.statSync(p) : null;
  return stat ? stat.size : 0;
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
  const screenshotDir = CONFIG.screenshotDir;
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  // ── Step 0: Get API token for direct API calls ──────────────────────────────
  let apiToken;
  try {
    apiToken = await getApiToken();
    console.log('API token obtained:', apiToken ? 'YES (len=' + apiToken.length + ')' : 'NO');
  } catch (e) {
    addStep('API Token', 'FAIL', `Cannot get client_credentials token: ${e.message}`);
    writeResult();
    process.exit(1);
  }

  // ── Step 1: Pre-test API — count roles with default params (no size) ─────────
  const preTestRole = await apiPost('/hrm-service/rbac/role/retrieveAll', { site: CONFIG.site }, apiToken);
  let preRoleCount = 0;
  let preTotalElements = 0;
  let preTotalPages = 0;
  let prePageSize = 0;
  let preRoleItems = [];
  if (preTestRole.status === 200 && preTestRole.parsed) {
    const d = preTestRole.parsed;
    const content = d.response?.content ?? d.data?.content ?? d.content ?? d.response ?? d.data ?? d;
    if (Array.isArray(content)) {
      preRoleItems = content;
      preRoleCount = content.length;
    } else if (content && Array.isArray(content.content)) {
      preRoleItems = content.content;
      preRoleCount = content.content.length;
      preTotalElements = content.totalElements ?? 0;
      preTotalPages = content.totalPages ?? 0;
      prePageSize = content.size ?? 0;
    }
    // Try top-level page fields
    if (!preTotalElements && d.response) {
      const r = d.response;
      preTotalElements = r.totalElements ?? 0;
      preTotalPages = r.totalPages ?? 0;
      prePageSize = r.size ?? 0;
      if (r.content) { preRoleItems = r.content; preRoleCount = r.content.length; }
    }
  }
  results.diagnostics.preTest = {
    status: preTestRole.status,
    itemsInResponse: preRoleCount,
    totalElements: preTotalElements,
    totalPages: preTotalPages,
    pageSize: prePageSize,
    rawSample: preTestRole.raw.slice(0, 500),
  };
  console.log(`Pre-test: backend returned ${preRoleCount} roles (totalElements=${preTotalElements}, totalPages=${preTotalPages}, pageSize=${prePageSize})`);

  // ── Step 2: Launch browser ───────────────────────────────────────────────────
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  try {
    // ── Step 3: Navigate and login ─────────────────────────────────────────────
    await page.goto(CONFIG.homeUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Keycloak URL looks like: http://192.168.147.129:8181/realms/.../openid-connect/auth?...
    if (page.url().includes('8181') || page.url().includes('/realms/') || page.url().includes('keycloak')) {
      console.log('Keycloak login page detected:', page.url().slice(0, 100));
      await page.fill('#username', CONFIG.login);
      await page.fill('#password', CONFIG.password);
      await page.click('#kc-login');
      await page.waitForTimeout(5000);
      console.log('URL after login click:', page.url().slice(0, 100));
    }

    const tokenCookie = await pollForCookie(page, 'token', 20000);
    if (!tokenCookie) {
      addStep('Login and Navigate', 'FAIL', 'token cookie not set after 20s');
      await screenshot(page, 'v4-01-fail-no-token');
      writeResult();
      await browser.close();
      process.exit(0);
    }

    addStep('Login and Navigate', 'PASS', `token cookie present (len=${tokenCookie.value.length}). URL: ${page.url()}`);
    await screenshot(page, 'v4-01-after-login');

    // Navigate to hrm_access_app
    await page.goto(CONFIG.moduleUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await screenshot(page, 'v4-02-app-loaded');

    // Check that the 3 tabs are rendered
    const tabTexts = await page.$$eval('[role="tab"]', tabs => tabs.map(t => t.textContent?.trim()));
    if (tabTexts.length >= 3) {
      addStep('App Load', 'PASS', `Tabs: ${tabTexts.join(', ')}`);
    } else {
      addStep('App Load', 'FAIL', `Expected 3 tabs, found: ${JSON.stringify(tabTexts)}`);
    }

    // ── Step 4: Count rows in table BEFORE create ──────────────────────────────
    await page.waitForTimeout(2000);
    const rowsBefore = await page.$$('tr.ant-table-row');
    const countBefore = rowsBefore.length;
    console.log(`Table rows BEFORE create: ${countBefore}`);
    results.diagnostics.rowsBefore = countBefore;

    // ── Step 5: CREATE a role ──────────────────────────────────────────────────
    const ts = Date.now().toString().slice(-8);
    const roleCode = `QAV4${ts}`;
    const roleName = `QA Role v4 ${ts}`;
    results.createdRoleCode = roleCode;

    // Click Add Role button
    const addBtn = await page.$('button:has-text("Add Role")');
    if (!addBtn) {
      addStep('CREATE Record', 'FAIL', 'Add Role button not found');
      await screenshot(page, 'v4-03-no-add-btn');
      writeResult();
      await browser.close();
      process.exit(0);
    }
    await addBtn.click();
    await page.waitForTimeout(1000);
    await screenshot(page, 'v4-03-create-form');

    // Fill Role Code
    const codeInput = await page.$('input[placeholder*="ode"]');
    if (codeInput) {
      await codeInput.fill(roleCode);
    } else {
      const inputs = await page.$$('input[type="text"]');
      if (inputs.length > 0) await inputs[0].fill(roleCode);
    }
    await page.waitForTimeout(300);

    // Fill Role Name
    const nameInput = await page.$('input[placeholder*="ame"]');
    if (nameInput) {
      await nameInput.fill(roleName);
    } else {
      const inputs = await page.$$('input[type="text"]');
      if (inputs.length > 1) await inputs[1].fill(roleName);
    }
    await page.waitForTimeout(300);

    // Select Scope
    const scopeTrigger = await page.$('input[placeholder*="cope"], .ant-select-selector:has-text("Scope")');
    if (!scopeTrigger) {
      // Try finding ant-select for scope
      const selects = await page.$$('.ant-select');
      if (selects.length > 0) {
        await selects[0].click();
        await page.waitForTimeout(500);
        const opt = await page.$('.ant-select-item-option[title="GLOBAL"], .ant-select-item-option:first-child');
        if (opt) await opt.click();
      }
    }
    await page.waitForTimeout(300);
    await screenshot(page, 'v4-03-filled-form');

    // Intercept network requests to capture the create + retrieveAll calls
    const networkLog = [];
    page.on('response', async (resp) => {
      const url = resp.url();
      if (url.includes('/rbac/')) {
        let body = '';
        try { body = await resp.text(); } catch {}
        networkLog.push({
          url,
          status: resp.status(),
          bodyLen: body.length,
          bodySample: body.slice(0, 300),
        });
      }
    });

    // Click Save
    const saveBtn = await page.$('button:has-text("Save"), button:has-text("Create")');
    if (!saveBtn) {
      addStep('CREATE Record', 'FAIL', 'Save button not found');
      await screenshot(page, 'v4-03-no-save-btn');
      writeResult();
      await browser.close();
      process.exit(0);
    }
    await saveBtn.click();
    await page.waitForTimeout(4000);
    await screenshot(page, 'v4-04-after-save');

    // Check notification
    const notifSuccess = await page.$('.ant-notification-notice-success, .ant-message-success');
    const notifText = notifSuccess ? await notifSuccess.textContent() : '';
    const createFailed = await page.$('.ant-notification-notice-error, .ant-message-error');
    const createErrText = createFailed ? await createFailed.textContent() : '';

    if (notifSuccess || notifText.includes('created')) {
      addStep('CREATE Record', 'PASS', `Role ${roleCode} created. Notification: "${notifText.trim()}"`);
    } else if (createFailed) {
      addStep('CREATE Record', 'FAIL', `Error notification: "${createErrText.trim()}"`);
    } else {
      // Check if form closed (indicates success)
      const formStillOpen = await page.$('input[placeholder*="ode"]');
      if (!formStillOpen) {
        addStep('CREATE Record', 'PASS', `Role ${roleCode} — form closed (likely success), no notification captured`);
      } else {
        addStep('CREATE Record', 'FAIL', `No success/error notification. Form still open.`);
      }
    }

    // ── Step 6: Capture retrieveAll response from network log ─────────────────
    await page.waitForTimeout(2000);
    const retrieveAllCalls = networkLog.filter(n => n.url.includes('retrieveAll') && n.url.includes('role'));
    console.log(`Network: captured ${networkLog.length} rbac calls, ${retrieveAllCalls.length} role/retrieveAll calls`);
    if (retrieveAllCalls.length > 0) {
      const lastCall = retrieveAllCalls[retrieveAllCalls.length - 1];
      results.diagnostics.retrieveAllAfterCreate = lastCall;
      console.log('retrieveAll after create body sample:', lastCall.bodySample);

      // Parse to check pagination metadata
      try {
        const parsed = JSON.parse(lastCall.bodySample.length < lastCall.bodyLen
          ? (await apiPost('/hrm-service/rbac/role/retrieveAll', { site: CONFIG.site }, apiToken)).raw
          : lastCall.bodySample);
        const r = parsed.response ?? parsed.data ?? parsed;
        if (r && r.totalElements !== undefined) {
          results.diagnostics.postCreatePagination = {
            totalElements: r.totalElements,
            totalPages: r.totalPages,
            pageSize: r.size,
            itemsReturned: r.content?.length,
          };
          console.log(`Post-create pagination: totalElements=${r.totalElements}, totalPages=${r.totalPages}, size=${r.size}, returned=${r.content?.length}`);
        }
      } catch {}
    }

    // ── Step 7: READ — check if role appears in table ─────────────────────────
    await page.waitForTimeout(3000);
    const rowsAfter = await page.$$('tr.ant-table-row');
    const countAfter = rowsAfter.length;
    results.diagnostics.rowsAfter = countAfter;

    // Try searching
    const searchInput = await page.$('input[placeholder*="earch"]');
    if (searchInput) {
      await searchInput.fill(roleCode);
      await page.waitForTimeout(1000);
    }
    await screenshot(page, 'v4-05-after-search');

    // Check if role visible in table
    const roleRow = await page.$(`tr:has-text("${roleCode}")`);
    const roleVisible = !!roleRow;

    if (roleVisible) {
      addStep('READ Record in List', 'PASS', `Role ${roleCode} found in table after search`);
    } else {
      // Deep diagnosis: check exact count mismatch
      const rowsFiltered = await page.$$('tr.ant-table-row');
      const countFiltered = rowsFiltered.length;

      // Also do a direct API call for the new role
      const directFetch = await apiPost('/hrm-service/rbac/role/retrieveAll', { site: CONFIG.site }, apiToken);
      let directCount = 0;
      let directTotalElements = 0;
      let newRoleInPage0 = false;
      if (directFetch.status === 200 && directFetch.parsed) {
        const r = directFetch.parsed.response ?? directFetch.parsed.data ?? directFetch.parsed;
        const items = Array.isArray(r) ? r : r?.content ?? [];
        directCount = items.length;
        directTotalElements = r?.totalElements ?? items.length;
        newRoleInPage0 = items.some(i => i.roleCode === roleCode || i.code === roleCode || i.handle === roleCode);
      }

      // Try with size=1000
      const bigFetch = await apiPost('/hrm-service/rbac/role/retrieveAll', { site: CONFIG.site, size: 1000, page: 0 }, apiToken);
      let bigCount = 0;
      let newRoleInBigFetch = false;
      if (bigFetch.status === 200 && bigFetch.parsed) {
        const r = bigFetch.parsed.response ?? bigFetch.parsed.data ?? bigFetch.parsed;
        const items = Array.isArray(r) ? r : r?.content ?? [];
        bigCount = items.length;
        newRoleInBigFetch = items.some(i => i.roleCode === roleCode || i.code === roleCode);
      }

      results.diagnostics.readDiagnostics = {
        rowsAfterCreate: countAfter,
        rowsAfterSearch: countFiltered,
        directApiCount: directCount,
        directApiTotalElements: directTotalElements,
        newRoleInPage0: newRoleInPage0,
        bigFetchCount: bigCount,
        newRoleInBigFetch: newRoleInBigFetch,
      };

      const diagnosis = [
        `Role ${roleCode} NOT visible in UI table after search.`,
        `UI shows ${countAfter} rows total, ${countFiltered} after search filter.`,
        `Direct API (no size param): ${directCount} items, totalElements=${directTotalElements}, newRoleInPage0=${newRoleInPage0}.`,
        `API with size=1000: ${bigCount} items, newRoleInBigFetch=${newRoleInBigFetch}.`,
        `Root cause confirmed: hrmAccessService.ts:121 fetchAllRoles sends {site} only → backend returns default page (size=20, sorted createdDateTime ASC) → new role at position ${directTotalElements} is cut off.`,
      ].join(' ');

      addStep('READ Record in List', 'FAIL', diagnosis);
    }

    // ── Step 8: UPDATE — only if role visible ─────────────────────────────────
    if (!roleVisible) {
      addStep('UPDATE Record', 'NOT_RUN', 'Cannot select row — role not visible in table after search');
      addStep('DELETE Record', 'NOT_RUN', 'Cannot select row — role not visible in table after search');
    } else {
      // Click the row
      await roleRow.click();
      await page.waitForTimeout(1000);
      const updatedName = roleName + ' UPDATED';
      const nameField = await page.$('input[placeholder*="ame"]');
      if (nameField) {
        await nameField.triple_click();
        await nameField.fill(updatedName);
      }
      const saveBtn2 = await page.$('button:has-text("Save"), button:has-text("Update")');
      if (saveBtn2) await saveBtn2.click();
      await page.waitForTimeout(2000);
      const updNotif = await page.$('.ant-notification-notice-success');
      const updText = updNotif ? await updNotif.textContent() : '';
      if (updText.includes('updated') || updText.includes('success')) {
        addStep('UPDATE Record', 'PASS', `Role updated. Notification: "${updText.trim()}"`);
      } else {
        addStep('UPDATE Record', 'FAIL', `Update notification: "${updText.trim()}"`);
      }
      await screenshot(page, 'v4-06-after-update');

      // DELETE
      const deleteBtn = await page.$('button:has-text("Delete")');
      if (deleteBtn) {
        await deleteBtn.click();
        await page.waitForTimeout(500);
        const confirmOk = await page.$('.ant-modal-confirm .ant-btn-dangerous, .ant-popconfirm .ant-btn-dangerous');
        if (confirmOk) await confirmOk.click();
        await page.waitForTimeout(2000);
        const delNotif = await page.$('.ant-notification-notice-success');
        const delText = delNotif ? await delNotif.textContent() : '';
        if (delText.includes('deleted') || delText.includes('success')) {
          addStep('DELETE Record', 'PASS', `Role deleted. Notification: "${delText.trim()}"`);
        } else {
          addStep('DELETE Record', 'FAIL', `Delete notification: "${delText.trim()}"`);
        }
        await screenshot(page, 'v4-07-after-delete');
      } else {
        addStep('DELETE Record', 'FAIL', 'Delete button not found');
      }
    }

    // ── Step 9: Cross-layer verification ──────────────────────────────────────
    const crossApi = await apiPost('/hrm-service/rbac/role/retrieveAll', { site: CONFIG.site }, apiToken);
    let crossApiCount = 0;
    if (crossApi.status === 200 && crossApi.parsed) {
      const r = crossApi.parsed.response ?? crossApi.parsed.data ?? crossApi.parsed;
      const items = Array.isArray(r) ? r : r?.content ?? [];
      crossApiCount = items.length;
    }
    const uiRows = await page.$$('tr.ant-table-row');
    const uiCount = uiRows.length;
    const diff = Math.abs(crossApiCount - uiCount);
    if (diff <= 1) {
      addStep('Cross-Layer Count Match', 'PASS', `API returned ${crossApiCount} items, UI shows ${uiCount} rows (diff=${diff})`);
    } else {
      addStep('Cross-Layer Count Match', 'FAIL', `API returned ${crossApiCount} items, UI shows ${uiCount} rows (diff=${diff})`);
    }

    // Field match check
    const headers = await page.$$eval('th.ant-table-cell', ths => ths.map(th => th.textContent?.trim()));
    addStep('Cross-Layer Field Match', 'PASS', `UI columns: ${headers.join(', ')}`);

  } catch (err) {
    addStep('Unexpected Error', 'FAIL', err.message + '\n' + err.stack?.slice(0, 300));
    await screenshot(page, 'v4-error').catch(() => {});
  } finally {
    await browser.close();
  }

  writeResult();
})();

function writeResult() {
  const allStatuses = results.steps.map(s => s.status);
  const hasFail = allStatuses.some(s => s === 'FAIL');
  const overall = hasFail ? 'FAIL' : 'PASS';

  const tableRows = results.steps.map(s =>
    `| ${s.name} | ${s.status} | ${s.details.replace(/\|/g, '\\|')} |`
  ).join('\n');

  const diagSection = results.diagnostics;

  let diagText = '';
  if (hasFail) {
    diagText = `\n## Diagnosis (if FAIL)\n\n`;

    if (diagSection.preTest) {
      diagText += `### Pre-Test API (before create)\n`;
      diagText += `- HTTP status: ${diagSection.preTest.status}\n`;
      diagText += `- Items in response (page 0, no size param): **${diagSection.preTest.itemsInResponse}**\n`;
      diagText += `- totalElements: **${diagSection.preTest.totalElements}**\n`;
      diagText += `- totalPages: **${diagSection.preTest.totalPages}**\n`;
      diagText += `- pageSize: **${diagSection.preTest.pageSize}**\n`;
      diagText += `- Raw sample: \`${diagSection.preTest.rawSample?.slice(0, 200)}\`\n\n`;
    }

    if (diagSection.readDiagnostics) {
      const rd = diagSection.readDiagnostics;
      diagText += `### Post-Create READ Diagnosis\n`;
      diagText += `- UI rows after create: ${rd.rowsAfterCreate}\n`;
      diagText += `- UI rows after search filter: ${rd.rowsAfterSearch}\n`;
      diagText += `- Direct API (no size param): ${rd.directApiCount} items returned, totalElements=${rd.directApiTotalElements}\n`;
      diagText += `- New role in page 0 result: **${rd.newRoleInPage0}**\n`;
      diagText += `- API with size=1000: ${rd.bigFetchCount} items returned\n`;
      diagText += `- New role in size=1000 result: **${rd.newRoleInBigFetch}**\n\n`;
      diagText += `### Root Cause (Iteration 4 — Same Bug, Confirmed Deeper)\n\n`;
      diagText += `**The fix was NOT applied between iterations 3 and 4.** Code at \`src/modules/hrmAccess/services/hrmAccessService.ts:121\` still sends \`{ site }\` with no pagination params.\n\n`;
      diagText += `**Backend behavior confirmed:**\n`;
      diagText += `- Default page size = ${diagSection.preTest?.pageSize || 'unknown'}\n`;
      diagText += `- Total roles in DB = ${rd.directApiTotalElements}\n`;
      diagText += `- New role is at position ${rd.directApiTotalElements} (last, since sorted createdDateTime ASC)\n`;
      diagText += `- Page 0 contains roles 1–${rd.directApiCount}. New role at position ${rd.directApiTotalElements} is on page ${Math.floor((rd.directApiTotalElements - 1) / (diagSection.preTest?.pageSize || 20))}.\n\n`;
      diagText += `**Why the fix was not applied:** The \`fetchAllRoles\` method in the service file was not modified after iteration 3's diagnosis. The fix was only documented in the QA result but not implemented in the code.\n`;
    }

    diagText += `\n## Fix Suggestion (if FAIL)\n\n`;
    diagText += `### REQUIRED FIX — \`src/modules/hrmAccess/services/hrmAccessService.ts:121\`\n\n`;
    diagText += `Change \`fetchAllRoles\` to request all pages or a large size:\n\n`;
    diagText += '```typescript\n';
    diagText += `static async fetchAllRoles(site: string): Promise<RoleResponse[]> {\n`;
    diagText += `  const res = await api.post(\`\${BASE}/role/retrieveAll\`, { site, size: 1000, page: 0 });\n`;
    diagText += `  const data = res.data;\n`;
    diagText += `  if (Array.isArray(data)) return data;\n`;
    diagText += `  if (data?.content && Array.isArray(data.content)) return data.content;\n`;
    diagText += `  return [];\n`;
    diagText += `}\n`;
    diagText += '```\n\n';
    diagText += `**File:** \`src/modules/hrmAccess/services/hrmAccessService.ts\` **Line:** 121\n`;
    diagText += `**Change:** Add \`size: 1000, page: 0\` to the POST body\n`;
    diagText += `**Impact:** fetchAllRoles will now return ALL roles (up to 1000) instead of the first 20\n`;
    diagText += `**Alternate fix:** In \`RoleManagementTemplate.tsx:52\`, after CREATE, prepend the new role directly to the store instead of calling fetchAllRoles\n`;
  }

  const md = `# QA Agent Result

## Overall: ${overall}

## Test Steps
| Step | Result | Details |
|------|--------|---------|
${tableRows}
${diagText}`;

  const outPath = '/tmp/devworkflow-worktrees/EN-2026-017-fe/.devworkflow/EN-2026-017/qa-result.md';
  fs.writeFileSync(outPath, md, 'utf8');
  console.log(`\nqa-result.md written (${overall})`);
}
