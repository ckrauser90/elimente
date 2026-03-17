-- ═══════════════════════════════════════════════════════════
-- ELIMENTE – Bilder Migration
-- Im Supabase SQL-Editor ausführen (einmalig)
-- ═══════════════════════════════════════════════════════════

-- ─── 1. TABELLE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS galerie_bilder (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bereich    TEXT NOT NULL CHECK (bereich IN ('hero', 'about', 'galerie')),
  url        TEXT NOT NULL,
  storage_path TEXT,       -- Pfad in Supabase Storage (zum Löschen)
  alt_text   TEXT DEFAULT '',
  sort_order INT  DEFAULT 0,
  aktiv      BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE galerie_bilder ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bilder öffentlich lesen"
  ON galerie_bilder FOR SELECT USING (aktiv = true);

CREATE POLICY "Admin Bilder lesen"
  ON galerie_bilder FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin Bilder anlegen"
  ON galerie_bilder FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin Bilder ändern"
  ON galerie_bilder FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin Bilder löschen"
  ON galerie_bilder FOR DELETE USING (auth.role() = 'authenticated');


-- ─── 2. STORAGE POLICIES ───────────────────────────────────
-- Erst "bilder"-Bucket im Dashboard anlegen (Storage → New bucket → "bilder" → Public),
-- dann diese Policies ausführen:

INSERT INTO storage.buckets (id, name, public)
VALUES ('bilder', 'bilder', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Bilder öffentlich lesen"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bilder');

CREATE POLICY "Admin Bilder hochladen"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'bilder' AND auth.role() = 'authenticated');

CREATE POLICY "Admin Bilder löschen"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'bilder' AND auth.role() = 'authenticated');
