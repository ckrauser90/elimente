# Elimente – Töpferei Website

## Projektübersicht
Dies ist die Website für "Elimente", eine Töpferei die Keramik verkauft, Töpferkurse anbietet und Töpferscheiben verleiht. Die Website wird über GitHub Pages gehostet.

## Technologie
- Einzelne `index.html` Datei (kein Framework, kein Build-Prozess)
- Vanilla HTML, CSS, JavaScript
- Google Fonts: Cormorant Garamond + Karla
- Farbpalette: Sage/Creme (CSS Custom Properties in `:root`)
- Responsives Design mit CSS Grid und Media Queries
- Gehostet auf GitHub Pages

## Architektur
Die gesamte Website wird aus dem `siteData` JavaScript-Objekt am Ende der Datei gerendert. Die Funktion `renderSite(siteData)` erzeugt das HTML.

### Inhalte ändern
Alle Texte, Preise und Kontaktdaten stehen im `siteData` Objekt. Nur dort Inhalte anpassen – nicht im generierten HTML.

### Bereiche der Website
- **Hero**: Startseite mit Headline und Call-to-Action
- **Über mich** (`#ueber`): Geschichte und Zitat
- **Angebote** (`#angebote`): 3 Karten (Kaufen, Kurse, Verleih)
- **Kurse** (`#kurse`): Dynamisch aus `siteData.kurse[]` Array
- **Galerie** (`#galerie`): Platzhalter mit Emojis (echte Fotos folgen)
- **Verleih** (`#verleih`): Töpferscheiben-Verleih mit Preisen
- **Kontakt** (`#kontakt`): Formular + Kontaktdaten

### Farben (CSS Custom Properties)
- `--sage`: #7A8E6E (Hauptfarbe)
- `--cream`: #F6F2EC (Hintergrund)
- `--bark`: #3E3832 (Textfarbe)
- `--terracotta`: #B87A5A (Akzent)
- `--moss`: #5C6E52 (Dunkler Akzent)

## Geplante nächste Schritte
1. Echte Fotos statt Emoji-Platzhalter einbauen
2. Kontaktformular mit Formspree verbinden
3. Optional: MongoDB-Backend + Admin-Bereich über Vercel Functions
4. Verwaltung über OpenClaw für einfache Inhaltspflege

## SEO
- Meta-Tags pro Seite: `title`, `description`, `og:title`, `og:description`, `og:image`
- Schema.org Markup einbauen: `LocalBusiness` für das Geschäft, `Course` für Töpferkurse, `Product` für Keramik-Artikel
- `sitemap.xml` und `robots.txt` erstellen und im Root ablegen
- Alle Bilder (besonders Galerie) brauchen beschreibende `alt`-Texte auf Deutsch
- Saubere, sprechende Anker-IDs verwenden (z.B. `#kurse`, `#verleih`)

## Cookie Banner
- Cookie Banner ist Pflicht, da Google Analytics eingesetzt wird
- Opt-in **vor** dem Laden von Analytics und allen externen Diensten (z.B. Google Fonts)
- Zwei Buttons: „Alle akzeptieren" / „Nur notwendige"
- Cookie-Präferenz im `localStorage` speichern und bei jedem Seitenaufruf respektieren
- Google Analytics Script (`gtag.js`) darf erst nach Einwilligung geladen werden
- Banner muss beim ersten Besuch erscheinen und nach Auswahl verschwinden

## Rechtliches
- **Impressum** (gesetzliche Pflicht in DE): Name, Anschrift, Kontakt (E-Mail + Telefon), ggf. Umsatzsteuer-ID. Gewerbe ist angemeldet.
- **Datenschutzerklärung** (DSGVO): Muss Google Analytics, Kontaktformular (z.B. Formspree), externe Fonts, Etsy-API-Einbindung und Cookie-Nutzung abdecken
- **AGB**: Für den Keramik-Verkauf (Widerrufsrecht, Haftung, Lieferbedingungen) und den Töpferscheiben-Verleih (Mietbedingungen, Haftung bei Beschädigung, Kaution)
- Impressum und Datenschutz müssen von jeder Seite aus maximal 2 Klicks erreichbar sein (Footer-Links)

## Admin-Bereich Absicherung
- Session Tokens mit Ablaufzeit verwenden
- Passwörter nur gehasht speichern (z.B. bcrypt)
- HTTPS ist Pflicht für alle Seiten
- CSRF-Schutz für alle Formulare
- Rate Limiting bei Login-Versuchen (z.B. max. 5 Versuche, dann Sperre)
- Admin-Routen nicht öffentlich erratbar machen

## Sicherheitsanforderungen (Security Requirements)
- **Input-Validierung**: Alle User-Inputs mit Whitelist validieren – nur erlaubte Zeichen/Formate akzeptieren
- **Prepared Statements**: Für DB-Queries keine String-Concatenation verwenden; Supabase-Client-Queries gelten als parametrisiert
- **Passwort-Hashing**: bcrypt mit mindestens 12 Salt Rounds (wird von Supabase Auth übernommen)
- **Sichere Cookies**: HttpOnly + Secure + SameSite=Strict für alle Session-Cookies (Supabase handhabt das intern)
- **CSRF-Schutz**: CSRF-Token bei allen state-ändernden Requests (Formulare, POST/PATCH/DELETE)
- **Security Headers**: CSP, X-Frame-Options, HSTS über Hosting-Konfiguration oder Meta-Tags setzen
- **Authentifizierung & Autorisierung**: Admin-Bereich nur mit gültiger, authentifizierter Supabase-Session zugänglich; Row Level Security (RLS) in Supabase aktivieren
- **Keine Secrets im Code**: API-Keys, Passwörter und sonstige Secrets ausschließlich über `.env` oder `config.local.js` (gitignored) – nie im Repository
- **Fehlerseiten**: Fehlermeldungen dürfen keine technischen Details (Stack Traces, DB-Fehlermeldungen) an den Nutzer ausgeben
- **XSS-Prävention**: Alle aus der Datenbank oder von Nutzern stammenden Daten müssen vor dem Einsetzen in `innerHTML` HTML-escaped werden; `textContent` bevorzugen

## Etsy-Shop Integration (Iteration 1)
- Shop: ELIMENTE (<https://www.etsy.com/shop/ELIMENTE>)
- Anbindung über Etsy API v3 (Open API)
- API-Key wird benötigt (registrieren unter <https://developers.etsy.com>)
- Endpoint: `GET /v3/application/shops/{shop_id}/listings/active`
- Daten pro Listing abrufen: Titel, Preis, Bilder, Beschreibung, URL
- Darstellung als Produkt-Karten im bestehenden Design (Sage/Terracotta-Farbpalette)
- Klick auf Karte öffnet das Etsy-Listing in neuem Tab
- Produkte werden bei jedem Seitenaufruf (oder per Cache mit TTL) aktuell gehalten
- Bewertungen: 5 Sterne, Preise ab €6,50, kostenloser Versand

## Eigenes Shop-System (spätere Iteration)
- Checkout direkt auf der Website (z.B. Stripe oder Snipcart)
- Etsy dann optional als zusätzlicher Vertriebskanal
- Warenkorb, Bestellübersicht, Bestätigungsmail
- Wird erst umgesetzt, wenn Etsy-Integration stabil läuft

## Töpferscheiben-Verleih – Buchungskalender
- 1 Töpferscheibe steht zum Verleih
- Buchungskalender auf der Website zeigt Verfügbarkeit (belegt/frei)
- Mindestmietdauer: 2 Wochen, darüber variable Dauer
- Direktbuchung (verbindlich) über die Website
- Bezahlung: vorerst offen (Stripe als Online-Option vormerken)
- Bestätigungs-Mail nach erfolgreicher Buchung
- Admin-Bereich: Buchungen einsehen, Zeiträume manuell sperren/freigeben
- Kalender-UI: belegte Zeiträume ausgegraut, freie Zeiträume auswählbar
- Datumsauswahl: Start- und Enddatum, Validierung der Mindestdauer (14 Tage)

## Zielgruppe
Die Website-Besitzerin ist keine Entwicklerin. Änderungen müssen einfach bleiben. Code-Änderungen sollten gut kommentiert sein.

## Sprache
Die Website ist komplett auf Deutsch. Commit-Messages und Kommentare dürfen auf Deutsch oder Englisch sein.

## Deployment
Push to `main` branch → GitHub Pages deployed automatisch (1-2 Minuten).