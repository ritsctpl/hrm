const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('http://192.168.147.129:9110/hrm', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  if (page.url().includes('8181')) {
    await page.fill('#username', 'rits_hrm_admin');
    await page.fill('#password', 'Rits@123');
    await page.click('#kc-login');
    await page.waitForTimeout(5000);
  }
  await page.goto('http://192.168.147.129:9110/hrm/rits/hrm_access_app', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  await page.click('button:has-text("Add Role")');
  await page.waitForTimeout(1000);

  // Find all ant-selects and their placeholders
  const selectInfo = await page.evaluate(() => {
    const selects = document.querySelectorAll('.ant-select');
    return Array.from(selects).map((s, i) => {
      const ph = s.querySelector('.ant-select-selection-placeholder')?.textContent ?? '';
      const val = s.querySelector('.ant-select-selection-item')?.textContent ?? '';
      const cls = s.className.slice(0, 80);
      return { i, ph, val, cls };
    });
  });
  console.log('ant-selects:', JSON.stringify(selectInfo, null, 2));

  // Try to find the scope select by placeholder text
  const scopeSelectorHandle = await page.evaluateHandle(() => {
    const selects = document.querySelectorAll('.ant-select');
    for (const s of selects) {
      const ph = s.querySelector('.ant-select-selection-placeholder')?.textContent ?? '';
      if (ph.includes('scope') || ph.includes('Scope')) return s;
    }
    return null;
  });
  const isValid = await scopeSelectorHandle.evaluate(el => el !== null && el !== undefined);
  console.log('Scope select found:', isValid);
  if (isValid) {
    await scopeSelectorHandle.click();
    await page.waitForTimeout(600);
    // Get dropdown options
    const opts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.ant-select-item-option')).map(o => ({
        value: o.getAttribute('data-value') || '',
        title: o.getAttribute('title') || '',
        text: o.textContent || '',
      }));
    });
    console.log('Dropdown options:', JSON.stringify(opts));
  }
  await browser.close();
})().catch(e => console.error(e));
