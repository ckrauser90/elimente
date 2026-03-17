-- ═══════════════════════════════════════════════════════════
-- ELIMENTE – Website-Texte Migration
-- Im Supabase SQL-Editor ausführen (einmalig)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS site_texte (
  key         TEXT PRIMARY KEY,
  wert        TEXT NOT NULL,
  beschreibung TEXT,  -- Erklärung für die Admin-Oberfläche
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE site_texte ENABLE ROW LEVEL SECURITY;

-- Öffentlich: alle Texte lesen (für die Website)
CREATE POLICY "Texte öffentlich lesen"
  ON site_texte FOR SELECT
  USING (true);

-- Admin: Texte ändern
CREATE POLICY "Admin Texte ändern"
  ON site_texte FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin Texte anlegen"
  ON site_texte FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');


-- ─── Startwerte (entsprechen den siteData-Defaults) ────────

INSERT INTO site_texte (key, wert, beschreibung) VALUES

  -- Startseite
  ('hero.label',          'Handgemachte Keramik mit Herz',
   'Kleiner Text über der Hauptüberschrift'),
  ('hero.headline',       'Erde, Wasser,\nFeuer — <span class="accent">Elimente.</span>',
   'Hauptüberschrift (HTML erlaubt)'),
  ('hero.description',    'Entdecke handgefertigte Keramik, lerne Töpfern in unseren Kursen oder leihe dir eine Töpferscheibe für dein eigenes Projekt.',
   'Beschreibungstext unter der Überschrift'),
  ('hero.buttonPrimary',  'Kurse entdecken',    'Text des grünen Buttons'),
  ('hero.buttonSecondary','Unsere Geschichte',  'Text des zweiten Buttons'),

  -- Über uns
  ('about.quote', 'Jedes Stück erzählt eine Geschichte — geformt von Hand, gebrannt mit Leidenschaft.',
   'Kursiv-Zitat links'),
  ('about.text1', 'Willkommen bei Elimente! Hier dreht sich alles um die Freude am Gestalten mit Ton. In meiner kleinen Werkstatt entstehen Unikate — von der Tasse bis zur Vase, jedes Stück mit Liebe von Hand gefertigt.',
   'Erster Absatz'),
  ('about.text2', 'Ob du selbst töpfern lernen möchtest, ein besonderes handgemachtes Stück suchst oder eine Töpferscheibe für dein eigenes Projekt brauchst — hier bist du richtig.',
   'Zweiter Absatz'),

  -- Verleih
  ('verleih.title',       'Professionelle Töpferscheibe', 'Titel der Verleih-Karte'),
  ('verleih.description', 'Unsere Scheiben sind ideal für zuhause — kompakt, leise und leistungsstark. Lieferung und Abholung inklusive im näheren Umkreis.',
   'Beschreibungstext'),
  ('verleih.priceDay',    '35 €',   'Preis pro Tag'),
  ('verleih.priceWeek',   '120 €',  'Preis pro Woche'),

  -- Kontakt
  ('kontakt.adresse',   'Musterstraße 12, 12345 Musterstadt', 'Adresse'),
  ('kontakt.email',     'hallo@elimente-keramik.de',          'E-Mail-Adresse'),
  ('kontakt.telefon',   '0123 – 456 789 0',                   'Telefonnummer'),
  ('kontakt.instagram', '@elimente.keramik',                   'Instagram-Handle'),

  -- Footer
  ('footer.copyright', '© 2026 Elimente Keramik', 'Copyright-Text im Footer')

ON CONFLICT (key) DO NOTHING;
