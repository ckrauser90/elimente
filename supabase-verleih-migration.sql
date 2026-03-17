-- ═══════════════════════════════════════════════════════════
-- ELIMENTE – Verleih-Buchungen Migration
-- Im Supabase SQL-Editor ausführen (einmalig)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS verleih_buchungen (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_datum DATE NOT NULL,
  end_datum   DATE NOT NULL,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  telefon     TEXT,
  nachricht   TEXT,
  status      TEXT NOT NULL DEFAULT 'neu'
              CHECK (status IN ('neu', 'bestaetigt', 'storniert')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT min_mietdauer CHECK (end_datum >= start_datum + INTERVAL '14 days')
);

ALTER TABLE verleih_buchungen ENABLE ROW LEVEL SECURITY;

-- Öffentlich: Zeiträume lesen (damit Kalender belegte Tage zeigt)
CREATE POLICY "Verleih öffentlich lesen"
  ON verleih_buchungen FOR SELECT
  USING (status != 'storniert');

-- Öffentlich: neue Anfrage stellen
CREATE POLICY "Verleih anfragen"
  ON verleih_buchungen FOR INSERT
  WITH CHECK (true);

-- Admin: alles lesen und ändern
CREATE POLICY "Admin Verleih lesen"
  ON verleih_buchungen FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin Verleih ändern"
  ON verleih_buchungen FOR UPDATE
  USING (auth.role() = 'authenticated');
