import { test, expect } from '@playwright/test';
import { setCookieConsent } from './helpers';

// ─────────────────────────────────────────────────────────
// 2. NAVIGATION
// ─────────────────────────────────────────────────────────

test.describe('Navigation', () => {

  test.beforeEach(async ({ page }) => {
    await setCookieConsent(page, 'necessary');
    await page.goto('/');
  });

  test('2.1 Desktop-Navigation zeigt alle Menüpunkte', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);
    await expect(page.locator('.nav-links a[href="#ueber"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.nav-links a[href="#kurse"]')).toBeVisible();
    await expect(page.locator('.nav-links a[href="#verleih"]')).toBeVisible();
    // #galerie wurde aus der Navigation entfernt (erscheint unterhalb des Footers)
  });

  test('2.2 Hamburger-Menü auf Mobilgeräten sichtbar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.locator('.hamburger')).toBeVisible();
    await expect(page.locator('.nav-links')).toBeHidden();
  });

  test('2.3 Hamburger-Menü öffnet Navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.locator('.hamburger').click();
    await expect(page.locator('.nav-links')).toBeVisible();
  });

  test('2.4 Klick auf Menüpunkt scrollt zur Section', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.locator('.nav-links a[href="#kurse"]').click();
    await expect(page.locator('#kurse')).toBeInViewport();
  });

  test('2.5 Mobilmenü schließt nach Klick auf Link', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.locator('.hamburger').click();
    await expect(page.locator('.nav-links')).toBeVisible();
    await page.locator('.nav-links a[href="#ueber"]').click();
    await expect(page.locator('#mainNav')).not.toHaveClass(/mobile-open/);
  });

  test('2.6 Logo ist sichtbar und zeigt den Website-Namen', async ({ page }) => {
    await expect(page.locator('#mainNav .logo')).toBeVisible();
    const logoText = await page.locator('#mainNav .logo').textContent();
    expect(logoText?.toLowerCase()).toContain('elimente');
  });

});
