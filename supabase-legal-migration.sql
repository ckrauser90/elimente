-- ═══════════════════════════════════════════════════════════
-- ELIMENTE – Rechtliche Texte Migration
-- Im Supabase SQL-Editor ausführen (einmalig)
-- ═══════════════════════════════════════════════════════════
-- Fügt die Pflichtfelder für Impressum, Datenschutz und AGB
-- zur site_texte-Tabelle hinzu.
-- Danach im Admin-Bereich unter Texte → Rechtliches ausfüllen.
-- ═══════════════════════════════════════════════════════════

INSERT INTO site_texte (key, wert, beschreibung) VALUES
  ('legal.name',    '[Vorname Nachname]',      'Vollständiger Name der Betreiberin (erscheint in Impressum, Datenschutz & AGB)'),
  ('legal.strasse', '[Straße und Hausnummer]', 'Straße und Hausnummer'),
  ('legal.plz_ort', '[PLZ Ort]',               'PLZ und Ort, z.B. 12345 Musterstadt'),
  ('legal.ustid',   '',                         'Umsatzsteuer-ID (leer lassen wenn nicht vorhanden)')
ON CONFLICT (key) DO NOTHING;
