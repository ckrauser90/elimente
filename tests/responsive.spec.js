// @ts-check
import { test, expect } from '@playwright/test';

// ──────────────────────────────────────────────────────────
// 1. NAVIGATION & HAMBURGER-MENÜ
// ──────────────────────────────────────────────────────────

test('Desktop: normale Nav sichtbar, kein Hamburger', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await expect(page.locator('.nav-links')).toBeVisible();
  await expect(page.locator('.hamburger')).toBeHidden();
});

test('iPad Portrait (768px): Hamburger sichtbar, Nav versteckt', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/');
  await expect(page.locator('.hamburger')).toBeVisible();
  await expect(page.locator('.nav-links')).toBeHidden();
});

test('iPad Portrait (768px): Hamburger öffnet Menü', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/');
  await page.click('.hamburger');
  await expect(page.locator('.nav-links')).toBeVisible();
});

test('Kein Nav-Link bricht auf zwei Zeilen um', async ({ page }) => {
  // Testet alle Breakpoints, bei denen die Nav sichtbar ist
  for (const width of [1280, 1024, 960]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');

    const links = page.locator('.nav-links li a');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const box = await links.nth(i).boundingBox();
      // Jeder Link darf maximal ~22px hoch sein (eine Zeile)
      expect(box?.height, `Link ${i} bricht bei ${width}px um`).toBeLessThan(28);
    }
  }
});

// ──────────────────────────────────────────────────────────
// 2. HERO BUTTONS
// ──────────────────────────────────────────────────────────

test('iPad Landscape (1024px): alle 3 Hero-Buttons auf einer Zeile', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/');

  const buttons = page.locator('.hero-actions .btn');
  await expect(buttons).toHaveCount(3);

  const boxes = await Promise.all(
    Array.from({ length: 3 }, (_, i) => buttons.nth(i).boundingBox())
  );

  // Alle drei müssen auf derselben Y-Position liegen (±15px Toleranz)
  const topValues = boxes.map(b => b?.y ?? 0);
  const diff = Math.max(...topValues) - Math.min(...topValues);
  expect(diff, 'Buttons sind nicht auf einer Linie').toBeLessThan(15);
});

test('Desktop: alle 3 Hero-Buttons auf einer Zeile', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');

  const buttons = page.locator('.hero-actions .btn');
  await expect(buttons).toHaveCount(3);

  const boxes = await Promise.all(
    Array.from({ length: 3 }, (_, i) => buttons.nth(i).boundingBox())
  );
  const topValues = boxes.map(b => b?.y ?? 0);
  const diff = Math.max(...topValues) - Math.min(...topValues);
  expect(diff, 'Buttons sind nicht auf einer Linie').toBeLessThan(15);
});

// ──────────────────────────────────────────────────────────
// 3. SEKTIONSFARBEN – keine zwei gleichen hintereinander
// ──────────────────────────────────────────────────────────

test('Sektionsfarben wechseln sich strikt ab', async ({ page }) => {
  await page.goto('/');

  const sectionIds = ['ueber', 'angebote', 'kurse', 'galerie', 'shop', 'verleih', 'standort'];
  const colors = [];

  for (const id of sectionIds) {
    const color = await page.locator(`#${id}`).evaluate(
      el => getComputedStyle(el).backgroundColor
    );
    colors.push({ id, color });
  }

  for (let i = 1; i < colors.length; i++) {
    expect(
      colors[i].color,
      `#${colors[i].id} hat die gleiche Hintergrundfarbe wie #${colors[i - 1].id}`
    ).not.toBe(colors[i - 1].color);
  }
});

// ──────────────────────────────────────────────────────────
// 4. ALLGEMEINE SMOKE-TESTS
// ──────────────────────────────────────────────────────────

test('Seite lädt ohne JS-Fehler', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');
  // Kurz warten, bis alle Scripts gelaufen sind
  await page.waitForTimeout(1000);

  expect(errors, `JS-Fehler: ${errors.join(', ')}`).toHaveLength(0);
});

test('Alle Hauptsektionen sind vorhanden', async ({ page }) => {
  await page.goto('/');
  for (const id of ['ueber', 'angebote', 'kurse', 'galerie', 'shop', 'verleih', 'standort']) {
    await expect(page.locator(`#${id}`), `#${id} fehlt`).toBeAttached();
  }
});

test('Footer-Links (Impressum, Datenschutz, AGB) vorhanden', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('footer a[href="impressum.html"]')).toBeVisible();
  await expect(page.locator('footer a[href="datenschutz.html"]')).toBeVisible();
  await expect(page.locator('footer a[href="agb.html"]')).toBeVisible();
});
