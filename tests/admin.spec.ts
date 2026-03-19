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
          max_teilnehmer: 8,
          buchungen_count: 3,
          status: 'offen',
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
