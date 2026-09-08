import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  failOnFlakyTests: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    ...(['chromium', 'firefox', 'webkit'] as const).map((browserName) => ({
      name: browserName,
      testIgnore: '**/phone.spec.ts',
      use: { browserName, viewport: { width: 1440, height: 900 } },
    })),
    {
      name: 'mobile-chromium',
      testMatch: '**/phone.spec.ts',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-webkit',
      testMatch: '**/phone.spec.ts',
      use: { ...devices['iPhone 13'] },
    },
  ],
  // Always build and serve our own artifact; an existing dev server may be stale.
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
    env: { VITE_BASE_PATH: '', VITE_GA_ID: '' },
    timeout: 120_000,
  },
});
