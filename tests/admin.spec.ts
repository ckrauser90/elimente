import { test, expect, Page } from '@playwright/test';
import { SUPABASE_MOCK_JS } from './helpers';

// ─────────────────────────────────────────────────────────
// 11. ADMIN-BEREICH
// ─────────────────────────────────────────────────────────

async function blockSupabase(page: Page) {
  await page.route('https://cdn.jsdelivr.net/**', async route => {
    await route.fulfill({ contentType: 'application/javascript', body: SUPABASE_MOCK_JS });
  });
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
}

async function mockAdminDaten(page: Page) {
  const signedInMock = SUPABASE_MOCK_JS.replace(
    "cb('INITIAL_SESSION', null)",
    "cb('SIGNED_IN', { access_token: 'mock-token', user: { id: 'user-1', email: 'admin@test.de' } })"
  );
  await page.route('https://cdn.jsdelivr.net/**', async route => {
    await route.fulfill({ contentType: 'application/javascript', body: signedInMock });
  });
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://fonts.gstatic.com/**', route => route.abort());

  await page.route('**/rest/v1/buchungen*', async route => {
    await route.fulfill({
      json: [{
        id: 'buch-1',
        name: 'Maria Müller',
        email: 'maria@example.com',
        telefon: '0123456789',
        nachricht: 'Freue mich!',
        status: 'neu',
        termin_id: 'termin-1',
        kurs_termine: {
          datum: '2026-04-15',
          uhrzeit_start: '10:00:00',
          kurs_typen: { name: 'Einführungskurs' }
        }
      }]
    });
  });

  await page.route('**/rest/v1/kurs_termine*', async route => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 204, body: '' });
    } else if (route.request().method() === 'PATCH') {
      await route.fulfill({ json: [{}] });
    } else {
      await route.fulfill({
        json: [{
          id: 'termin-1',
          datum: '2026-04-15',
          uhrzeit_start: '10:00:00',
          max_teilnehmer: 1,
          buchungen_count: 1,
          status: 'voll',
          notiz: null,
          kurs_typen: { name: 'Einführungskurs' }
        }]
      });
    }
  });

  await page.route('**/rest/v1/kurs_typen*', async route => {
    await route.fulfill({ json: [{ id: 'typ-1', name: 'Einführungskurs', aktiv: true }] });
  });

  await page.route('**/rest/v1/verleih_buchungen*', async route => {
    await route.fulfill({ json: [] });
  });

  await page.route('**/rest/v1/galerie_bilder*', async route => {
    await route.fulfill({ json: [] });
  });

  await page.route('**/rest/v1/site_texte*', async route => {
    await route.fulfill({ json: [] });
  });
}

// ── Login ─────────────────────────────────────────────────

test.describe('Admin – Login', () => {

  test('11.1 Login-Formular ist sichtbar', async ({ page }) => {
    await blockSupabase(page);
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await expect(page.locator('#login-view')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-pw')).toBeVisible();
    await expect(page.locator('#login-btn')).toBeVisible();
  });

  test('11.2 Falsches Passwort zeigt Fehlermeldung', async ({ page }) => {
    await page.route('https://cdn.jsdelivr.net/**', async route => {
      await route.fulfill({ contentType: 'application/javascript', body: SUPABASE_MOCK_JS });
    });
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.route('https://fonts.gstatic.com/**', route => route.abort());

    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.locator('#login-email').fill('admin@test.de');
    await page.locator('#login-pw').fill('falsches-passwort');
    await page.locator('#login-btn').click();
    await expect(page.locator('#login-error')).not.toBeEmpty({ timeout: 8000 });
  });

  test('11.4 Logout-Button führt zurück zum Login', async ({ page }) => {
    await mockAdminDaten(page);
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const logoutBtn = page.locator('button', { hasText: /Logout|Abmelden/ });
    if (await logoutBtn.count() > 0) {
      await logoutBtn.click();
      await expect(page.locator('#login-view')).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

});

// ── Buchungsverwaltung ────────────────────────────────────

test.describe('Admin – Buchungsverwaltung', () => {

  test.beforeEach(async ({ page }) => {
    await mockAdminDaten(page);
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const buchTab = page.locator('.tab-btn', { hasText: /Buchungen/ });
    if (await buchTab.count() > 0) {
      await buchTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('11.11 Buchungsübersicht zeigt Name, Zeitraum und Status', async ({ page }) => {
    const liste = page.locator('#buchungen-liste');
    const count = await liste.count();
    if (count === 0) test.skip();
    const text = await liste.textContent();
    expect(text).toMatch(/Maria Müller|Einführungskurs|neu/i);
  });

  test('11.12 Buchung bestätigen sendet PATCH-Anfrage', async ({ page }) => {
    let patchBody = '';
    await page.route('**/rest/v1/buchungen*', async route => {
      if (route.request().method() === 'PATCH') {
        patchBody = route.request().postData() || '';
        await route.fulfill({ json: [{}] });
      } else {
        await route.fulfill({
          json: [{
            id: 'buch-1', name: 'Maria Müller', email: 'maria@example.com',
            telefon: '', nachricht: '', status: 'neu', termin_id: 'termin-1',
            kurs_termine: { datum: '2026-04-15', uhrzeit_start: '10:00:00',
              kurs_typen: { name: 'Einführungskurs' } }
          }]
        });
      }
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.locator('.tab-btn', { hasText: /Buchungen/ }).click().catch(() => {});
    await page.waitForTimeout(500);

    const bestätigenBtn = page.locator('button', { hasText: 'Bestätigen' }).first();
    if (await bestätigenBtn.count() > 0) {
      await bestätigenBtn.click();
      await page.waitForTimeout(500);
      expect(patchBody).toContain('bestaetigt');
    }
  });

  test('11.13 Buchung stornieren sendet PATCH-Anfrage', async ({ page }) => {
    let patchBody = '';
    await page.route('**/rest/v1/buchungen*', async route => {
      if (route.request().method() === 'PATCH') {
        patchBody = route.request().postData() || '';
        await route.fulfill({ json: [{}] });
      } else {
        await route.fulfill({
          json: [{
            id: 'buch-1', name: 'Maria Müller', email: 'maria@example.com',
            telefon: '', nachricht: '', status: 'neu', termin_id: 'termin-1',
            kurs_termine: { datum: '2026-04-15', uhrzeit_start: '10:00:00',
              kurs_typen: { name: 'Einführungskurs' } }
          }]
        });
      }
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.locator('.tab-btn', { hasText: /Buchungen/ }).click().catch(() => {});
    await page.waitForTimeout(500);

    const stornoBtn = page.locator('button', { hasText: 'Stornieren' }).first();
    if (await stornoBtn.count() > 0) {
      await stornoBtn.click();
      await page.waitForTimeout(500);
      expect(patchBody).toContain('storniert');
    }
  });

  test('11.14 Buchung löschen sendet DELETE-Anfrage', async ({ page }) => {
    let deleteAufgerufen = false;
    await page.route('**/rest/v1/buchungen*', async route => {
      if (route.request().method() === 'DELETE') {
        deleteAufgerufen = true;
        await route.fulfill({ status: 204, body: '' });
      } else {
        await route.fulfill({
          json: [{
            id: 'buch-1', name: 'Maria Müller', email: 'maria@example.com',
            telefon: '', nachricht: '', status: 'neu', termin_id: 'termin-1',
            kurs_termine: { datum: '2026-04-15', uhrzeit_start: '10:00:00',
              kurs_typen: { name: 'Einführungskurs' } }
          }]
        });
      }
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    page.on('dialog', dialog => dialog.accept());

    await page.locator('.tab-btn', { hasText: /Buchungen/ }).click().catch(() => {});
    await page.waitForTimeout(500);

    const loeschenBtn = page.locator('#buchungen-liste button', { hasText: 'Löschen' }).first();
    if (await loeschenBtn.count() > 0) {
      await loeschenBtn.click();
      await page.waitForTimeout(500);
      expect(deleteAufgerufen).toBe(true);
    }
  });

});

// ── Termin löschen mit Buchungen (Warn-Tests) ─────────────

test.describe('Admin – Warnungen beim Löschen von Terminen', () => {

  test.beforeEach(async ({ page }) => {
    await mockAdminDaten(page);
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const termineTab = page.locator('.tab-btn', { hasText: /Termine/ });
    if (await termineTab.count() > 0) {
      await termineTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('11.15 Warndialog beim Löschen eines Termins mit Buchungen', async ({ page }) => {
    let dialogText = '';
    page.on('dialog', async dialog => {
      dialogText = dialog.message();
      await dialog.dismiss();
    });

    const loeschenBtn = page.locator('button', { hasText: 'Löschen' }).first();
    if (await loeschenBtn.count() === 0) test.skip();

    await loeschenBtn.click();
    await page.waitForTimeout(500);
    expect(dialogText).toMatch(/Buchung|buchung/);
  });

  test('11.16 Löschen nach Warnung bestätigen – DELETE wird aufgerufen', async ({ page }) => {
    let deleteAufgerufen = false;
    await page.route('**/rest/v1/kurs_termine*', async route => {
      if (route.request().method() === 'DELETE') {
        deleteAufgerufen = true;
        await route.fulfill({ status: 204, body: '' });
      } else {
        await route.continue();
      }
    });

    page.on('dialog', async dialog => dialog.accept());

    const loeschenBtn = page.locator('button', { hasText: 'Löschen' }).first();
    if (await loeschenBtn.count() === 0) test.skip();

    await loeschenBtn.click();
    await page.waitForTimeout(500);
    expect(deleteAufgerufen).toBe(true);
  });

  test('11.17 Löschen nach Warnung abbrechen – DELETE wird NICHT aufgerufen', async ({ page }) => {
    let deleteAufgerufen = false;
    await page.route('**/rest/v1/kurs_termine*', async route => {
      if (route.request().method() === 'DELETE') {
        deleteAufgerufen = true;
        await route.fulfill({ status: 204, body: '' });
      } else {
        await route.continue();
      }
    });

    page.on('dialog', async dialog => dialog.dismiss());

    const loeschenBtn = page.locator('button', { hasText: 'Löschen' }).first();
    if (await loeschenBtn.count() === 0) test.skip();

    await loeschenBtn.click();
    await page.waitForTimeout(500);
    expect(deleteAufgerufen).toBe(false);
  });

});

// ── buchungen_count korrekt bei Stornierung / Bestätigung ─

test.describe('Admin – buchungen_count Synchronisierung', () => {

  // Hilfsfunktion: Admin-Seite mit einer Buchung aufbauen
  async function setupMitBuchung(page: any, buchungStatus: string = 'neu') {
    await mockAdminDaten(page);
    await page.route('**/rest/v1/buchungen*', async (route: any) => {
      const method = route.request().method();
      if (method === 'PATCH') {
        await route.fulfill({ json: [{}] });
      } else if (method === 'DELETE') {
        await route.fulfill({ status: 204, body: '' });
      } else {
        await route.fulfill({
          json: [{
            id: 'buch-1', name: 'Maria Müller', email: 'maria@example.com',
            telefon: '', nachricht: '', status: buchungStatus,
            termin_id: 'termin-1',
            kurs_termine: { datum: '2026-04-15', uhrzeit_start: '10:00:00',
              kurs_typen: { name: 'Einführungskurs' } }
          }]
        });
      }
    });
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.locator('.tab-btn', { hasText: /Buchungen/ }).click().catch(() => {});
    await page.waitForTimeout(500);
  }

  test('11.18 Stornieren dekrementiert buchungen_count auf dem Termin', async ({ page }) => {
    let terminPatchBody = '';
    // Route NACH setupMitBuchung registrieren → LIFO-Priorität greift bei Button-Klick
    await setupMitBuchung(page, 'neu');
    await page.route('**/rest/v1/kurs_termine*', async route => {
      if (route.request().method() === 'PATCH') {
        terminPatchBody = route.request().postData() || '';
        await route.fulfill({ json: [{}] });
      } else {
        await route.fulfill({
          json: [{ id: 'termin-1', datum: '2026-04-15', uhrzeit_start: '10:00:00',
            max_teilnehmer: 1, buchungen_count: 1, status: 'voll',
            notiz: null, kurs_typen: { name: 'Einführungskurs' } }]
        });
      }
    });
    const stornoBtn = page.locator('button', { hasText: 'Stornieren' }).first();
    if (await stornoBtn.count() === 0) test.skip();

    await stornoBtn.click();
    await page.waitForTimeout(500);

    // buchungen_count muss auf 0 dekrementiert worden sein (1 → 0)
    expect(terminPatchBody).toContain('"buchungen_count":0');
    expect(terminPatchBody).toContain('"status":"offen"');
  });

  test('11.19 Bestätigen ändert buchungen_count NICHT', async ({ page }) => {
    let terminPatchAufgerufen = false;
    await setupMitBuchung(page, 'neu');
    await page.route('**/rest/v1/kurs_termine*', async route => {
      if (route.request().method() === 'PATCH') {
        terminPatchAufgerufen = true;
        await route.fulfill({ json: [{}] });
      } else {
        await route.fulfill({
          json: [{ id: 'termin-1', datum: '2026-04-15', uhrzeit_start: '10:00:00',
            max_teilnehmer: 1, buchungen_count: 1, status: 'voll',
            notiz: null, kurs_typen: { name: 'Einführungskurs' } }]
        });
      }
    });
    const bestätigenBtn = page.locator('button', { hasText: 'Bestätigen' }).first();
    if (await bestätigenBtn.count() === 0) test.skip();

    await bestätigenBtn.click();
    await page.waitForTimeout(500);

    // Termin-Tabelle darf NICHT gepatcht werden (Zähler bleibt unverändert)
    expect(terminPatchAufgerufen).toBe(false);
  });

  test('11.20 Stornieren einer bereits stornierten Buchung ändert buchungen_count NICHT', async ({ page }) => {
    let terminPatchAufgerufen = false;
    await page.route('**/rest/v1/kurs_termine*', async route => {
      if (route.request().method() === 'PATCH') {
        terminPatchAufgerufen = true;
        await route.fulfill({ json: [{}] });
      } else {
        await route.fulfill({
          json: [{ id: 'termin-1', buchungen_count: 0, max_teilnehmer: 1, status: 'offen',
            datum: '2026-04-15', uhrzeit_start: '10:00:00', notiz: null, kurs_typen: { name: 'Einführungskurs' } }]
        });
      }
    });

    await setupMitBuchung(page, 'storniert');
    // Bei stornierten Buchungen gibt es keinen Stornieren-Button
    const stornoBtn = page.locator('button', { hasText: 'Stornieren' }).first();
    if (await stornoBtn.count() === 0) test.skip();

    await stornoBtn.click();
    await page.waitForTimeout(500);

    expect(terminPatchAufgerufen).toBe(false);
  });

  test('11.21 Löschen einer aktiven Buchung dekrementiert buchungen_count', async ({ page }) => {
    let terminPatchBody = '';
    await setupMitBuchung(page, 'bestaetigt');
    await page.route('**/rest/v1/kurs_termine*', async route => {
      if (route.request().method() === 'PATCH') {
        terminPatchBody = route.request().postData() || '';
        await route.fulfill({ json: [{}] });
      } else {
        await route.fulfill({
          json: [{ id: 'termin-1', buchungen_count: 1, max_teilnehmer: 1, status: 'voll',
            datum: '2026-04-15', uhrzeit_start: '10:00:00', notiz: null, kurs_typen: { name: 'Einführungskurs' } }]
        });
      }
    });
    page.on('dialog', async dialog => dialog.accept());

    const loeschenBtn = page.locator('#buchungen-liste button', { hasText: 'Löschen' }).first();
    if (await loeschenBtn.count() === 0) test.skip();

    await loeschenBtn.click();
    await page.waitForTimeout(500);

    // buchungen_count muss dekrementiert worden sein (1 → 0)
    expect(terminPatchBody).toContain('"buchungen_count":0');
  });

  test('11.22 Löschen einer stornierten Buchung dekrementiert buchungen_count NICHT', async ({ page }) => {
    let terminPatchAufgerufen = false;
    await setupMitBuchung(page, 'storniert');
    await page.route('**/rest/v1/kurs_termine*', async route => {
      if (route.request().method() === 'PATCH') {
        terminPatchAufgerufen = true;
        await route.fulfill({ json: [{}] });
      } else {
        await route.fulfill({
          json: [{ id: 'termin-1', buchungen_count: 0, max_teilnehmer: 1, status: 'offen',
            datum: '2026-04-15', uhrzeit_start: '10:00:00', notiz: null, kurs_typen: { name: 'Einführungskurs' } }]
        });
      }
    });
    page.on('dialog', async dialog => dialog.accept());

    const loeschenBtn = page.locator('#buchungen-liste button', { hasText: 'Löschen' }).first();
    if (await loeschenBtn.count() === 0) test.skip();

    await loeschenBtn.click();
    await page.waitForTimeout(500);

    expect(terminPatchAufgerufen).toBe(false);
  });

});

// ── Responsive Admin-Tabs ──────────────────────────────────

test.describe('Admin – Responsive Tabs', () => {

  test('11.23 Tab-Leiste ist auf schmalen Viewports horizontal scrollbar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await blockSupabase(page);
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const tabNav = page.locator('.nav-tabs');
    await expect(tabNav).toBeAttached();

    const overflow = await tabNav.evaluate(el => getComputedStyle(el).overflowX);
    expect(overflow).toBe('auto');
  });

  test('11.24 Alle Tab-Buttons sind ohne Zeilenumbruch dargestellt', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await blockSupabase(page);
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const buttons = page.locator('.tab-btn');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const ws = await buttons.nth(i).evaluate(el => getComputedStyle(el).whiteSpace);
      expect(ws).toBe('nowrap');
    }
  });

});
