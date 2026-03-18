import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],

  use: {
    // Lokaler Dev-Server oder GitHub Pages URL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Installierten Browser explizit angeben (kein Download nötig)
        executablePath: process.env.CHROMIUM_PATH ||
          '/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell',
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        executablePath: process.env.CHROMIUM_PATH ||
          '/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell',
      },
    },
  ],

  // Lokalen Server starten falls kein BASE_URL gesetzt
  webServer: process.env.BASE_URL ? undefined : {
    command: 'python3 -m http.server 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
