import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 15000,
  use: {
    baseURL: 'http://localhost:3333',
    browserName: 'chromium',
  },
  webServer: {
    command: 'npx serve -l 3333 -s .',
    port: 3333,
    reuseExistingServer: true,
  },
});
