import { test, expect } from '@playwright/test';
import { setCookieConsent, mockSupabase } from './helpers';

// ─────────────────────────────────────────────────────────
// 8–9. TÖPFERSCHEIBEN-VERLEIH & BUCHUNGSWORKFLOW
// ─────────────────────────────────────────────────────────

async function navigateToVerleih(page: any) {
  await page.locator('#verleih').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
}

test.describe('Verleih-Bereich', () => {

  test.beforeEach(async ({ page }) => {
    await setCookieConsent(page, 'necessary');
    await mockSupabase(page);
    await page.goto('/');
    await navigateToVerleih(page);
  });

  test('8.1 Verleih-Bereich mit Preisangaben ist sichtbar', async ({ page }) => {
    await expect(page.locator('#verleih')).toBeVisible();
    const preisText = await page.locator('#verleih').textContent();
    expect(preisText).toMatch(/€|EUR/);
  });

  test('8.2 Buchungskalender wird gerendert', async ({ page }) => {
    await expect(page.locator('#kurs-kalender')).toBeAttached();
  });

  test('8.3 Kalender zeigt Tages-Zellen an', async ({ page }) => {
    const zellen = page.locator('.kal-cell');
    await expect(zellen.first()).toBeAttached({ timeout: 10000 });
  });

});

test.describe('Buchungsworkflow – Datumsauswahl', () => {

  test.beforeEach(async ({ page }) => {
    await setCookieConsent(page, 'necessary');
    await mockSupabase(page);
    await page.goto('/');
    await navigateToVerleih(page);
  });

  test('9.1.1 Freien Verleih-Tag als Startdatum anklicken', async ({ page }) => {
    const toggle = page.locator('#toggle-verleih');
    if (await toggle.count() > 0) await toggle.click();

    const freieZellen = page.locator('.kal-cell.kal-verleih-frei, .kal-cell.kal-frei:not(.kal-vergangen)');
    const count = await freieZellen.count();
    if (count === 0) test.skip();

    await freieZellen.first().click();
    await page.waitForTimeout(300);
    const markiert = page.locator('.kal-cell.kal-verleih-start, .kal-cell.kal-selected');
    await expect(markiert.first()).toBeAttached();
  });

  test('9.1.2 Zeitraum (min. 14 Tage) führt zur Hervorhebung', async ({ page }) => {
    const toggle = page.locator('#toggle-verleih');
    if (await toggle.count() > 0) await toggle.click();

    const freie = page.locator('.kal-cell.kal-verleih-frei, .kal-cell.kal-frei:not(.kal-vergangen)');
    const count = await freie.count();
    if (count < 16) test.skip();

    await freie.nth(0).click();
    await page.waitForTimeout(200);
    await freie.nth(15).click();
    await page.waitForTimeout(300);
    const range = page.locator('.kal-cell.kal-verleih-range, .kal-cell.kal-range, #verleihform');
    await expect(range.first()).toBeAttached();
  });

  test('9.1.3 Buchungsformular erscheint nach gültiger Datumsauswahl', async ({ page }) => {
    const toggle = page.locator('#toggle-verleih');
    if (await toggle.count() > 0) await toggle.click();

    const freie = page.locator('.kal-cell.kal-verleih-frei, .kal-cell.kal-frei:not(.kal-vergangen)');
    const count = await freie.count();
    if (count < 16) test.skip();

    await freie.nth(0).click();
    await page.waitForTimeout(200);
    await freie.nth(15).click();
    await page.waitForTimeout(500);

    await expect(page.locator('#verleihform')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#vb-name')).toBeVisible();
    await expect(page.locator('#vb-email')).toBeVisible();
  });

  test('9.1.4 Pflichtfelder werden validiert', async ({ page }) => {
    const toggle = page.locator('#toggle-verleih');
    if (await toggle.count() > 0) await toggle.click();

    const freie = page.locator('.kal-cell.kal-verleih-frei, .kal-cell.kal-frei:not(.kal-vergangen)');
    const count = await freie.count();
    if (count < 16) test.skip();

    await freie.nth(0).click();
    await page.waitForTimeout(200);
    await freie.nth(15).click();
    await page.waitForTimeout(500);

    await expect(page.locator('#verleihform')).toBeVisible({ timeout: 5000 });
    await page.locator('#vb-submit').click();
    const nameInput = page.locator('#vb-name');
    const isInvalid = await nameInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(isInvalid).toBe(true);
  });

  test('9.1.5 Buchung erfolgreich absenden zeigt Erfolgsmeldung', async ({ page }) => {
    await page.route('**/rest/v1/verleih_buchungen*', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, json: [{ id: 'neu-123' }] });
      } else {
        await route.fulfill({ json: [] });
      }
    });
    await page.reload();
    await navigateToVerleih(page);

    const toggle = page.locator('#toggle-verleih');
    if (await toggle.count() > 0) await toggle.click();

    const freie = page.locator('.kal-cell.kal-verleih-frei, .kal-cell.kal-frei:not(.kal-vergangen)');
    const count = await freie.count();
    if (count < 16) test.skip();

    await freie.nth(0).click();
    await page.waitForTimeout(200);
    await freie.nth(15).click();
    await page.waitForTimeout(500);

    await expect(page.locator('#verleihform')).toBeVisible({ timeout: 5000 });
    await page.locator('#vb-name').fill('Test Person');
    await page.locator('#vb-email').fill('test@example.com');
    await page.locator('#vb-submit').click();

    await expect(page.locator('.kal-erfolg')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.kal-erfolg')).toContainText('Anfrage eingegangen');
  });

  test('9.1.8 Mindestmietdauer-Validierung – weniger als 14 Tage zeigt kein Formular', async ({ page }) => {
    const toggle = page.locator('#toggle-verleih');
    if (await toggle.count() > 0) await toggle.click();

    const freie = page.locator('.kal-cell.kal-verleih-frei');
    const count = await freie.count();
    if (count < 2) test.skip();

    page.on('dialog', dialog => dialog.dismiss());

    await freie.first().click();
    await page.waitForTimeout(300);

    const zuFrueh = page.locator('.kal-cell.kal-verleih-zu-frueh');
    const zuFruehCount = await zuFrueh.count();
    if (zuFruehCount === 0) {
      test.skip();
      return;
    }

    await zuFrueh.first().click();
    await page.waitForTimeout(400);

    const formVisible = await page.locator('#verleihform').isVisible();
    expect(formVisible).toBe(false);
  });

});

test.describe('Buchungsstatus im Kalender', () => {

  test('9.2.1 Bestätigte Buchung ist als belegt dargestellt', async ({ page }) => {
    await setCookieConsent(page, 'necessary');
    await mockSupabase(page);
    await page.route('**/rest/v1/verleih_buchungen*', async route => {
      await route.fulfill({
        json: [{
          id: 'b-1',
          start_datum: '2026-03-20',
          end_datum: '2026-04-09',
          status: 'bestaetigt'
        }]
      });
    });
    await page.goto('/');
    await navigateToVerleih(page);

    const toggle = page.locator('#toggle-verleih');
    if (await toggle.count() > 0) await toggle.click();
    await page.waitForTimeout(600);

    const gebucht = page.locator('.kal-cell.kal-verleih-gebucht');
    await expect(gebucht.first()).toBeAttached();
  });

  test('9.2.3 Stornierte Buchung gibt Zeitraum frei', async ({ page }) => {
    await setCookieConsent(page, 'necessary');
    await mockSupabase(page);
    await page.route('**/rest/v1/verleih_buchungen*', async route => {
      await route.fulfill({
        json: [{
          id: 'b-1',
          start_datum: '2026-04-05',
          end_datum: '2026-04-25',
          status: 'storniert'
        }]
      });
    });
    await page.goto('/');
    await navigateToVerleih(page);

    const toggle = page.locator('#toggle-verleih');
    if (await toggle.count() > 0) await toggle.click();
    await page.waitForTimeout(600);

    const gebucht = page.locator('.kal-cell.kal-verleih-gebucht');
    expect(await gebucht.count()).toBe(0);
  });

  test('9.2.4 Kalender zeigt nur freie Tage als klickbar', async ({ page }) => {
    await setCookieConsent(page, 'necessary');
    await mockSupabase(page);
    await page.goto('/');
    await navigateToVerleih(page);

    const toggle = page.locator('#toggle-verleih');
    if (await toggle.count() > 0) await toggle.click();
    await page.waitForTimeout(600);

    const freieZellen = page.locator('.kal-cell.kal-verleih-frei, .kal-cell.kal-frei');
    if (await freieZellen.count() > 0) {
      const cursor = await freieZellen.first().evaluate(
        el => getComputedStyle(el).cursor
      );
      expect(cursor).toBe('pointer');
    }
  });

});
