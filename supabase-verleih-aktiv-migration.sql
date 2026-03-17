-- ═══════════════════════════════════════════════════════════
-- ELIMENTE – Verleih Verfügbarkeits-Toggle
-- Im Supabase SQL-Editor ausführen (einmalig)
-- ═══════════════════════════════════════════════════════════
-- Legt den Startwert für den Verleih-Toggle an.
-- Danach im Admin-Portal unter Verleih ein-/ausschalten.

INSERT INTO site_texte (key, wert, beschreibung) VALUES
  ('verleih.aktiv', 'true', 'Scheibe aktuell verfügbar für Verleih (true/false)')
ON CONFLICT (key) DO NOTHING;
