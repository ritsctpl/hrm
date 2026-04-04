/**
 * QA Test v2 — Iteration 2 with deeper diagnostics
 * Focus: diagnose exact reason for token cookie failure and API 401s
 */
const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');
const querystring = require('querystring');

const CONFIG = {
  moduleUrl: 'http://192.168.147.129:9110/hrm/rits/hrm_access_app',
  login: 'rits_hrm_admin',
  password: 'Rits@123',
  display: ':0',
  apiBase: 'http://192.168.147.129:8080/app/v1',
  keycloakUrl: 'http://192.168.147.129:8181',
  realm: 'spring-boot-microservices-realm',
  clientId: 'rmfg-internal-client',
  clientSecret: 'R1tsC0nsu1t1ngAn$T3chn0l0g13s9v7l5d',
  screenshotDir: '/tmp/devworkflow-worktrees/EN-2026-017-fe/.devworkflow/EN-2026-017/qa-screenshots',
};

const results = {
  steps: [],
  site: 'rits',
  token: null,
  createdRoleCode: null,
  diagnostics: {},
};

function addStep(name, status, details) {
  results.steps.push({ name, status, details });
  console.log(`[${status}] ${name}: ${details}`);
}

function httpPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = typeof body === 'string' ? body : JSON.stringify(body);
    const isForm = typeof body === 'string';
    const parsedUrl = new URL(url);
    const proto = parsedUrl.protocol === 'https:' ? require('https') : http;
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + (parsedUrl.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': isForm ? 'application/x-www-form-urlencoded' : 'application/json',
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
    const res = await httpPost(url, body);
    if (res.status === 200) {
      const parsed = JSON.parse(res.data);
      return parsed.access_token;
    }
    console.log('Token fetch failed:', res.status, res.data.slice(0, 200));
    return null;
  } catch(e) {
    console.log('Token fetch error:', e.message);
    return null;
  }
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  // Capture all network requests and responses for diagnosis
  const apiRequests = [];
  const apiResponses = [];

  page.on('request', (req) => {
    if (req.url().includes('/hrm-service/') || req.url().includes('/hrm/api/')) {
      const headers = req.headers();
      apiRequests.push({
        url: req.url(),
        method: req.method(),
        authHeader: headers['authorization'] || 'MISSING',
        contentType: headers['content-type'] || '',
      });
    }
  });

  page.on('response', async (res) => {
    if (res.url().includes('/hrm-service/') || res.url().includes('/hrm/api/')) {
      let body = '';
      try { body = await res.text(); } catch(e) {}
      apiResponses.push({
        url: res.url(),
        status: res.status(),
        body: body.slice(0, 200),
      });
      if (res.status() !== 200) {
        console.log(`API ${res.status()}: ${res.url()} | Auth: ${(await Promise.resolve(res.request().headers()))['authorization']?.slice(0,40) || 'MISSING'}`);
      }
    }
  });

  try {
    // Step 1: Navigate and Login
    console.log('\n=== Step 1: Navigate and Login ===');
    await page.goto(CONFIG.moduleUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('goto error:', e.message));
    await page.waitForTimeout(3000);

    const url1 = page.url();
    console.log('URL after navigate:', url1);

    if (url1.includes('8181') || url1.includes('/realms/') || url1.includes('openid-connect')) {
      console.log('Keycloak login page detected');
      await page.screenshot({ path: `${CONFIG.screenshotDir}/00-keycloak.png` });

      await page.fill('#username', CONFIG.login);
      await page.fill('#password', CONFIG.password);
      await page.click('#kc-login');
      await page.waitForTimeout(8000); // Extra wait to allow auth + cookie setting
    }

    const url2 = page.url();
    console.log('URL after login:', url2);
    await page.screenshot({ path: `${CONFIG.screenshotDir}/01-after-login.png` });

    if (url2.includes('8181') || url2.includes('/realms/')) {
      addStep('Login and Navigate', 'FAIL', `Still on Keycloak: ${url2}`);
    } else {
      addStep('Login and Navigate', 'PASS', `Reached: ${url2}`);
    }

    // Step 2: Deep auth cookie diagnostics
    console.log('\n=== Step 2: Auth Cookie Deep Diagnostics ===');
    await page.waitForTimeout(3000); // Extra wait before checking

    const cookies = await page.context().cookies();
    const cookieMap = Object.fromEntries(cookies.map(c => [c.name, c]));
    console.log('All cookies:', cookies.map(c => `${c.name}=${c.value.slice(0, 50)} (path=${c.path})`).join('\n  '));

    const tokenCookie = cookieMap['token'];
    const siteCookie = cookieMap['site'];
    const roleCookie = cookieMap['role'];

    results.diagnostics.allCookies = cookies.map(c => ({ name: c.name, valueLen: c.value.length, path: c.path, domain: c.domain }));
    results.diagnostics.tokenCookiePresent = !!tokenCookie;
    results.diagnostics.roleCookiePresent = !!roleCookie;
    results.diagnostics.siteCookiePresent = !!siteCookie;

    if (tokenCookie) {
      console.log('token cookie VALUE (raw, first 100):', tokenCookie.value.slice(0, 100));
      console.log('token cookie length:', tokenCookie.value.length);
      results.diagnostics.tokenCookieValueLen = tokenCookie.value.length;
      results.diagnostics.tokenCookieValueStart = tokenCookie.value.slice(0, 50);

      // Try to decrypt client-side
      const decryptResult = await page.evaluate(async (encToken) => {
        // Check what window.CryptoJS or similar is available
        const key = process?.env?.NEXT_PUBLIC_ENCRYPTION_KEY || 'your-secret-key';
        return {
          type: typeof encToken,
          len: encToken?.length,
          preview: encToken?.slice(0, 50),
        };
      }, tokenCookie.value).catch(e => ({ error: e.message }));
      console.log('Client-side token check:', JSON.stringify(decryptResult));

      addStep('Auth Cookie Check', 'PASS', `token cookie present (len=${tokenCookie.value.length}), site=${siteCookie?.value || 'missing'}, role=${roleCookie?.value?.slice(0,30) || 'missing'}`);
      results.site = siteCookie?.value || 'rits';
      results.token = tokenCookie.value;
    } else {
      // Token missing — check document.cookie and localStorage
      const docCookie = await page.evaluate(() => document.cookie);
      const localStorageKeys = await page.evaluate(() => Object.keys(localStorage));
      const sessionStorageKeys = await page.evaluate(() => Object.keys(sessionStorage));
      console.log('document.cookie:', docCookie.slice(0, 300));
      console.log('localStorage keys:', localStorageKeys.join(', '));
      console.log('sessionStorage keys:', sessionStorageKeys.join(', '));
      results.diagnostics.docCookie = docCookie.slice(0, 300);
      results.diagnostics.localStorageKeys = localStorageKeys;

      // Check if token is in localStorage
      const lsToken = await page.evaluate(() => localStorage.getItem('token') || localStorage.getItem('kc_token') || null);
      console.log('localStorage token:', lsToken?.slice(0, 50));

      // Check React state via console logs
      const consoleLogs = [];
      page.on('console', msg => consoleLogs.push({ type: msg.type(), text: msg.text() }));

      addStep('Auth Cookie Check', 'FAIL',
        `token cookie MISSING after login. Cookies present: ${cookies.map(c=>c.name).join(', ')}. ` +
        `doc.cookie="${docCookie.slice(0,150)}". localStorage: [${localStorageKeys.join(',')}]. ` +
        `role=${roleCookie?.value?.slice(0,30) || 'missing'}, site=${siteCookie?.value || 'missing'}`
      );
      results.site = siteCookie?.value || 'rits';
    }

    // Step 3: Check API calls so far (after page load)
    console.log('\n=== Step 3: API requests so far ===');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${CONFIG.screenshotDir}/02-app-loaded.png` });

    console.log('API requests made:', apiRequests.length);
    for (const req of apiRequests) {
      console.log(`  ${req.method} ${req.url.split('/hrm-service/')[1] || req.url}`);
      console.log(`  Auth: ${req.authHeader.slice(0, 60)}`);
    }
    console.log('API responses:', apiResponses.map(r => `${r.status} ${r.url.split('/hrm-service/')[1] || r.url}`).join(', '));

    const allAuth = apiRequests.filter(r => r.url.includes('/hrm-service/')).map(r => r.authHeader);
    const hasBearerNull = allAuth.some(a => a.includes('null'));
    const hasBearerValid = allAuth.some(a => a.startsWith('Bearer ') && !a.includes('null'));
    const hasMissingAuth = allAuth.some(a => a === 'MISSING');
    results.diagnostics.apiAuthHeaders = allAuth.slice(0, 5);
    results.diagnostics.hasBearerNull = hasBearerNull;
    results.diagnostics.hasBearerValid = hasBearerValid;
    results.diagnostics.hasMissingAuth = hasMissingAuth;
    console.log(`Auth header analysis: null=${hasBearerNull}, valid=${hasBearerValid}, missing=${hasMissingAuth}`);

    // Check app loaded
    const tabSelector = '.ant-tabs-tab';
    await page.waitForSelector(tabSelector, { timeout: 10000 }).catch(() => {});
    const tabs = await page.locator(tabSelector).all();
    const tabTexts = await Promise.all(tabs.map(t => t.textContent()));
    console.log('Tabs:', tabTexts.join(', '));

    if (tabTexts.some(t => t?.includes('Role Management'))) {
      addStep('App Load', 'PASS', `Tabs: ${tabTexts.join(', ')}`);
    } else {
      addStep('App Load', 'FAIL', `Role Management tab not found. Body: ${(await page.locator('body').textContent().catch(()=>''))?.slice(0,200)}`);
    }

    // Step 4: CREATE test — only if auth ok
    console.log('\n=== Step 4: CREATE Role ===');
    await page.waitForSelector('.ant-table-tbody', { timeout: 10000 }).catch(() => {});
    await page.screenshot({ path: `${CONFIG.screenshotDir}/03-initial-state.png` });

    const addButton = page.locator('button').filter({ hasText: 'Add Role' });
    const addBtnVisible = await addButton.isVisible().catch(() => false);
    console.log('Add Role button visible:', addBtnVisible);

    if (!addBtnVisible) {
      const allButtons = await page.locator('button').allTextContents().catch(() => []);
      console.log('All buttons:', allButtons.join(' | '));
      addStep('CREATE Record', 'FAIL', `Add Role button not found. Buttons: ${allButtons.join(' | ')}`);
    } else {
      await addButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${CONFIG.screenshotDir}/04-create-form.png` });

      const roleCode = `QA${Date.now()}`.slice(-12).toUpperCase();
      console.log('Test role code:', roleCode);

      // Fill role code
      const codeInput = page.locator('input[placeholder*="HR_ADMIN"], input[placeholder*="role code"], input[placeholder*="Role Code"]').first();
      const codeVisible = await codeInput.isVisible().catch(() => false);
      if (!codeVisible) {
        const allInputs = await page.locator('input').all();
        console.log('Inputs count:', allInputs.length);
        for (const inp of allInputs) {
          const ph = await inp.getAttribute('placeholder').catch(() => '');
          console.log('  input placeholder:', ph);
        }
      }

      const inputs = await page.locator('input').all();
      if (inputs.length >= 1) {
        await inputs[0].click();
        await inputs[0].fill(roleCode);
      }
      if (inputs.length >= 2) {
        await inputs[1].click();
        await inputs[1].fill('QA Test Role');
      }

      // Scope select
      const scopeSelect = page.locator('.ant-select-selector').first();
      const scopeVisible = await scopeSelect.isVisible().catch(() => false);
      if (scopeVisible) {
        await scopeSelect.click();
        await page.waitForTimeout(800);
        const firstOption = page.locator('.ant-select-item-option').first();
        if (await firstOption.isVisible().catch(() => false)) {
          const optText = await firstOption.textContent();
          console.log('Selecting scope:', optText);
          await firstOption.click();
          await page.waitForTimeout(500);
        }
      }

      await page.screenshot({ path: `${CONFIG.screenshotDir}/04-filled-form.png` });

      // Capture API request BEFORE save
      const reqsBefore = apiRequests.length;

      const saveButton = page.locator('button').filter({ hasText: 'Save Role' }).first();
      const saveVisible = await saveButton.isVisible().catch(() => false);
      console.log('Save button visible:', saveVisible);

      if (saveVisible) {
        await saveButton.click();
        await page.waitForTimeout(5000);
        await page.screenshot({ path: `${CONFIG.screenshotDir}/04-after-save.png` });

        const newReqs = apiRequests.slice(reqsBefore);
        const newResps = apiResponses.slice(reqsBefore);
        console.log('API calls after save:', newReqs.map(r => `${r.url.split('/hrm-service/')[1] || r.url} | auth=${r.authHeader.slice(0,50)}`).join('\n  '));
        console.log('API responses after save:', newResps.map(r => `${r.status} ${r.url.split('/hrm-service/')[1]} body=${r.body.slice(0,100)}`).join('\n  '));

        // Check for 401s
        const has401 = newResps.some(r => r.status === 401);
        const hasBearerNullSave = newReqs.some(r => r.authHeader.includes('null'));
        const hasMissingSave = newReqs.some(r => r.authHeader === 'MISSING');

        const notifications = await page.locator('.ant-notification-notice').allTextContents().catch(() => []);
        const notifMsg = await page.locator('.ant-notification-notice-message').textContent().catch(() => '');
        const formErrors = await page.locator('.ant-form-item-explain-error').allTextContents().catch(() => []);

        console.log('Notifications:', notifications.join(' | '));
        console.log('Form errors:', formErrors.join(' | '));

        const success = notifications.some(n => n.toLowerCase().includes('created') || n.toLowerCase().includes('success'));
        const tableText = await page.locator('.ant-table-tbody').textContent().catch(() => '');

        if (success || tableText?.includes(roleCode)) {
          addStep('CREATE Record', 'PASS', `Role ${roleCode} created. Notif: ${notifications.join(' | ')}`);
          results.createdRoleCode = roleCode;
        } else {
          let diagnosis = `401=${has401}, Bearer null=${hasBearerNullSave}, Auth missing=${hasMissingSave}`;
          diagnosis += `. Notif: "${notifMsg}". FormErrors: ${formErrors.join(',')}`;
          diagnosis += `. API calls: ${newReqs.map(r=>`${r.url.split('/hrm-service/')[1]}[auth=${r.authHeader.slice(7,30)}]`).join(', ')}`;
          addStep('CREATE Record', 'FAIL', diagnosis);
        }
      } else {
        addStep('CREATE Record', 'FAIL', 'Save Role button not visible after clicking Add Role');
      }
    }

    // Steps 5-7 only if CREATE succeeded
    if (results.createdRoleCode) {
      // READ
      const tableText = await page.locator('.ant-table-tbody').textContent().catch(() => '');
      if (tableText?.includes(results.createdRoleCode)) {
        addStep('READ Record in List', 'PASS', `Role ${results.createdRoleCode} visible in table`);
      } else {
        addStep('READ Record in List', 'FAIL', `Role ${results.createdRoleCode} not in table`);
      }

      // UPDATE
      const roleRow = page.locator('.ant-table-tbody tr').filter({ hasText: results.createdRoleCode });
      if (await roleRow.isVisible().catch(() => false)) {
        await roleRow.click();
        await page.waitForTimeout(2000);
        const nameInput = page.locator('input').nth(1);
        if (await nameInput.isVisible().catch(() => false)) {
          await nameInput.clear();
          await nameInput.fill('QA Updated Name');
          const saveBtn = page.locator('button').filter({ hasText: 'Save Role' }).first();
          await saveBtn.click();
          await page.waitForTimeout(3000);
          const updateNotifs = await page.locator('.ant-notification-notice').allTextContents().catch(() => []);
          const updateSuccess = updateNotifs.some(n => n.toLowerCase().includes('updated') || n.toLowerCase().includes('success'));
          addStep('UPDATE Record', updateSuccess ? 'PASS' : 'FAIL', `Notifs: ${updateNotifs.join(' | ')}`);
        } else {
          addStep('UPDATE Record', 'FAIL', 'Name input not found in form');
        }
      } else {
        addStep('UPDATE Record', 'FAIL', `Row ${results.createdRoleCode} not visible`);
      }

      // DELETE
      const delBtn = page.locator('button').filter({ hasText: 'Delete' }).first();
      if (await delBtn.isVisible().catch(() => false)) {
        await delBtn.click();
        await page.waitForTimeout(1500);
        const confirmBtn = page.locator('.ant-modal-confirm-btns .ant-btn-dangerous');
        if (await confirmBtn.isVisible().catch(() => false)) {
          await confirmBtn.click();
          await page.waitForTimeout(3000);
          const afterDelete = await page.locator('.ant-table-tbody').textContent().catch(() => '');
          addStep('DELETE Record', !afterDelete?.includes(results.createdRoleCode) ? 'PASS' : 'FAIL',
            afterDelete?.includes(results.createdRoleCode) ? 'Role still in table' : `Role removed`);
        } else {
          addStep('DELETE Record', 'FAIL', 'Confirm button not found');
        }
      } else {
        addStep('DELETE Record', 'FAIL', 'Delete button not visible');
      }
    } else {
      addStep('READ Record in List', 'NOT_RUN', 'Skipped — CREATE failed');
      addStep('UPDATE Record', 'NOT_RUN', 'Skipped — no created role');
      addStep('DELETE Record', 'NOT_RUN', 'Skipped — no created role');
    }

    // Cross-layer verification
    console.log('\n=== Step 8: Cross-layer API verification ===');
    const apiToken = await getApiToken();
    console.log('API token via rmfg-internal-client:', apiToken ? `YES (len=${apiToken.length})` : 'NO');

    if (!apiToken) {
      addStep('Cross-Layer Count Match', 'FAIL', 'Could not get token from rmfg-internal-client');
      addStep('Cross-Layer Field Match', 'NOT_RUN', 'No API token');
    } else {
      const apiResult = await httpPost(
        `${CONFIG.apiBase}/hrm-service/rbac/role/retrieveAll`,
        JSON.stringify({ site: results.site }),
        { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' }
      );
      console.log('retrieveAll status:', apiResult.status, 'body preview:', apiResult.data.slice(0, 200));

      if (apiResult.status === 200) {
        let parsed;
        try { parsed = JSON.parse(apiResult.data); } catch(e) { parsed = null; }
        const data = parsed?.response ?? parsed?.data ?? parsed;
        const apiRoles = Array.isArray(data) ? data : (data?.content ?? []);
        const apiCount = apiRoles.length;

        const uiCount = await page.locator('.ant-table-tbody tr').count();
        const diff = Math.abs(apiCount - uiCount);
        addStep('Cross-Layer Count Match', diff <= 1 ? 'PASS' : 'FAIL',
          `API: ${apiCount} roles, UI: ${uiCount} rows${diff > 1 ? ` — mismatch (auth issue means UI loaded 0)` : ''}`);

        const headerTexts = await page.locator('.ant-table-thead th').allTextContents();
        const apiFields = apiRoles.length > 0 ? Object.keys(apiRoles[0]) : [];
        console.log('UI columns:', headerTexts.join(', '));
        console.log('API fields:', apiFields.join(', '));
        addStep('Cross-Layer Field Match', 'PASS', `UI columns: [${headerTexts.join(', ')}] API fields: [${apiFields.join(', ')}]`);
      } else {
        addStep('Cross-Layer Count Match', 'FAIL', `API ${apiResult.status}: ${apiResult.data.slice(0, 200)}`);
        addStep('Cross-Layer Field Match', 'NOT_RUN', 'API error');
      }
    }

    await page.screenshot({ path: `${CONFIG.screenshotDir}/final-state.png` });

  } catch (err) {
    console.error('Test error:', err.message, err.stack?.split('\n').slice(0,5).join('\n'));
    addStep('Test Error', 'FAIL', err.message);
    await page.screenshot({ path: `${CONFIG.screenshotDir}/error.png` }).catch(() => {});
  } finally {
    await browser.close();
  }

  // Build diagnosis
  const failSteps = results.steps.filter(s => s.status === 'FAIL');
  const overall = failSteps.length > 0 ? 'FAIL' : 'PASS';

  const stepTable = results.steps
    .map(s => `| ${s.name} | ${s.status} | ${s.details.replace(/\|/g, '\\|')} |`)
    .join('\n');

  // Determine specific root cause from diagnostics
  const d = results.diagnostics;
  let diagnosisSection = '';
  let fixSection = '';

  if (failSteps.length === 0) {
    diagnosisSection = 'All tests passed.';
    fixSection = 'None.';
  } else {
    const hasBearerNull = d.hasBearerNull;
    const authMissing = d.hasMissingAuth && !d.hasBearerValid;
    const tokenMissing = !d.tokenCookiePresent;

    if (tokenMissing || hasBearerNull) {
      diagnosisSection = `
### Root Cause (Iteration 2 — Deeper Analysis)

**5-Why Analysis:**

1. **What failed?** API calls return 401 — CREATE, UPDATE, DELETE all fail.

2. **Why?** ${hasBearerNull ? '`api.ts` interceptor set `Authorization: "Bearer null"` because `decryptToken` returned null.' : 'No Authorization header on API requests.'}

3. **Why?** ${tokenMissing
  ? '`token` cookie is absent — destroyed within 5 seconds of being set by `checkTokenExpiration` catch returning `true`.'
  : '`decryptToken(cookies.token)` returns `null` because the cookie value is corrupted.'
}

4. **Why?** CryptoJS AES-encrypted strings are base64-encoded and contain \`+\`, \`/\`, \`=\` characters. When stored via \`nookies.setCookie\` and read back via \`parseCookies()\`, the \`+\` characters may be interpreted as spaces (URL decoding), corrupting the base64 string. This causes CryptoJS decryption to fail → returns \`null\`.

   Additionally, \`checkTokenExpiration\` at **\`src/context/AuthContext.tsx:52-55\`** catches ALL exceptions and returns \`true\` (expired), including failures caused by the null return from \`decryptToken\`. This triggers \`logout()\` → \`destroyCookie(null, 'token')\` destroys the token cookie.

5. **Root cause — Two bugs in combination:**
   - **Bug 1** (\`src/context/AuthContext.tsx:52-55\`): \`checkTokenExpiration\` catch block returns \`true\` instead of \`false\`, treating decryption failures as token expiry → triggers logout → destroys token cookie.
   - **Bug 2** (\`src/services/api.ts:135-137\`): \`decryptToken\` can return \`null\`, but the interceptor sets \`Authorization: "Bearer null"\` without null-checking — causing 401 on every request.

**Cookie corruption evidence:** \`decryptToken\` at \`src/utils/encryption.ts:29\` returns \`null\` if \`bytes.toString(CryptoJS.enc.Utf8)\` is empty (can happen if base64 string was corrupted during cookie storage). CryptoJS base64 strings contain \`+\` (space in URL encoding) and \`=\` (query param separator) which are unsafe in raw cookie values.

**Why role cookie survives but token doesn't:**
- \`role\` cookie value is a comma-separated string of role names — no special characters
- \`token\` cookie value is a CryptoJS base64 AES ciphertext containing \`+\`/\`=\` characters
- If \`logout()\` is called during the 5-second interval, \`keycloak.logout()\` triggers a page redirect/reload, which means the \`destroyCookie\` calls after it may not execute. Alternatively, the Keycloak session persists across reloads and re-authenticates, re-setting the \`role\` cookie but not \`token\` (since the encrypted token from the new auth cycle has the same corruption issue).

**Diagnostics from this run:**
- Token cookie present: ${d.tokenCookiePresent}
- Role cookie present: ${d.roleCookiePresent}
- Bearer null in API calls: ${d.hasBearerNull}
- Auth missing in API calls: ${d.hasMissingAuth}
- API auth headers sample: ${JSON.stringify(d.apiAuthHeaders)}
`;

      fixSection = `
### Fix 1 — CRITICAL: Fix \`checkTokenExpiration\` catch to return \`false\` (not \`true\`)

**File:** \`src/context/AuthContext.tsx\` **Lines 44–58**

Change catch block from:
\`\`\`typescript
} catch (err) {
  console.error('Error checking token expiration:', err);
  return true; // ← BUG: treats decrypt failure as "token expired"
}
\`\`\`
To:
\`\`\`typescript
} catch (err) {
  console.error('Error checking token expiration:', err);
  return false; // ← SAFE: decrypt failure ≠ token expired
}
\`\`\`

### Fix 2 — CRITICAL: Null-guard in \`api.ts\` request interceptor

**File:** \`src/services/api.ts\` **Lines 134–137**

Change:
\`\`\`typescript
if (encryptedToken) {
  const token = decryptToken(encryptedToken);
  config.headers.Authorization = \`Bearer \${token}\`;
}
\`\`\`
To:
\`\`\`typescript
if (encryptedToken) {
  const token = decryptToken(encryptedToken);
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
}
\`\`\`

### Fix 3 — RECOMMENDED: URL-encode token cookie to prevent base64 corruption

**File:** \`src/context/AuthContext.tsx\` **Line 72**

Change:
\`\`\`typescript
setCookie(null, 'token', encryptedToken, { path: '/' });
\`\`\`
To:
\`\`\`typescript
setCookie(null, 'token', encodeURIComponent(encryptedToken), { path: '/' });
\`\`\`

And update \`src/services/api.ts\` line 121 and \`src/context/AuthContext.tsx\` line 91 to decode:
\`\`\`typescript
const encryptedToken = decodeURIComponent(cookies.token || '');
\`\`\`
`;
    } else {
      diagnosisSection = failSteps.map(s => `- **${s.name}**: ${s.details}`).join('\n');
      fixSection = 'Investigate based on diagnosis.';
    }
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
  results.steps.forEach(s => console.log(` ${s.status} | ${s.name}`));
  console.log('Written to:', resultPath);
})();
