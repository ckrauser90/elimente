-- ═══════════════════════════════════════════════════════════
-- ELIMENTE – FK Cascade für buchungen → kurs_termine
-- Im Supabase SQL-Editor ausführen (einmalig)
-- ═══════════════════════════════════════════════════════════
-- Ergänzt ON DELETE CASCADE damit Buchungen automatisch
-- gelöscht werden wenn ein Termin gelöscht wird.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE buchungen
  DROP CONSTRAINT buchungen_termin_id_fkey;

ALTER TABLE buchungen
  ADD CONSTRAINT buchungen_termin_id_fkey
  FOREIGN KEY (termin_id)
  REFERENCES kurs_termine(id)
  ON DELETE CASCADE;
