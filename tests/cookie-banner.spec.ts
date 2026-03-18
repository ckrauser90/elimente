import { test, expect } from '@playwright/test';
import { clearCookieConsent } from './helpers';

// ─────────────────────────────────────────────────────────
// 1. COOKIE-BANNER
// ─────────────────────────────────────────────────────────

test.describe('Cookie-Banner', () => {

  test('1.1 Banner wird beim ersten Besuch angezeigt', async ({ page }) => {
    await clearCookieConsent(page);
    await page.goto('/');
    await expect(page.locator('#cookie-banner')).toBeVisible({ timeout: 5000 });
  });

  test('1.2 Banner enthält beide Buttons', async ({ page }) => {
    await clearCookieConsent(page);
    await page.goto('/');
    await expect(page.locator('.cookie-btn-all')).toBeVisible();
    await expect(page.locator('.cookie-btn-min')).toBeVisible();
    await expect(page.locator('.cookie-btn-all')).toContainText('Alle akzeptieren');
    await expect(page.locator('.cookie-btn-min')).toContainText('Nur notwendige');
  });

  test('1.3 „Alle akzeptieren" speichert Einwilligung und blendet Banner aus', async ({ page }) => {
    await clearCookieConsent(page);
    await page.goto('/');
    await page.locator('.cookie-btn-all').click();
    await expect(page.locator('#cookie-banner')).toBeHidden({ timeout: 3000 });
    const consent = await page.evaluate(() => localStorage.getItem('elimente_cookie_consent'));
    expect(consent).toBe('all');
  });

  test('1.4 „Nur notwendige" speichert Ablehnung und blendet Banner aus', async ({ page }) => {
    await clearCookieConsent(page);
    await page.goto('/');
    await page.locator('.cookie-btn-min').click();
    await expect(page.locator('#cookie-banner')).toBeHidden({ timeout: 3000 });
    const consent = await page.evaluate(() => localStorage.getItem('elimente_cookie_consent'));
    expect(consent).toBe('necessary');
  });

  test('1.5 Banner erscheint nach Akzeptieren nicht erneut', async ({ page }) => {
    // Frische Seite (kein addInitScript, damit localStorage beim 2. goto erhalten bleibt)
    await page.goto('/');
    await page.locator('.cookie-btn-all').click();
    await expect(page.locator('#cookie-banner')).toBeHidden({ timeout: 3000 });
    // Prüfen ob Cookie gesetzt ist
    const consent = await page.evaluate(() => localStorage.getItem('elimente_cookie_consent'));
    expect(consent).toBe('all');
    // Neue Navigation – addInitScript darf NICHT laufen (kein clearCookieConsent verwendet)
    // domcontentloaded statt load, damit externe Ressourcen (GA, Fonts) nicht blockieren
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    // Banner soll jetzt nicht mehr erscheinen
    await expect(page.locator('#cookie-banner')).toBeHidden({ timeout: 5000 });
  });

  test('1.6 Google Fonts werden nur nach Einwilligung geladen', async ({ page }) => {
    await clearCookieConsent(page);
    const fontRequests: string[] = [];
    page.on('request', req => {
      if (req.url().includes('fonts.googleapis.com')) fontRequests.push(req.url());
    });
    await page.goto('/');
    // Vor Einwilligung: keine Font-Anfragen
    await page.waitForTimeout(500);
    expect(fontRequests).toHaveLength(0);

    await page.locator('.cookie-btn-all').click();
    await page.waitForTimeout(1500);
    // Nach Einwilligung: Fonts werden geladen
    expect(fontRequests.length).toBeGreaterThan(0);
  });

  test('1.7 Google Analytics Script wird nicht vor Einwilligung geladen', async ({ page }) => {
    await clearCookieConsent(page);
    let analyticsLoaded = false;
    page.on('request', req => {
      if (req.url().includes('gtag') || req.url().includes('googletagmanager')) {
        analyticsLoaded = true;
      }
    });
    await page.goto('/');
    await page.waitForTimeout(1000);
    expect(analyticsLoaded).toBe(false);
  });

});
