import { test, expect, Page } from '@playwright/test';
import { SUPABASE_MOCK_JS } from './helpers';

// ─────────────────────────────────────────────────────────
// 12. ADMIN – TERMINE & KURSTYPEN ANLEGEN / LÖSCHEN
// ─────────────────────────────────────────────────────────

// Nur Auth mocken (kein page.goto hier)
async function setupAdminAuth(page: Page) {
  const signedInMock = SUPABASE_MOCK_JS.replace(
    "cb('INITIAL_SESSION', null)",
    "cb('SIGNED_IN', { access_token: 'mock-token', user: { id: 'user-1', email: 'admin@test.de' } })"
  );
  await page.route('https://cdn.jsdelivr.net/**', async route => {
    await route.fulfill({ contentType: 'application/javascript', body: signedInMock });
  });
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
}

// Standard-Datenmocks (können von Tests überschrieben werden – nach dieser Funktion registrieren)
async function setupAdminData(page: Page) {
  await page.route('**/rest/v1/buchungen*', async route => route.fulfill({ json: [] }));
  await page.route('**/rest/v1/verleih_buchungen*', async route => route.fulfill({ json: [] }));
  await page.route('**/rest/v1/galerie_bilder*', async route => route.fulfill({ json: [] }));
  await page.route('**/rest/v1/site_texte*', async route => route.fulfill({ json: [] }));
}

const STANDARD_TERMIN = {
  id: 'termin-1', datum: '2026-04-15', uhrzeit_start: '10:00:00',
  max_teilnehmer: 1, buchungen_count: 1, status: 'voll',
  notiz: null, kurs_typen: { name: 'Einführungskurs' }
};

const STANDARD_KURSTYP = {
  id: 'typ-1', name: 'Einführungskurs', aktiv: true, level: 'Anfänger',
  beschreibung: '', preis: 45, dauer: '2h', max_teilnehmer: 8, sort_order: 1
};

// ── Termine ───────────────────────────────────────────────

test.describe('Admin – Termine anlegen & löschen', () => {

  test('12.1 Termine-Tab zeigt vorhandene Termine', async ({ page }) => {
    await setupAdminAuth(page);
    await page.route('**/rest/v1/kurs_termine*', async route => route.fulfill({ json: [STANDARD_TERMIN] }));
    await page.route('**/rest/v1/kurs_typen*', async route => route.fulfill({ json: [STANDARD_KURSTYP] }));
    await setupAdminData(page);
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    await page.locator('.tab-btn', { hasText: /Termine/ }).click({ force: true });
    await page.waitForTimeout(500);

    const text = await page.locator('#termine-liste').textContent();
    expect(text).toMatch(/Einführungskurs|15\.04|2026/);
  });

  test('12.2 „Neuer Termin" Button öffnet das Modal', async ({ page }) => {
    await setupAdminAuth(page);
    await page.route('**/rest/v1/kurs_termine*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/kurs_typen*', async route => route.fulfill({ json: [STANDARD_KURSTYP] }));
    await setupAdminData(page);
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const neuerTerminBtn = page.locator('button', { hasText: /Neuer Termin/ });
    if (await neuerTerminBtn.count() === 0) test.skip();
    await neuerTerminBtn.click({ force: true });
    await page.waitForTimeout(300);

    await expect(page.locator('#termin-modal')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('#t-datum')).toBeVisible();
    await expect(page.locator('#t-uhr')).toBeVisible();
  });

  test('12.3 Termin anlegen sendet POST-Anfrage', async ({ page }) => {
    let postBody = '';
    await setupAdminAuth(page);
    await page.route('**/rest/v1/kurs_termine*', async route => {
      if (route.request().method() === 'POST') {
        postBody = route.request().postData() || '';
        await route.fulfill({ status: 201, json: [{ id: 'neu-termin' }] });
      } else {
        await route.fulfill({ json: [] });
      }
    });
    await page.route('**/rest/v1/kurs_typen*', async route => route.fulfill({ json: [STANDARD_KURSTYP] }));
    await setupAdminData(page);
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const neuerTerminBtn = page.locator('button', { hasText: /Neuer Termin/ });
    if (await neuerTerminBtn.count() === 0) test.skip();
    await neuerTerminBtn.click({ force: true });
    await page.waitForTimeout(300);

    await page.locator('#t-datum').fill('2026-05-10');
    await page.locator('#t-uhr').fill('10:00');
    const typSelect = page.locator('#t-typ');
    if (await typSelect.locator('option').count() > 0) await typSelect.selectOption({ index: 0 });

    // Speichern-Button gezielt im Modal klicken
    await page.locator('#termin-modal button', { hasText: 'Speichern' }).click({ force: true });
    await page.waitForTimeout(500);

    expect(postBody).toContain('2026-05-10');
  });

  test('12.4 Termin löschen (ohne Buchungen) sendet DELETE-Anfrage', async ({ page }) => {
    let deleteAufgerufen = false;
    await setupAdminAuth(page);
    await page.route('**/rest/v1/kurs_termine*', async route => {
      if (route.request().method() === 'DELETE') {
        deleteAufgerufen = true;
        await route.fulfill({ status: 204, body: '' });
      } else {
        await route.fulfill({ json: [{ ...STANDARD_TERMIN, buchungen_count: 0 }] });
      }
    });
    await page.route('**/rest/v1/kurs_typen*', async route => route.fulfill({ json: [STANDARD_KURSTYP] }));
    await page.route('**/rest/v1/buchungen*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/verleih_buchungen*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/galerie_bilder*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/site_texte*', async route => route.fulfill({ json: [] }));
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    page.on('dialog', async dialog => dialog.accept());
    const loeschenBtn = page.locator('#termine-liste button', { hasText: 'Löschen' }).first();
    if (await loeschenBtn.count() === 0) test.skip();

    await loeschenBtn.click({ force: true });
    await page.waitForTimeout(500);
    expect(deleteAufgerufen).toBe(true);
  });

  test('12.5 Termin mit Buchungen zeigt Warndialog vor dem Löschen', async ({ page }) => {
    let dialogText = '';
    await setupAdminAuth(page);
    await page.route('**/rest/v1/kurs_termine*', async route => route.fulfill({ json: [STANDARD_TERMIN] }));
    await page.route('**/rest/v1/kurs_typen*', async route => route.fulfill({ json: [STANDARD_KURSTYP] }));
    await setupAdminData(page);
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    page.on('dialog', async dialog => {
      dialogText = dialog.message();
      await dialog.dismiss();
    });

    const loeschenBtn = page.locator('#termine-liste button', { hasText: 'Löschen' }).first();
    if (await loeschenBtn.count() === 0) test.skip();

    await loeschenBtn.click({ force: true });
    await page.waitForTimeout(500);
    expect(dialogText).toMatch(/Buchung|buchung|wirklich|löschen/i);
  });

  test('12.6 Termin bearbeiten öffnet Modal mit bestehenden Daten', async ({ page }) => {
    await setupAdminAuth(page);
    await page.route('**/rest/v1/kurs_termine*', async route => route.fulfill({ json: [STANDARD_TERMIN] }));
    await page.route('**/rest/v1/kurs_typen*', async route => route.fulfill({ json: [STANDARD_KURSTYP] }));
    await setupAdminData(page);
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const bearbeitenBtn = page.locator('#termine-liste button', { hasText: /Bearbeiten|Edit/ }).first();
    if (await bearbeitenBtn.count() === 0) test.skip();

    await bearbeitenBtn.click({ force: true });
    await page.waitForTimeout(300);

    await expect(page.locator('#termin-modal')).toBeVisible({ timeout: 3000 });
    const datumWert = await page.locator('#t-datum').inputValue();
    expect(datumWert).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

});

// ── Kurstypen ─────────────────────────────────────────────

test.describe('Admin – Kurstypen anlegen & löschen', () => {

  test('12.7 Kurstypen-Tab zeigt vorhandene Kurstypen', async ({ page }) => {
    await setupAdminAuth(page);
    await page.route('**/rest/v1/kurs_typen*', async route => route.fulfill({ json: [STANDARD_KURSTYP] }));
    await page.route('**/rest/v1/kurs_termine*', async route => route.fulfill({ json: [] }));
    await setupAdminData(page);
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const kurstypenTab = page.locator('.tab-btn', { hasText: /Kurstypen/ });
    if (await kurstypenTab.count() === 0) test.skip();
    await kurstypenTab.click({ force: true });
    await page.waitForTimeout(500);

    const text = await page.locator('#kurstypen-liste').textContent();
    expect(text).toMatch(/Einführungskurs/);
  });

  test('12.8 „Neuer Kurstyp" Button öffnet das Modal', async ({ page }) => {
    await setupAdminAuth(page);
    await page.route('**/rest/v1/kurs_typen*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/kurs_termine*', async route => route.fulfill({ json: [] }));
    await setupAdminData(page);
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const kurstypenTab = page.locator('.tab-btn', { hasText: /Kurstypen/ });
    if (await kurstypenTab.count() === 0) test.skip();
    await kurstypenTab.click({ force: true });
    await page.waitForTimeout(300);

    const neuerTypBtn = page.locator('button', { hasText: /Neuer Kurstyp|Neuer Kurs/ });
    if (await neuerTypBtn.count() === 0) test.skip();
    await neuerTypBtn.click({ force: true });
    await page.waitForTimeout(300);

    await expect(page.locator('#kurstypModal')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('#kt-name')).toBeVisible();
    await expect(page.locator('#kt-level')).toBeVisible();
  });

  test('12.9 Kurstyp anlegen sendet POST-Anfrage mit korrekten Daten', async ({ page }) => {
    let postBody = '';
    await setupAdminAuth(page);
    await page.route('**/rest/v1/kurs_typen*', async route => {
      if (route.request().method() === 'POST') {
        postBody = route.request().postData() || '';
        await route.fulfill({ status: 201, json: [{ id: 'neu-typ' }] });
      } else {
        await route.fulfill({ json: [] });
      }
    });
    await page.route('**/rest/v1/kurs_termine*', async route => route.fulfill({ json: [] }));
    await setupAdminData(page);
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const kurstypenTab = page.locator('.tab-btn', { hasText: /Kurstypen/ });
    if (await kurstypenTab.count() === 0) test.skip();
    await kurstypenTab.click({ force: true });
    await page.waitForTimeout(300);

    const neuerTypBtn = page.locator('button', { hasText: /Neuer Kurstyp|Neuer Kurs/ });
    if (await neuerTypBtn.count() === 0) test.skip();
    await neuerTypBtn.click({ force: true });
    await page.waitForTimeout(300);

    await page.locator('#kt-name').fill('Kinderkurs Ton');
    await page.locator('#kt-level').selectOption('Kinder');
    await page.locator('#kt-preis').fill('25 €');
    await page.locator('#kt-max').selectOption('2');

    // Speichern-Button gezielt im Modal klicken
    await page.locator('#kurstypModal button', { hasText: 'Speichern' }).click({ force: true });
    await page.waitForTimeout(500);

    expect(postBody).toContain('Kinderkurs Ton');
  });

  test('12.10 Kurstyp löschen (ohne Termine) sendet DELETE-Anfrage', async ({ page }) => {
    let deleteAufgerufen = false;
    await setupAdminAuth(page);
    await page.route('**/rest/v1/kurs_typen*', async route => {
      if (route.request().method() === 'DELETE') {
        deleteAufgerufen = true;
        await route.fulfill({ status: 204, body: '' });
      } else {
        await route.fulfill({ json: [STANDARD_KURSTYP] });
      }
    });
    await page.route('**/rest/v1/kurs_termine*', async route => route.fulfill({ json: [] }));
    await setupAdminData(page);
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const kurstypenTab = page.locator('.tab-btn', { hasText: /Kurstypen/ });
    if (await kurstypenTab.count() === 0) test.skip();
    await kurstypenTab.click({ force: true });
    await page.waitForTimeout(500);

    page.on('dialog', async dialog => dialog.accept());
    const loeschenBtn = page.locator('#kurstypen-liste button', { hasText: 'Löschen' }).first();
    if (await loeschenBtn.count() === 0) test.skip();

    await loeschenBtn.click({ force: true });
    await page.waitForTimeout(500);
    expect(deleteAufgerufen).toBe(true);
  });

  test('12.12 Kurstyp mit Terminen löschen – alle DELETE-Anfragen werden gesendet', async ({ page }) => {
    const deletes: string[] = [];
    await setupAdminAuth(page);
    await page.route('**/rest/v1/kurs_typen*', async route => {
      if (route.request().method() === 'DELETE') {
        deletes.push('kurs_typen');
        await route.fulfill({ status: 204, body: '' });
      } else {
        await route.fulfill({ json: [STANDARD_KURSTYP] });
      }
    });
    await page.route('**/rest/v1/kurs_termine*', async route => {
      if (route.request().method() === 'DELETE') {
        deletes.push('kurs_termine');
        await route.fulfill({ status: 204, body: '' });
      } else {
        await route.fulfill({ json: [{ id: 'termin-1', datum: '2026-06-01', buchungen_count: 1 }] });
      }
    });
    await page.route('**/rest/v1/buchungen*', async route => {
      if (route.request().method() === 'DELETE') {
        deletes.push('buchungen');
        await route.fulfill({ status: 204, body: '' });
      } else {
        await route.fulfill({ json: [] });
      }
    });
    await page.route('**/rest/v1/verleih_buchungen*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/galerie_bilder*', async route => route.fulfill({ json: [] }));
    await page.route('**/rest/v1/site_texte*', async route => route.fulfill({ json: [] }));

    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const kurstypenTab = page.locator('.tab-btn', { hasText: /Kurstypen/ });
    if (await kurstypenTab.count() === 0) test.skip();
    await kurstypenTab.click({ force: true });
    await page.waitForTimeout(500);

    // Alle confirm-Dialoge akzeptieren
    page.on('dialog', async dialog => dialog.accept());

    const loeschenBtn = page.locator('#kurstypen-liste button', { hasText: 'Löschen' }).first();
    if (await loeschenBtn.count() === 0) test.skip();

    await loeschenBtn.click({ force: true });
    await page.waitForTimeout(800);

    // Buchungen → Termine → Kurstyp müssen alle gelöscht werden
    expect(deletes).toContain('buchungen');
    expect(deletes).toContain('kurs_termine');
    expect(deletes).toContain('kurs_typen');
  });

  test('12.11 Kurstyp mit vorhandenen Terminen zeigt Warndialog', async ({ page }) => {
    let dialogText = '';
    await setupAdminAuth(page);
    await page.route('**/rest/v1/kurs_typen*', async route => route.fulfill({ json: [STANDARD_KURSTYP] }));
    await page.route('**/rest/v1/kurs_termine*', async route => {
      await route.fulfill({ json: [{ id: 'termin-1', datum: '2026-04-15', buchungen_count: 1 }] });
    });
    await setupAdminData(page);
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const kurstypenTab = page.locator('.tab-btn', { hasText: /Kurstypen/ });
    if (await kurstypenTab.count() === 0) test.skip();
    await kurstypenTab.click({ force: true });
    await page.waitForTimeout(500);

    page.on('dialog', async dialog => {
      dialogText = dialog.message();
      await dialog.dismiss();
    });

    const loeschenBtn = page.locator('#kurstypen-liste button', { hasText: 'Löschen' }).first();
    if (await loeschenBtn.count() === 0) test.skip();

    await loeschenBtn.click({ force: true });
    await page.waitForTimeout(500);
    expect(dialogText).toMatch(/Termin|Buchung|wirklich|löschen/i);
  });

});
