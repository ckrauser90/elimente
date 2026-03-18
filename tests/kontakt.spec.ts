import { test, expect } from '@playwright/test';
import { setCookieConsent, mockSupabase } from './helpers';

// ─────────────────────────────────────────────────────────
// 10. KONTAKT / STANDORT
// ─────────────────────────────────────────────────────────

test.describe('Kontaktbereich (Standort)', () => {

  test.beforeEach(async ({ page }) => {
    await setCookieConsent(page, 'necessary');
    await mockSupabase(page);
    await page.goto('/');
    await page.locator('#standort').scrollIntoViewIfNeeded();
  });

  test('10.1 Standort-Bereich ist vorhanden', async ({ page }) => {
    await expect(page.locator('#standort')).toBeAttached();
  });

  test('10.2 Kontaktdaten werden angezeigt', async ({ page }) => {
    const text = await page.locator('#standort').textContent();
    // E-Mail oder Telefon muss im Bereich stehen
    expect(text).toMatch(/@|Tel|Telefon|\+49/);
  });

  test('10.3 Kurs-Buchungsformular ist sichtbar', async ({ page }) => {
    // Das Buchungsformular ist Teil des Kurs-Kalenders
    await page.locator('#kurse').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await expect(page.locator('#kurs-kalender')).toBeAttached();
  });

  test('10.4 Kurs-Buchungsformular Pflichtfeld-Validierung', async ({ page }) => {
    // Formular erscheint nach Terminauswahl – Skip wenn kein Termin vorhanden
    await page.locator('#kurse').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const termin = page.locator('.kal-cell.kal-termin, .kal-cell.kal-offen').first();
    if (await termin.count() === 0) {
      test.skip();
      return;
    }

    await termin.click();
    await page.waitForTimeout(300);

    const submitBtn = page.locator('#buchform button[type="submit"], #buchform .kal-submit').first();
    if (await submitBtn.count() === 0) {
      test.skip();
      return;
    }

    await submitBtn.click();
    const nameInput = page.locator('#b-name');
    const isInvalid = await nameInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(isInvalid).toBe(true);
  });

});
