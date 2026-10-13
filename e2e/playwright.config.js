// Browser tests for the CC button and caption translation.
// Run `npm run build` first, then `npm run test:e2e`.
const { defineConfig, devices } = require('@playwright/test');

const PORT = Number(process.env.E2E_PORT || 4173);

// Chromium with the screen, touch and user agent of each device. Desktop
// Safari's user agent alone switches video.js to Safari's code paths
const chromium = [
  { name: 'chrome', use: { ...devices['Desktop Chrome'] } },
  { name: 'safari-agent', use: { ...devices['Desktop Safari'], browserName: 'chromium' } },
  { name: 'iphone', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
  { name: 'ipad', use: { ...devices['iPad Pro 11'], browserName: 'chromium' } },
  { name: 'android', use: { ...devices['Pixel 7'] } },
];

// The real Safari and Firefox engines, where they are installed (CI):
// npx playwright install --with-deps webkit firefox
const engines = [
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  { name: 'webkit-iphone', use: { ...devices['iPhone 13'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
];

module.exports = defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  projects: process.env.E2E_ALL_BROWSERS ? [...chromium, ...engines] : chromium,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]] : 'list',
  testDir: './tests',
  timeout: 60000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node e2e/server.js',
    cwd: '..',
    reuseExistingServer: !process.env.CI,
    url: `http://localhost:${PORT}/playback/presentation/2.3/`,
  },
});
