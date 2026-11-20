import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:8092',
    viewport: { width: 390, height: 844 },
    browserName: 'chromium',
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {},
  },
  webServer: { command: 'node scripts/serve-test.cjs', url: 'http://127.0.0.1:8092', reuseExistingServer: !process.env.CI },
});
