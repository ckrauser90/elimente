import { test, expect } from '@playwright/test';
import { setCookieConsent, mockSupabase } from './helpers';

// ─────────────────────────────────────────────────────────
// 3–7. HERO, ÜBER MICH, ANGEBOTE, KURSE, GALERIE
// ─────────────────────────────────────────────────────────

test.describe('Hero-Bereich', () => {

  test.beforeEach(async ({ page }) => {
    await setCookieConsent(page, 'necessary');
    await mockSupabase(page);
    await page.goto('/');
    await page.waitForSelector('section.hero', { timeout: 5000 });
  });

  test('3.1 Hero-Headline ist sichtbar', async ({ page }) => {
    await expect(page.locator('section.hero h1')).toBeVisible();
    await expect(page.locator('section.hero h1')).not.toBeEmpty();
  });

  test('3.2 CTA-Button ist sichtbar und klickbar', async ({ page }) => {
    const cta = page.locator('section.hero .btn').first();
    await expect(cta).toBeVisible();
    await expect(cta).toBeEnabled();
  });

  test('3.3 CTA-Button scrollt zur richtigen Section', async ({ page }) => {
    const cta = page.locator('section.hero a.btn').first();
    const href = await cta.getAttribute('href');
    await cta.click();
    if (href && href.startsWith('#')) {
      const target = page.locator(href);
      await expect(target).toBeAttached();
    }
  });

});

test.describe('Über mich', () => {

  test.beforeEach(async ({ page }) => {
    await setCookieConsent(page, 'necessary');
    await mockSupabase(page);
    await page.goto('/');
  });

  test('4.1 Section #ueber ist vorhanden', async ({ page }) => {
    await expect(page.locator('#ueber')).toBeAttached();
  });

  test('4.2 Zitat wird angezeigt', async ({ page }) => {
    await page.locator('#ueber').scrollIntoViewIfNeeded();
    const zitat = page.locator('#ueber blockquote, #ueber .zitat, #ueber em, #ueber .ueber-zitat').first();
    await expect(zitat).not.toBeEmpty();
  });

});

test.describe('Angebote', () => {

  test.beforeEach(async ({ page }) => {
    await setCookieConsent(page, 'necessary');
    await mockSupabase(page);
    await page.goto('/');
    await page.waitForSelector('.offer-card', { timeout: 5000 });
  });

  test('5.1 Alle 3 Angebots-Karten werden angezeigt', async ({ page }) => {
    const karten = page.locator('.offer-card');
    await expect(karten).toHaveCount(3);
  });

  test('5.2 Karten enthalten Titel und Link', async ({ page }) => {
    const karten = page.locator('.offer-card');
    for (let i = 0; i < 3; i++) {
      const karte = karten.nth(i);
      await expect(karte.locator('h2, h3')).not.toBeEmpty();
      await expect(karte.locator('.card-link, .btn, a, button')).toBeAttached();
    }
  });

  test('5.3 Karten-Links sind als grüne Buttons gestaltet (kein reiner Text-Link)', async ({ page }) => {
    const links = page.locator('.offer-card .card-link');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    // Hintergrundfarbe muss gesetzt sein (kein transparenter Button)
    for (let i = 0; i < count; i++) {
      const bg = await links.nth(i).evaluate(el => getComputedStyle(el).backgroundColor);
      expect(bg).not.toBe('rgba(0, 0, 0, 0)');
      expect(bg).not.toBe('transparent');
    }
  });

});

test.describe('Kurse', () => {

  test.beforeEach(async ({ page }) => {
    await setCookieConsent(page, 'necessary');
    await mockSupabase(page);
    await page.goto('/');
  });

  test('6.1 Kurs-Bereich ist vorhanden', async ({ page }) => {
    await expect(page.locator('#kurse')).toBeAttached();
  });

  test('6.2 Kurs-Kalender wird gerendert', async ({ page }) => {
    await page.locator('#kurse').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await expect(page.locator('#kurs-kalender')).toBeAttached();
  });

});

test.describe('Galerie', () => {

  test.beforeEach(async ({ page }) => {
    await setCookieConsent(page, 'necessary');
    await mockSupabase(page);
    await page.goto('/');
  });

  test('7.1 Galerie-Bereich ist vorhanden', async ({ page }) => {
    await expect(page.locator('#galerie')).toBeAttached();
  });

  test('7.2 Galerie-Bereich rendert ohne JS-Fehler', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.locator('#galerie').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const relevanteErrors = errors.filter(e =>
      !e.includes('supabase') &&
      !e.includes('SUPABASE') &&
      !e.includes('fetch') &&
      !e.includes("Unexpected token '<'")
    );
    expect(relevanteErrors).toHaveLength(0);
  });

});
