-- ═══════════════════════════════════════════════════════════
-- ELIMENTE – Buchungs-Funktion neu anlegen
-- Im Supabase SQL-Editor ausführen wenn Buchungen mit
-- "400 Bad Request" fehlschlagen.
-- ═══════════════════════════════════════════════════════════

-- Alte Version entfernen (falls mit anderen Parametern angelegt)
DROP FUNCTION IF EXISTS create_buchung(UUID, TEXT, TEXT, TEXT, TEXT);

-- Buchungs-Funktion neu anlegen
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

-- Funktion ist öffentlich aufrufbar (auch ohne Login)
GRANT EXECUTE ON FUNCTION create_buchung(UUID, TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION create_buchung(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
