import { test, expect, Page } from '@playwright/test';
import { setCookieConsent, SUPABASE_MOCK_JS } from './helpers';

// ─────────────────────────────────────────────────────────
// 10. KURS-BUCHUNG & KALENDER-UPDATE
// Prüft: nach einer Buchung wird der Termin im Kalender
// als belegt (grau) markiert und die Kurs-Karte ausgegraut.
// ─────────────────────────────────────────────────────────

// Alle Routes für den Kurs-Test mocken
async function setupKursTest(page: Page, termine: object[]) {
  await setCookieConsent(page, 'necessary');
  await page.route('https://cdn.jsdelivr.net/**', async route => {
    await route.fulfill({ contentType: 'application/javascript', body: SUPABASE_MOCK_JS });
  });
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
  await page.addInitScript(() => {
    (window as any).SUPABASE_URL = window.location.origin;
    (window as any).SUPABASE_ANON_KEY = 'mock-key';
  });

  await page.route('**/rest/v1/kurs_termine*', async route => {
    await route.fulfill({ json: termine });
  });
  await page.route('**/rest/v1/kurs_typen*', async route => {
    await route.fulfill({
      json: [{ id: 'typ-1', name: 'Einführungskurs', aktiv: true, sort_order: 1, level: 'Anfänger', max_teilnehmer: 4 }]
    });
  });
  await page.route('**/rest/v1/site_texte*', async route => route.fulfill({ json: [] }));
  await page.route('**/rest/v1/galerie_bilder*', async route => route.fulfill({ json: [] }));
  await page.route('**/rest/v1/verleih_buchungen*', async route => route.fulfill({ json: [] }));
  await page.route('**/rest/v1/rpc/create_buchung*', async route => {
    await route.fulfill({ json: { success: true } });
  });
}

// Kalender zu April 2026 navigieren
async function navigiereZuApril2026(page: Page) {
  await page.locator('#kurse').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  for (let i = 0; i < 6; i++) {
    const header = await page.locator('.kal-monatstitel').textContent().catch(() => '');
    if (header?.includes('April 2026')) break;
    const vorBtn = page.locator('.kal-nav-btn').last();
    if (await vorBtn.count() === 0) break;
    await vorBtn.click();
    await page.waitForTimeout(200);
  }
}

// Termin mit freiem Platz: max=1, buchungen_count=0
const TERMIN_FAST_VOLL = [{
  id: 'termin-frei',
  datum: '2026-04-15',
  uhrzeit_start: '10:00:00',
  max_teilnehmer: 1,
  buchungen_count: 0,
  status: 'offen',
  notiz: null,
  kurs_typ_id: 'typ-1',
  kurs_typen: { id: 'typ-1', name: 'Einführungskurs' }
}];

// Termin voll: max=1, buchungen_count=1
const TERMIN_VOLL = [{
  id: 'termin-voll',
  datum: '2026-04-22',
  uhrzeit_start: '14:00:00',
  max_teilnehmer: 1,
  buchungen_count: 1,
  status: 'voll',
  notiz: null,
  kurs_typ_id: 'typ-1',
  kurs_typen: { id: 'typ-1', name: 'Einführungskurs' }
}];

// ─────────────────────────────────────────────────────────

test.describe('Kurs-Buchung – Kalender-Update', () => {

  test('10.1 Termin mit freien Plätzen zeigt grüne Markierung im Kalender', async ({ page }) => {
    await setupKursTest(page, TERMIN_FAST_VOLL);
    await page.goto('/');
    await navigiereZuApril2026(page);

    const freieZelle = page.locator('.kal-cell.kal-frei').first();
    await expect(freieZelle).toBeAttached({ timeout: 5000 });
  });

  test('10.2 Nach Buchung wird der Termin im Kalender grau (.kal-voll)', async ({ page }) => {
    await setupKursTest(page, TERMIN_FAST_VOLL);
    await page.goto('/');
    await navigiereZuApril2026(page);

    const freieZelle = page.locator('.kal-cell.kal-frei').first();
    if (await freieZelle.count() === 0) test.skip();

    await freieZelle.click();
    await page.waitForTimeout(500);

    // Termin-Karte anklicken → erst dann erscheint das Buchungsformular
    const terminKarte = page.locator('.kal-termin-karte').first();
    await expect(terminKarte).toBeVisible({ timeout: 3000 });
    await terminKarte.click();
    await page.waitForTimeout(300);

    await expect(page.locator('#buchform')).toBeVisible({ timeout: 5000 });
    await page.locator('#b-name').fill('Test Töpfer');
    await page.locator('#b-email').fill('test@example.com');
    await page.locator('#b-submit').click();

    // Erfolgsmeldung erscheint
    await expect(page.locator('.kal-erfolg')).toBeVisible({ timeout: 8000 });

    // Nach optimistischem Update: max_teilnehmer=1, buchungen_count wird 1 → .kal-voll
    await expect(page.locator('.kal-cell.kal-voll').first()).toBeAttached({ timeout: 3000 });
  });

  test('10.3 Voller Termin zeigt kein Buchungsformular beim Klicken', async ({ page }) => {
    await setupKursTest(page, TERMIN_VOLL);
    await page.goto('/');
    await navigiereZuApril2026(page);

    const volleZelle = page.locator('.kal-cell.kal-voll').first();
    if (await volleZelle.count() === 0) test.skip();

    await volleZelle.click();
    await page.waitForTimeout(500);

    const formVisible = await page.locator('#buchform').isVisible();
    expect(formVisible).toBe(false);
  });

  test('10.4 Volle Kurs-Karte ist grau hinterlegt (.kurs-item-voll)', async ({ page }) => {
    await setupKursTest(page, TERMIN_VOLL);
    await page.goto('/');
    await page.locator('#kurse').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    await expect(page.locator('.kurs-item-voll').first()).toBeAttached({ timeout: 5000 });
  });

  test('10.5 Kurs-Karte mit freien Plätzen ist klickbar (.kurs-item-klickbar)', async ({ page }) => {
    await setupKursTest(page, TERMIN_FAST_VOLL);
    await page.goto('/');
    await page.locator('#kurse').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    await expect(page.locator('.kurs-item-klickbar').first()).toBeAttached({ timeout: 5000 });
  });

});
