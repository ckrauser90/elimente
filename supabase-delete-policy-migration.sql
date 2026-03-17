-- ═══════════════════════════════════════════════════════════
-- ELIMENTE – Fehlende DELETE-Policy für Buchungen
-- Im Supabase SQL-Editor ausführen (einmalig)
-- ═══════════════════════════════════════════════════════════
-- Ohne diese Policy können Admins Buchungen nicht löschen.

CREATE POLICY "Admin Buchungen löschen"
  ON buchungen FOR DELETE
  USING (auth.role() = 'authenticated');
