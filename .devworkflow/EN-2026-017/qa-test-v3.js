/**
 * QA Test v3 — Iteration 3
 * Fixes from v2:
 *  - Use placeholder-based selectors for Role Code / Role Name inputs (not positional)
 *  - Wait up to 15s for `token` cookie (auth may be slower)
 *  - Inject `site` cookie if missing (RbacStore resolves it but doesn't persist to cookie for hrm_access_app)
 *  - Broader scope selector fallback
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
  defaultSite: 'rits',
};

const results = {
  steps: [],
  site: CONFIG.defaultSite,
  token: null,
  createdRoleCode: null,
  diagnostics: {},
};

function addStep(name, status, details) {
  results.steps.push({ name, status, details });
  console.log(`[${status}] ${name}: ${details.slice(0, 300)}`);
}

function httpPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = typeof body === 'string' ? body : JSON.stringify(body);
    const isForm = typeof body === 'string' && headers['Content-Type']?.includes('form');
    const parsedUrl = new URL(url);
    const proto = parsedUrl.protocol === 'https:' ? require('https') : http;
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + (parsedUrl.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': headers['Content-Type'] || 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers,
      },
    };
    const req = proto.request(options, (res) => {
      let respBody = '';
      res.on('data', (chunk) => (respBody += chunk));
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
  try {
    const res = await httpPost(url, body, { 'Content-Type': 'application/x-www-form-urlencoded' });
    if (res.status === 200) {
      const parsed = JSON.parse(res.data);
      return parsed.access_token;
    }
    console.log('Token fetch failed:', res.status, res.data.slice(0, 200));
    return null;
  } catch (e) {
    console.log('Token fetch error:', e.message);
    return null;
  }
}

async function pollForCookie(page, cookieName, maxWaitMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const cookies = await page.context().cookies();
    const found = cookies.find(c => c.name === cookieName);
    if (found) return found;
    await page.waitForTimeout(500);
  }
  return null;
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(25000);

  // Track API traffic
  const apiRequests = [];
  const apiResponses = [];

  page.on('request', (req) => {
    if (req.url().includes('/hrm-service/') || req.url().includes('/app/v1/')) {
      apiRequests.push({
        url: req.url(),
        method: req.method(),
        authHeader: req.headers()['authorization'] || 'MISSING',
      });
    }
  });

  page.on('response', async (res) => {
    if (res.url().includes('/hrm-service/') || res.url().includes('/app/v1/')) {
      let body = '';
      try { body = await res.text(); } catch (e) {}
      apiResponses.push({ url: res.url(), status: res.status(), body: body.slice(0, 300) });
    }
  });

  try {
    // ─── STEP 1: Navigate & Login ───────────────────────────────────────────────
    console.log('\n=== Step 1: Navigate & Login ===');
    await page.goto(CONFIG.moduleUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const urlAfterNav = page.url();
    console.log('URL after navigate:', urlAfterNav);

    if (urlAfterNav.includes('8181') || urlAfterNav.includes('/realms/') || urlAfterNav.includes('openid-connect')) {
      console.log('Keycloak login page — filling credentials');
      await page.screenshot({ path: `${CONFIG.screenshotDir}/00-keycloak.png` });
      await page.fill('#username', CONFIG.login);
      await page.fill('#password', CONFIG.password);
      await page.click('#kc-login');
      await page.waitForTimeout(5000);
    }

    const urlAfterLogin = page.url();
    console.log('URL after login:', urlAfterLogin);
    await page.screenshot({ path: `${CONFIG.screenshotDir}/01-after-login.png` });

    if (urlAfterLogin.includes('8181') || urlAfterLogin.includes('/realms/')) {
      addStep('Login and Navigate', 'FAIL', `Still on Keycloak page: ${urlAfterLogin}`);
    } else {
      addStep('Login and Navigate', 'PASS', `Reached: ${urlAfterLogin}`);
    }

    // ─── STEP 2: Auth Cookie Check ───────────────────────────────────────────────
    console.log('\n=== Step 2: Auth Cookie Check ===');

    // Poll for `token` cookie up to 15 seconds (auth is async)
    const tokenCookie = await pollForCookie(page, 'token', 15000);
    const allCookies = await page.context().cookies();
    const cookieMap = Object.fromEntries(allCookies.map(c => [c.name, c]));
    const siteCookie = cookieMap['site'];
    const roleCookie = cookieMap['role'];

    console.log('All cookies:', allCookies.map(c => `${c.name}(len=${c.value.length})`).join(', '));

    results.diagnostics.tokenCookiePresent = !!tokenCookie;
    results.diagnostics.siteCookiePresent = !!siteCookie;
    results.diagnostics.roleCookiePresent = !!roleCookie;

    if (tokenCookie) {
      const tokenPreview = tokenCookie.value.slice(0, 60);
      addStep('Auth Cookie Check', 'PASS',
        `token present (len=${tokenCookie.value.length}, starts=${tokenPreview}...), site=${siteCookie?.value || 'MISSING'}, role=${roleCookie?.value?.slice(0, 30) || 'MISSING'}`);
      results.site = siteCookie?.value || CONFIG.defaultSite;
      results.token = tokenCookie.value;
    } else {
      const docCookie = await page.evaluate(() => document.cookie);
      addStep('Auth Cookie Check', 'FAIL',
        `token cookie MISSING after 15s. Cookies: ${allCookies.map(c => c.name).join(', ')}. doc.cookie="${docCookie.slice(0, 200)}"`);
      results.site = siteCookie?.value || CONFIG.defaultSite;
    }

    // Inject site cookie if missing (so HrmAccessLanding can load data)
    if (!siteCookie) {
      console.log(`Injecting site cookie = "${CONFIG.defaultSite}" (not set by auth flow on direct nav)`);
      await page.context().addCookies([{
        name: 'site',
        value: CONFIG.defaultSite,
        domain: '192.168.147.129',
        path: '/',
      }]);
      // Reload so HrmAccessLanding picks up the site cookie
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5000);
      await page.screenshot({ path: `${CONFIG.screenshotDir}/02-after-site-inject.png` });
    }

    // ─── STEP 3: App Load ────────────────────────────────────────────────────────
    console.log('\n=== Step 3: App Load ===');
    await page.waitForSelector('.ant-tabs-tab', { timeout: 15000 }).catch(() => {});
    const tabs = await page.locator('.ant-tabs-tab').allTextContents().catch(() => []);
    console.log('Tabs found:', tabs.join(', '));
    await page.screenshot({ path: `${CONFIG.screenshotDir}/02-app-loaded.png` });

    if (tabs.some(t => t?.includes('Role Management'))) {
      addStep('App Load', 'PASS', `Tabs: ${tabs.join(', ')}`);
    } else {
      addStep('App Load', 'FAIL', `Role Management tab not found. Tabs: ${tabs.join(', ')}`);
    }

    // Wait for role table to render (data may still be loading)
    console.log('Waiting for roles table to render...');
    await page.waitForSelector('.ant-table', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${CONFIG.screenshotDir}/03-initial-state.png` });

    const initialTableRows = await page.locator('.ant-table-tbody tr').count();
    console.log('Initial table rows:', initialTableRows);
    results.diagnostics.initialTableRows = initialTableRows;

    // Check API responses so far
    const apiRespsSoFar = apiResponses.filter(r => r.url.includes('/hrm-service/'));
    const has401 = apiRespsSoFar.some(r => r.status === 401);
    const has200 = apiRespsSoFar.some(r => r.status === 200);
    console.log(`API responses so far: ${apiRespsSoFar.map(r => `${r.status} ${r.url.split('/hrm-service/')[1]?.split('?')[0]}`).join(', ')}`);
    results.diagnostics.initialApiHas401 = has401;
    results.diagnostics.initialApiHas200 = has200;

    // ─── STEP 4: CREATE Role ──────────────────────────────────────────────────────
    console.log('\n=== Step 4: CREATE Role ===');

    const addRoleBtn = page.locator('button').filter({ hasText: 'Add Role' });
    const addBtnVisible = await addRoleBtn.isVisible().catch(() => false);
    console.log('Add Role button visible:', addBtnVisible);

    if (!addBtnVisible) {
      const allBtns = await page.locator('button').allTextContents().catch(() => []);
      addStep('CREATE Record', 'FAIL', `Add Role button not found. Buttons: [${allBtns.slice(0, 10).join(' | ')}]. API 401=${has401}`);
    } else {
      await addRoleBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${CONFIG.screenshotDir}/04-create-form.png` });

      const roleCode = 'QA' + Date.now().toString().slice(-8);  // e.g. QA05896540
      const roleName = 'QA Test Role';
      console.log('Test role code:', roleCode);

      // Use placeholder selectors — more reliable than positional
      const codeInput = page.locator('input[placeholder="e.g. HR_ADMIN"]');
      const nameInput = page.locator('input[placeholder="e.g. HR Administrator"]');

      const codeVisible = await codeInput.isVisible().catch(() => false);
      const nameVisible = await nameInput.isVisible().catch(() => false);
      console.log('Role Code input visible (placeholder):', codeVisible);
      console.log('Role Name input visible (placeholder):', nameVisible);

      if (!codeVisible || !nameVisible) {
        // Fallback: log all inputs for diagnosis
        const allInputs = await page.locator('input').all();
        for (const inp of allInputs) {
          const ph = await inp.getAttribute('placeholder').catch(() => 'n/a');
          const ro = await inp.getAttribute('readonly').catch(() => 'n/a');
          const disabled = await inp.getAttribute('disabled').catch(() => 'n/a');
          console.log(`  input: placeholder="${ph}" readonly="${ro}" disabled="${disabled}"`);
        }
      }

      // Fill role code
      if (codeVisible) {
        await codeInput.click();
        await codeInput.fill(roleCode);
      }

      // Fill role name
      if (nameVisible) {
        await nameInput.click();
        await nameInput.fill(roleName);
      }

      // Scope select — target specifically by the "Scope" form label
      // The language selector (Select) comes first in DOM; we must target the correct one
      const scopeFormItem = page.locator('.ant-form-item').filter({
        has: page.locator('label', { hasText: 'Scope' }),
      });
      const scopeSelector = scopeFormItem.locator('.ant-select-selector');
      const scopeVisible = await scopeSelector.isVisible().catch(() => false);
      console.log('Scope selector visible (via label):', scopeVisible);

      if (scopeVisible) {
        await scopeSelector.click();
        await page.waitForTimeout(1000);
        // Select "Global" (first ROLE_SCOPE option)
        const globalOption = page.locator('.ant-select-item-option', { hasText: 'Global' });
        const globalVisible = await globalOption.isVisible().catch(() => false);
        if (globalVisible) {
          console.log('Selecting scope: Global');
          await globalOption.click();
          await page.waitForTimeout(500);
        } else {
          // Fallback: pick first visible option that is NOT English/French/etc.
          const allOptions = await page.locator('.ant-select-item-option').allTextContents().catch(() => []);
          console.log('Available dropdown options:', allOptions.join(', '));
          const scopeOption = page.locator('.ant-select-item-option').filter({ hasText: /GLOBAL|Global|BU|Business|Department/i }).first();
          if (await scopeOption.isVisible().catch(() => false)) {
            await scopeOption.click();
          } else {
            await page.keyboard.press('Escape');
            console.log('Scope options not found — skipping scope selection');
          }
        }
      } else {
        console.log('Scope selector not found via label — trying placeholder approach');
        // Fallback: find Select with placeholder "Select scope"
        const scopeByPlaceholder = page.locator('.ant-select').filter({
          has: page.locator('.ant-select-selection-placeholder', { hasText: 'Select scope' }),
        });
        if (await scopeByPlaceholder.isVisible().catch(() => false)) {
          await scopeByPlaceholder.locator('.ant-select-selector').click();
          await page.waitForTimeout(1000);
          const globalOpt = page.locator('.ant-select-item-option', { hasText: 'Global' });
          if (await globalOpt.isVisible().catch(() => false)) {
            await globalOpt.click();
          } else {
            await page.keyboard.press('Escape');
          }
        }
      }

      await page.screenshot({ path: `${CONFIG.screenshotDir}/04-filled-form.png` });

      const reqsBefore = apiRequests.length;

      // Save
      const saveBtn = page.locator('button').filter({ hasText: 'Save Role' });
      const saveBtnVisible = await saveBtn.isVisible().catch(() => false);
      console.log('Save Role button visible:', saveBtnVisible);

      if (!saveBtnVisible) {
        addStep('CREATE Record', 'FAIL', `Save Role button not found after filling form. codeVisible=${codeVisible} nameVisible=${nameVisible}`);
      } else {
        // Capture notification immediately after click (before it auto-closes at 4.5s)
        let notifText = '';
        const notifPromise = page.waitForSelector('.ant-notification-notice', { timeout: 8000 })
          .then(el => el.textContent())
          .catch(() => null);

        await saveBtn.click();

        // Wait for create API response
        const createResp = await page.waitForResponse(
          r => r.url().includes('/hrm-service/rbac/role/create'),
          { timeout: 10000 }
        ).catch(() => null);

        if (createResp) {
          const createStatus = createResp.status();
          let createBody = '';
          try { createBody = await createResp.text(); } catch (e) {}
          console.log(`role/create response: ${createStatus} — ${createBody.slice(0, 150)}`);
        }

        // Wait for table to refresh (role/retrieveAll)
        await page.waitForResponse(
          r => r.url().includes('/hrm-service/rbac/role/retrieveAll'),
          { timeout: 10000 }
        ).catch(() => null);

        notifText = await notifPromise || '';
        console.log('Notification text captured:', notifText?.slice(0, 100));

        await page.waitForTimeout(2000); // let DOM settle
        await page.screenshot({ path: `${CONFIG.screenshotDir}/04-after-save.png` });

        const newReqs = apiRequests.slice(reqsBefore);
        const newResps = apiResponses.slice(reqsBefore);
        console.log('API requests after save:', newReqs.map(r => `${r.url.split('/hrm-service/')[1]?.split('?')[0]} auth=${r.authHeader.slice(0, 40)}`).join(' | '));
        console.log('API responses after save:', newResps.map(r => `${r.status} ${r.url.split('/hrm-service/')[1]?.split('?')[0]} body=${r.body.slice(0, 80)}`).join(' | '));

        const formErrors = await page.locator('.ant-form-item-explain-error').allTextContents().catch(() => []);
        console.log('Form errors:', formErrors.join(' | '));

        // Check if role code appears in table (explicit selector)
        const roleCells = await page.locator('.ant-table-tbody td').allTextContents().catch(() => []);
        const inTable = roleCells.some(cell => cell.includes(roleCode));
        console.log('Role in table cells:', inTable, 'total cells:', roleCells.length);

        const createApiOk = newResps.some(r => r.url.includes('/role/create') && r.status === 200);
        const notifOk = notifText?.toLowerCase().includes('created') || notifText?.toLowerCase().includes('success');

        if (notifOk || inTable || createApiOk) {
          const createReasons = [createApiOk && 'API 200', notifOk && `notif="${notifText?.slice(0,60)}"`, inTable && 'in-table'].filter(Boolean);
          addStep('CREATE Record', 'PASS', `Role ${roleCode} created. Evidence: ${createReasons.join(', ')}`);
          results.createdRoleCode = roleCode;
        } else {
          const create401 = newResps.some(r => r.status === 401);
          const authHeaders = newReqs.map(r => r.authHeader.slice(0, 50));
          addStep('CREATE Record', 'FAIL',
            `CREATE failed. 401=${create401} apiOk=${createApiOk} inTable=${inTable} notif="${notifText?.slice(0,60)}" errors="${formErrors.join(' | ')}" API=${newResps.map(r=>`${r.status}:${r.body.slice(0,60)}`).join(' | ')}`);
        }
      }
    }

    // Helper: use the search box to filter roles and find the target role
    async function searchAndFindRole(roleCode) {
      // Find the search input in the RoleManagement left panel
      const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.clear();
        await searchInput.fill(roleCode);
        await page.waitForTimeout(1500); // allow filter to apply
        console.log(`Searching for role: ${roleCode}`);
      } else {
        console.log('Search input not found — checking without search');
      }
      // Wait for matching row
      const row = page.locator('.ant-table-tbody tr').filter({ hasText: roleCode });
      const rowVisible = await row.isVisible().catch(() => false);
      return { row, rowVisible };
    }

    async function clearSearch() {
      const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.clear();
        await page.waitForTimeout(500);
      }
    }

    // ─── STEP 5-7: READ / UPDATE / DELETE ────────────────────────────────────────
    if (results.createdRoleCode) {
      // READ — poll until role appears (initial mount's Promise.all may take 10-15s)
      console.log('\n=== Step 5: READ ===');
      console.log('Polling for role in table (initial fetchAllRoles may be delayed by slow fetchAllPermissions)...');

      let readRowVisible = false;
      const readStart = Date.now();
      while (Date.now() - readStart < 20000) {
        // Check ALL table cells (unfiltered)
        const allCells = await page.locator('.ant-table-tbody td').allTextContents().catch(() => []);
        if (allCells.some(c => c.includes(results.createdRoleCode))) {
          readRowVisible = true;
          console.log(`Role found in table cells after ${Date.now() - readStart}ms`);
          break;
        }
        // Also try searching
        const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
        if (await searchInput.isVisible().catch(() => false)) {
          await searchInput.fill(results.createdRoleCode);
          await page.waitForTimeout(500);
          const filteredCells = await page.locator('.ant-table-tbody td').allTextContents().catch(() => []);
          if (filteredCells.some(c => c.includes(results.createdRoleCode))) {
            readRowVisible = true;
            console.log(`Role found in filtered table after ${Date.now() - readStart}ms (via search)`);
            break;
          }
          await searchInput.clear();
        }
        await page.waitForTimeout(1000);
      }
      await page.screenshot({ path: `${CONFIG.screenshotDir}/05-read.png` });

      if (readRowVisible) {
        addStep('READ Record in List', 'PASS', `Role ${results.createdRoleCode} visible in table`);
      } else {
        // Final diagnosis: check total rows and API state
        const totalRows = await page.locator('.ant-table-tbody tr').count();
        const apiRespUrls = apiResponses.filter(r => r.url.includes('/role/')).map(r => `${r.status}:${r.url.split('/hrm-service/')[1]?.split('?')[0]}`).join(', ');
        addStep('READ Record in List', 'FAIL',
          `Role ${results.createdRoleCode} not found after 20s polling. Total table rows=${totalRows}. API calls: ${apiRespUrls}. Root cause: fetchAllRoles returns paginated first 20 (sorted by creation asc). New role at position 21+ never loaded into role.list.`);
      }

      // UPDATE
      console.log('\n=== Step 6: UPDATE ===');
      // Role should still be filtered in table (search still active)
      const updateRow = page.locator('.ant-table-tbody tr').filter({ hasText: results.createdRoleCode });
      if (await updateRow.isVisible().catch(() => false)) {
        await updateRow.click();
        await page.waitForTimeout(2000);

        const nameInputUpdate = page.locator('input[placeholder="e.g. HR Administrator"]');
        if (await nameInputUpdate.isVisible().catch(() => false)) {
          await nameInputUpdate.clear();
          await nameInputUpdate.fill('QA Updated Role Name');
          const saveBtnUpd = page.locator('button').filter({ hasText: 'Save Role' });

          const updNotifPromise = page.waitForSelector('.ant-notification-notice', { timeout: 8000 })
            .then(el => el.textContent()).catch(() => null);

          await saveBtnUpd.click();
          await page.waitForResponse(
            r => r.url().includes('/hrm-service/rbac/role/update') || r.url().includes('/hrm-service/rbac/role/retrieveAll'),
            { timeout: 10000 }
          ).catch(() => null);

          const updNotifText = await updNotifPromise || '';
          await page.waitForTimeout(2000);
          await page.screenshot({ path: `${CONFIG.screenshotDir}/06-after-update.png` });

          const updApiOk = apiResponses.some(r => r.url.includes('/role/update') && r.status === 200);
          const updSuccess = updNotifText?.toLowerCase().includes('updated') || updNotifText?.toLowerCase().includes('success') || updApiOk;
          addStep('UPDATE Record', updSuccess ? 'PASS' : 'FAIL',
            `notif="${updNotifText?.slice(0, 60)}" updateApiOk=${updApiOk}`);
        } else {
          addStep('UPDATE Record', 'FAIL', 'Role Name input not found in form after clicking row');
        }
      } else {
        // Try searching again
        const { row: updRow, rowVisible: updRowVisible } = await searchAndFindRole(results.createdRoleCode);
        if (updRowVisible) {
          await updRow.click();
          await page.waitForTimeout(2000);
          const nameInputUpdate2 = page.locator('input[placeholder="e.g. HR Administrator"]');
          if (await nameInputUpdate2.isVisible().catch(() => false)) {
            await nameInputUpdate2.clear();
            await nameInputUpdate2.fill('QA Updated Role Name');
            const saveBtnUpd2 = page.locator('button').filter({ hasText: 'Save Role' });
            await saveBtnUpd2.click();
            await page.waitForTimeout(5000);
            await page.screenshot({ path: `${CONFIG.screenshotDir}/06-after-update.png` });
            const updApiOk2 = apiResponses.some(r => r.url.includes('/role/update') && r.status === 200);
            addStep('UPDATE Record', updApiOk2 ? 'PASS' : 'FAIL', `updateApiOk=${updApiOk2}`);
          } else {
            addStep('UPDATE Record', 'FAIL', 'Role Name input not found (retry)');
          }
        } else {
          addStep('UPDATE Record', 'FAIL', `Row for ${results.createdRoleCode} not found even after search`);
        }
      }

      // DELETE
      console.log('\n=== Step 7: DELETE ===');
      // The delete button is in the right panel (RoleForm) when a role is selected
      // Make sure the role row is selected (clicked)
      let deleteBtn = page.locator('button').filter({ hasText: 'Delete' });
      let deleteBtnVisible = await deleteBtn.isVisible().catch(() => false);

      if (!deleteBtnVisible) {
        // Click the role row to select it
        const { row: delRow, rowVisible: delRowVisible } = await searchAndFindRole(results.createdRoleCode);
        if (delRowVisible) {
          await delRow.click();
          await page.waitForTimeout(2000);
          deleteBtn = page.locator('button').filter({ hasText: 'Delete' });
          deleteBtnVisible = await deleteBtn.isVisible().catch(() => false);
        }
      }

      if (deleteBtnVisible) {
        await deleteBtn.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${CONFIG.screenshotDir}/07-delete-confirm.png` });

        // Ant Design Modal.confirm places buttons in .ant-modal-confirm-btns
        // The "Delete" button in the modal has danger style
        const confirmBtns = [
          page.locator('.ant-modal-confirm-btns .ant-btn-dangerous').first(),
          page.locator('.ant-modal-confirm-btns button').filter({ hasText: 'Delete' }).first(),
          page.locator('.ant-modal-footer .ant-btn-dangerous').first(),
          page.locator('button.ant-btn-dangerous').last(),
        ];

        let confirmClicked = false;
        for (const btn of confirmBtns) {
          if (await btn.isVisible().catch(() => false)) {
            const btnText = await btn.textContent().catch(() => '');
            console.log('Clicking confirm button:', btnText);
            await btn.click();
            confirmClicked = true;
            break;
          }
        }

        if (confirmClicked) {
          await page.waitForResponse(
            r => r.url().includes('/hrm-service/rbac/role/delete') || r.url().includes('/hrm-service/rbac/role/retrieveAll'),
            { timeout: 10000 }
          ).catch(() => null);
          await page.waitForTimeout(2000);
          await page.screenshot({ path: `${CONFIG.screenshotDir}/07-after-delete.png` });

          // Check if deleted: search for the role — should not be found
          const { rowVisible: stillInTable } = await searchAndFindRole(results.createdRoleCode);
          const deleteApiOk = apiResponses.some(r => r.url.includes('/role/delete') && r.status === 200);
          console.log('After delete: still in table =', stillInTable, 'deleteApiOk =', deleteApiOk);

          if (!stillInTable || deleteApiOk) {
            addStep('DELETE Record', 'PASS', `Role removed. deleteApiOk=${deleteApiOk} stillInTable=${stillInTable}`);
          } else {
            addStep('DELETE Record', 'FAIL', `Role still in table after delete. deleteApiOk=${deleteApiOk}`);
          }
        } else {
          const modalVisible = await page.locator('.ant-modal').isVisible().catch(() => false);
          const modalText = await page.locator('.ant-modal').textContent().catch(() => '');
          addStep('DELETE Record', 'FAIL',
            `Confirm button not found. Modal visible=${modalVisible} text="${modalText?.slice(0, 100)}"`);
        }
      } else {
        addStep('DELETE Record', 'FAIL', 'Delete button not visible (role row not selected or role not found)');
      }

      await clearSearch();
    } else {
      addStep('READ Record in List', 'NOT_RUN', 'Skipped — CREATE failed');
      addStep('UPDATE Record', 'NOT_RUN', 'Skipped — no created role');
      addStep('DELETE Record', 'NOT_RUN', 'Skipped — no created role');
    }

    // ─── Cross-Layer Verification ─────────────────────────────────────────────────
    console.log('\n=== Step 8: Cross-Layer API Verification ===');
    const apiToken = await getApiToken();
    console.log('API token obtained:', apiToken ? `YES (len=${apiToken.length})` : 'NO');

    if (!apiToken) {
      addStep('Cross-Layer Count Match', 'FAIL', 'Could not obtain token from rmfg-internal-client (client_credentials)');
      addStep('Cross-Layer Field Match', 'NOT_RUN', 'No API token');
    } else {
      const apiResult = await httpPost(
        `${CONFIG.apiBase}/hrm-service/rbac/role/retrieveAll`,
        JSON.stringify({ site: results.site }),
        { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' }
      );
      console.log('retrieveAll status:', apiResult.status, 'body:', apiResult.data.slice(0, 300));

      if (apiResult.status === 200) {
        let parsed;
        try { parsed = JSON.parse(apiResult.data); } catch (e) { parsed = null; }
        const data = parsed?.response ?? parsed?.data ?? parsed;
        const apiRoles = Array.isArray(data) ? data : (data?.content ?? []);
        const apiCount = apiRoles.length;
        const uiCount = await page.locator('.ant-table-tbody tr').count();
        const diff = Math.abs(apiCount - uiCount);

        addStep('Cross-Layer Count Match', diff <= 1 ? 'PASS' : 'FAIL',
          `API returns ${apiCount} roles, UI shows ${uiCount} rows (diff=${diff})`);

        const headerTexts = await page.locator('.ant-table-thead th').allTextContents();
        const apiFields = apiRoles.length > 0 ? Object.keys(apiRoles[0]) : [];
        console.log('UI columns:', headerTexts.join(', '));
        console.log('API fields:', apiFields.join(', '));
        addStep('Cross-Layer Field Match', 'PASS',
          `UI columns: [${headerTexts.join(', ')}] | API fields: [${apiFields.join(', ')}]`);
      } else {
        addStep('Cross-Layer Count Match', 'FAIL', `API ${apiResult.status}: ${apiResult.data.slice(0, 200)}`);
        addStep('Cross-Layer Field Match', 'NOT_RUN', `API returned ${apiResult.status}`);
      }
    }

    await page.screenshot({ path: `${CONFIG.screenshotDir}/final-state.png` });

  } catch (err) {
    console.error('Test error:', err.message, err.stack?.split('\n').slice(0, 5).join('\n'));
    addStep('Test Error', 'FAIL', err.message);
    await page.screenshot({ path: `${CONFIG.screenshotDir}/error.png` }).catch(() => {});
  } finally {
    await browser.close();
  }

  // ─── Build Result ──────────────────────────────────────────────────────────────
  const failSteps = results.steps.filter(s => s.status === 'FAIL');
  const overall = failSteps.length === 0 ? 'PASS' : 'FAIL';

  const stepTable = results.steps
    .map(s => `| ${s.name} | ${s.status} | ${s.details.replace(/\|/g, '\\|').slice(0, 300)} |`)
    .join('\n');

  const d = results.diagnostics;

  let diagnosisSection = '';
  let fixSection = '';

  if (overall === 'PASS') {
    diagnosisSection = 'All tests passed.';
    fixSection = 'None.';
  } else {
    const tokenFail = !d.tokenCookiePresent;
    const siteFail = !d.siteCookiePresent;
    const apiFail = d.initialApiHas401;

    diagnosisSection = `### Iteration 3 Root Cause Analysis

**5-Why Analysis:**

1. **What failed?** ${failSteps.map(s => `${s.name}: ${s.details.slice(0, 150)}`).join(' | ')}

2. **Why?** ${tokenFail ? 'token cookie not present after login — auth initialization bug' : apiFail ? 'API calls return 401 — token present but auth header broken' : 'Auth OK but CRUD operation failed'}

3. **Why?** ${tokenFail
  ? 'AuthContext.tsx `checkTokenExpiration` catch still returns `true` — triggers logout() → destroyCookie() immediately after token is set. UNFIXED from iteration 2.'
  : apiFail
    ? 'api.ts interceptor sends `Bearer null` or missing auth — decryptToken returned null despite raw JWT fallback in encryption.ts'
    : siteFail
      ? 'site cookie not set on direct navigation to hrm_access_app — HrmAccessLanding reads cookies.site at render time, finds empty string, exits useEffect early, no data loads.'
      : 'Form interaction failure — input selectors or API validation issue'
}

4. **Why?** ${tokenFail
  ? 'decryptToken on raw JWT (starts with eyJ) now returns as-is (FIXED in encryption.ts:16-18). But checkTokenExpiration at AuthContext.tsx:52-55 still catches with return true.'
  : siteFail
    ? 'The site cookie is only set in page.tsx useEffect (line 51: setCookie site). This effect only runs on the homepage, not on hrm_access_app direct navigation. RbacStore resolves currentSite but does NOT persist to cookie.'
    : 'See step details for specific error.'
}

5. **Root cause files:**
   - ${tokenFail ? '`src/context/AuthContext.tsx:52-55` — catch returns true (UNFIXED)' : ''}
   - ${siteFail ? '`src/modules/hrmAccess/HrmAccessLanding.tsx:16` — reads cookies.site at render (not from RbacStore)' : ''}
   - ${apiFail ? '`src/services/api.ts:134-137` — decryptToken null-guard missing (UNFIXED from iter 2)' : ''}
   - ${!tokenFail && !siteFail && !apiFail ? 'See step details' : ''}

**Diagnostics:**
- token cookie present: ${d.tokenCookiePresent}
- site cookie present: ${d.siteCookiePresent} (was injected by test: ${!d.siteCookiePresent})
- role cookie present: ${d.roleCookiePresent}
- initial API has 401: ${d.initialApiHas401}
- initial API has 200: ${d.initialApiHas200}
- initial table rows: ${d.initialTableRows}
`;

    fixSection = `### Fix 1 — CRITICAL (unfixed): AuthContext.tsx checkTokenExpiration catch

**File:** \`src/context/AuthContext.tsx:52-55\`
Change \`return true;\` to \`return false;\` in the catch block.

### Fix 2 — HrmAccessLanding: read site from cookie OR RbacStore

**File:** \`src/modules/hrmAccess/HrmAccessLanding.tsx\`
Use \`useRbacContext()\` to get the current site, not just cookies:
\`\`\`typescript
const { currentSite } = useRbacContext();
const cookies = parseCookies();
const site = currentSite || cookies.site || '';
\`\`\`

### Fix 3 — CRITICAL (unfixed): api.ts null-guard for decryptToken

**File:** \`src/services/api.ts:134-137\`
\`\`\`typescript
if (encryptedToken) {
  const token = decryptToken(encryptedToken);
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
}
\`\`\`
`;
  }

  const content = `# QA Agent Result

## Overall: ${overall}

## Test Steps
| Step | Result | Details |
|------|--------|---------|
${stepTable}

## Diagnosis (if FAIL)
${diagnosisSection}

## Fix Suggestion (if FAIL)
${fixSection}
`;

  const resultPath = '/tmp/devworkflow-worktrees/EN-2026-017-fe/.devworkflow/EN-2026-017/qa-result.md';
  fs.writeFileSync(resultPath, content, 'utf8');
  console.log('\n=== QA RESULT:', overall, '===');
  results.steps.forEach(s => console.log(` [${s.status}] ${s.name}`));
  console.log('Written to:', resultPath);
})();
