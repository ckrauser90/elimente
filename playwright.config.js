// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:3000',
    // Kein Screenshot bei Erfolg, nur bei Fehler
    screenshot: 'only-on-failure',
    // Nur Chromium ist lokal gecacht – gilt als Default für alle Projekte
    browserName: 'chromium',
  },

  // Lokaler Webserver – wird automatisch gestartet/gestoppt
  webServer: {
    command: 'npx serve . -p 3000 --no-clipboard',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
  },

  projects: [
    {
      name: 'Desktop (1280px)',
      use: { viewport: { width: 1280, height: 800 } },
    },
    {
      // iPad Portrait: 768×1024, deviceScaleFactor 2 wie echtes iPad
      name: 'iPad Portrait (768px)',
      use: { viewport: { width: 768, height: 1024 }, deviceScaleFactor: 2 },
    },
    {
      // iPad Landscape: 1024×768
      name: 'iPad Landscape (1024px)',
      use: { viewport: { width: 1024, height: 768 }, deviceScaleFactor: 2 },
    },
    {
      // Mobile: iPhone-Größe
      name: 'Mobile (375px)',
      use: { viewport: { width: 375, height: 812 }, deviceScaleFactor: 3, isMobile: true },
    },
  ],
});
