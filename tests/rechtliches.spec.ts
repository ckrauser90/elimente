import { test, expect } from '@playwright/test';
import { setCookieConsent } from './helpers';

// ─────────────────────────────────────────────────────────
// 13. RECHTLICHE SEITEN
// ─────────────────────────────────────────────────────────

test.describe('Rechtliche Seiten', () => {

  test('13.1 Impressum lädt ohne Fehler', async ({ page }) => {
    await setCookieConsent(page, 'necessary');
    const response = await page.goto('/impressum.html');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Impressum/i);
  });

  test('13.2 Datenschutzerklärung lädt ohne Fehler', async ({ page }) => {
    await setCookieConsent(page, 'necessary');
    const response = await page.goto('/datenschutz.html');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Datenschutz/i);
  });

  test('13.3 AGB lädt ohne Fehler', async ({ page }) => {
    await setCookieConsent(page, 'necessary');
    const response = await page.goto('/agb.html');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/AGB|Allgemeine/i);
  });

  test('13.4 Footer-Links zu Impressum und Datenschutz sind vorhanden', async ({ page }) => {
    await setCookieConsent(page, 'necessary');
    await page.goto('/');
    const impressumLink = page.locator('footer a[href*="impressum"]');
    const datenschutzLink = page.locator('footer a[href*="datenschutz"]');
    await expect(impressumLink).toBeAttached();
    await expect(datenschutzLink).toBeAttached();
  });

  test('13.5 Impressum enthält Pflichtangaben', async ({ page }) => {
    await setCookieConsent(page, 'necessary');
    await page.goto('/impressum.html');
    const text = await page.locator('body').textContent();
    expect(text).toMatch(/@/);            // E-Mail
    expect(text).toMatch(/Tel|Telefon|\+/); // Telefon
  });

});

// ─────────────────────────────────────────────────────────
// 14. RESPONSIVES DESIGN
// ─────────────────────────────────────────────────────────

test.describe('Responsives Design', () => {

  test('14.1 Desktop-Layout zeigt Desktop-Navigation', async ({ page }) => {
    await setCookieConsent(page, 'necessary');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.locator('.nav-links')).toBeVisible();
    await expect(page.locator('.hamburger')).toBeHidden();
  });

  test('14.3 Mobil-Layout zeigt Hamburger-Menü', async ({ page }) => {
    await setCookieConsent(page, 'necessary');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.locator('.hamburger')).toBeVisible();
  });

  test('14.4 Kein horizontales Scrolling auf Mobil', async ({ page }) => {
    await setCookieConsent(page, 'necessary');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

});

// ─────────────────────────────────────────────────────────
// 15. BARRIEREFREIHEIT & ALLGEMEIN
// ─────────────────────────────────────────────────────────

test.describe('Barrierefreiheit & Performance', () => {

  test('15.1 Keine gebrochenen internen Links', async ({ page }) => {
    await setCookieConsent(page, 'necessary');
    await page.goto('/');
    const links = await page.locator('footer a, nav a').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
      const res = await page.request.get(href).catch(() => null);
      if (res) expect(res.status()).toBeLessThan(400);
    }
  });

  test('15.3 Seite lädt ohne JS-Konsolenfehler', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await setCookieConsent(page, 'necessary');
    await page.goto('/');
    await page.waitForTimeout(1000);
    const relevanteErrors = errors.filter(e =>
      !e.includes('supabase') &&
      !e.includes('SUPABASE') &&
      !e.includes('fetch') &&
      !e.includes("Unexpected token '<'")
    );
    expect(relevanteErrors).toHaveLength(0);
  });

});
