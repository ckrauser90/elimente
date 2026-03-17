-- ═══════════════════════════════════════════════════════════
-- ELIMENTE – Angebots-Icons Migration
-- Im Supabase SQL-Editor ausführen (einmalig)
-- ═══════════════════════════════════════════════════════════
-- Erweitert die galerie_bilder-Tabelle um drei neue Bereiche
-- für die Icons der "Mein Angebot"-Karten.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE galerie_bilder DROP CONSTRAINT IF EXISTS galerie_bilder_bereich_check;

ALTER TABLE galerie_bilder ADD CONSTRAINT galerie_bilder_bereich_check
  CHECK (bereich IN ('hero', 'about', 'galerie', 'icon_kaufen', 'icon_kurse', 'icon_verleih'));
