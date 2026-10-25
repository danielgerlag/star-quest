import { defineConfig, devices } from '@playwright/test';
import config from './playwright.config';

const baseURL = 'http://127.0.0.1:4174/star-quest/';

export default defineConfig({
  ...config,
  testMatch: '**/deployment.spec.ts',
  use: { ...config.use, baseURL },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run preview -- --base=/star-quest/ --port 4174 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
  },
});
