-- ═══════════════════════════════════════════════════════════
-- ELIMENTE – Töpferei Buchungssystem
-- ───────────────────────────────────────────────────────────
-- Dieses SQL im Supabase Dashboard ausführen:
-- Dashboard → SQL Editor → New query → hier einfügen → Run
-- ═══════════════════════════════════════════════════════════


-- ─── 1. KURS-TYPEN ─────────────────────────────────────────
-- Definiert die Kursarten (Schnupperkurs, Grundkurs, etc.)
-- Diese werden im Admin-Bereich gepflegt.

CREATE TABLE IF NOT EXISTS kurs_typen (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  level          TEXT NOT NULL DEFAULT 'Alle Level',
  description    TEXT,
  duration       TEXT,
  price          TEXT NOT NULL,
  max_teilnehmer INT  NOT NULL DEFAULT 8,
  aktiv          BOOLEAN NOT NULL DEFAULT true,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now()
);


-- ─── 2. KURS-TERMINE ───────────────────────────────────────
-- Konkrete Termine: wann findet welcher Kurs statt?
-- Werden im Admin-Kalender angelegt.

CREATE TABLE IF NOT EXISTS kurs_termine (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kurs_typ_id     UUID NOT NULL REFERENCES kurs_typen(id) ON DELETE CASCADE,
  datum           DATE NOT NULL,
  uhrzeit_start   TIME NOT NULL DEFAULT '10:00',
  max_teilnehmer  INT  NOT NULL DEFAULT 8,
  buchungen_count INT  NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'offen'
                  CHECK (status IN ('offen', 'voll', 'abgesagt')),
  notiz           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);


-- ─── 3. BUCHUNGEN ──────────────────────────────────────────
-- Wer hat welchen Termin gebucht?

CREATE TABLE IF NOT EXISTS buchungen (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  termin_id  UUID NOT NULL REFERENCES kurs_termine(id) ON DELETE RESTRICT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  telefon    TEXT,
  nachricht  TEXT,
  status     TEXT NOT NULL DEFAULT 'neu'
             CHECK (status IN ('neu', 'bestaetigt', 'storniert')),
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ─── 4. ROW LEVEL SECURITY ─────────────────────────────────
-- Legt fest, wer was lesen/schreiben darf.

ALTER TABLE kurs_typen   ENABLE ROW LEVEL SECURITY;
ALTER TABLE kurs_termine ENABLE ROW LEVEL SECURITY;
ALTER TABLE buchungen    ENABLE ROW LEVEL SECURITY;

-- Öffentlich: aktive Kurstypen lesen (für die Website)
CREATE POLICY "Kurstypen öffentlich lesen"
  ON kurs_typen FOR SELECT
  USING (aktiv = true);

-- Öffentlich: nicht abgesagte Termine lesen (für den Kalender)
CREATE POLICY "Termine öffentlich lesen"
  ON kurs_termine FOR SELECT
  USING (status != 'abgesagt');

-- Öffentlich: neue Buchung anlegen (anonym, ohne Login)
CREATE POLICY "Buchungen anlegen"
  ON buchungen FOR INSERT
  WITH CHECK (true);

-- Admin: alle Buchungen lesen und ändern (nur eingeloggt)
CREATE POLICY "Admin Buchungen lesen"
  ON buchungen FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin Buchungen ändern"
  ON buchungen FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Admin: Termine anlegen und ändern
CREATE POLICY "Admin Termine anlegen"
  ON kurs_termine FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin Termine ändern"
  ON kurs_termine FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin Termine löschen"
  ON kurs_termine FOR DELETE
  USING (auth.role() = 'authenticated');

-- Admin: Kurstypen anlegen und ändern
CREATE POLICY "Admin Kurstypen lesen alle"
  ON kurs_typen FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin Kurstypen anlegen"
  ON kurs_typen FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin Kurstypen ändern"
  ON kurs_typen FOR UPDATE
  USING (auth.role() = 'authenticated');


-- ─── 5. BUCHUNGS-FUNKTION (atomar) ─────────────────────────
-- Diese Funktion legt eine Buchung an und aktualisiert den
-- Platz-Zähler in einem einzigen Schritt.
-- Dadurch werden Doppelbuchungen verhindert.

CREATE OR REPLACE FUNCTION create_buchung(
  p_termin_id UUID,
  p_name      TEXT,
  p_email     TEXT,
  p_telefon   TEXT DEFAULT NULL,
  p_nachricht TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_termin  kurs_termine;
  v_buchung buchungen;
BEGIN
  -- Termin sperren (verhindert gleichzeitige Überbuchungen)
  SELECT * INTO v_termin
  FROM kurs_termine
  WHERE id = p_termin_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Termin nicht gefunden';
  END IF;

  IF v_termin.status = 'abgesagt' THEN
    RAISE EXCEPTION 'Dieser Termin wurde abgesagt';
  END IF;

  IF v_termin.buchungen_count >= v_termin.max_teilnehmer THEN
    RAISE EXCEPTION 'Dieser Termin ist ausgebucht';
  END IF;

  -- Buchung eintragen
  INSERT INTO buchungen (termin_id, name, email, telefon, nachricht)
  VALUES (p_termin_id, p_name, p_email, p_telefon, p_nachricht)
  RETURNING * INTO v_buchung;

  -- Zähler erhöhen, bei Vollbuchung Status auf "voll" setzen
  UPDATE kurs_termine
  SET
    buchungen_count = buchungen_count + 1,
    status = CASE
      WHEN buchungen_count + 1 >= max_teilnehmer THEN 'voll'
      ELSE 'offen'
    END
  WHERE id = p_termin_id;

  RETURN row_to_json(v_buchung);
END;
$$;


-- ─── 6. BEISPIEL-DATEN ─────────────────────────────────────
-- Kurstypen eintragen (entsprechen den bisherigen siteData.kurse)

INSERT INTO kurs_typen (name, level, description, duration, price, max_teilnehmer, sort_order) VALUES
  ('Schnupperkurs Töpfern', 'Anfänger',       'Der perfekte Einstieg: Lerne die Grundlagen an der Scheibe und nimm dein erstes Stück mit nach Hause.', '3 Stunden',    '45 €',  8, 1),
  ('Grundkurs Drehen',      'Anfänger',       'In vier Abenden lernst du Zentrieren, Hochziehen und Formen. Glasur und Brennen inklusive!',             '4 × 2,5 Std.', '160 €', 6, 2),
  ('Glasur-Workshop',       'Fortgeschritten','Experimentiere mit verschiedenen Glasuren, Techniken und Brennverfahren für einzigartige Oberflächen.',   '4 Stunden',    '85 €',  8, 3),
  ('Aufbautechnik',         'Alle Level',     'Ohne Scheibe — mit Platten, Wülsten und freiem Formen gestaltest du ganz individuelle Objekte.',          '3,5 Stunden',  '55 €',  8, 4);
