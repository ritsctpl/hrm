import { defineConfig } from '@playwright/test';

/**
 * Pure-logic tests. Separate from playwright.config.ts on purpose: those drive a real
 * browser against a deployed app, these import the shipped modules and assert on their
 * output, so they need no server, no login and no browser.
 *
 * Run: npm run test:unit
 */
export default defineConfig({
  testDir: './tests/unit',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
});
