# E2E-Testplan – Elimente Töpferei Website

> **Status**: Dokumentiert, noch nicht implementiert
> **Empfohlenes Framework**: [Playwright](https://playwright.dev)
> **Stand**: März 2026

---

## Übersicht

Da die Website aktuell keine automatisierten E2E-Tests besitzt, listet dieses Dokument alle relevanten Testszenarien für die manuelle Prüfung und als Grundlage für eine spätere Implementierung mit Playwright oder Cypress.

---

## 1. Cookie-Banner

| # | Testfall | Vorbedingung | Erwartetes Ergebnis |
|---|----------|--------------|---------------------|
| 1.1 | Banner wird beim ersten Besuch angezeigt | `localStorage` leer | Cookie-Banner ist sichtbar |
| 1.2 | Banner enthält zwei Buttons | – | „Alle akzeptieren" und „Nur notwendige" vorhanden |
| 1.3 | „Alle akzeptieren" speichert Einwilligung | Banner sichtbar | `localStorage` enthält `cookieConsent=all`, Banner verschwindet |
| 1.4 | „Nur notwendige" speichert Ablehnung | Banner sichtbar | `localStorage` enthält `cookieConsent=necessary`, Banner verschwindet |
| 1.5 | Banner erscheint nach Akzeptieren nicht erneut | `cookieConsent=all` in `localStorage` | Banner ist beim Neuladen nicht sichtbar |
| 1.6 | Google Analytics wird nur nach Einwilligung geladen | – | `gtag.js` ist im DOM erst nach Klick auf „Alle akzeptieren" vorhanden |
| 1.7 | Google Fonts werden nur nach Einwilligung geladen | – | Fonts-Stylesheet wird erst nach Einwilligung eingebunden |

---

## 2. Navigation

| # | Testfall | Vorbedingung | Erwartetes Ergebnis |
|---|----------|--------------|---------------------|
| 2.1 | Desktop-Navigation zeigt alle Menüpunkte | Viewport ≥ 768px | Links zu `#ueber`, `#angebote`, `#kurse`, `#galerie`, `#verleih`, `#kontakt` sichtbar |
| 2.2 | Hamburger-Menü auf Mobilgeräten sichtbar | Viewport < 768px | Hamburger-Icon wird angezeigt, Menüpunkte versteckt |
| 2.3 | Hamburger-Menü öffnet Navigation | Mobile Ansicht | Klick auf Icon öffnet Mobilmenü |
| 2.4 | Klick auf Menüpunkt scrollt zur Section | Desktop | Smooth Scroll zur Ziel-Section |
| 2.5 | Mobilmenü schließt nach Klick auf Link | Mobile, Menü offen | Menü schließt sich nach Klick auf Link |
| 2.6 | Logo-Klick scrollt zum Seitenanfang | – | Seite scrollt zu `#hero` |

---

## 3. Hero-Bereich

| # | Testfall | Vorbedingung | Erwartetes Ergebnis |
|---|----------|--------------|---------------------|
| 3.1 | Hero-Headline ist sichtbar | – | Headline-Text aus `siteData.hero.headline` wird angezeigt |
| 3.2 | CTA-Button ist sichtbar und klickbar | – | Button mit Text aus `siteData.hero.cta` vorhanden |
| 3.3 | CTA-Button scrollt zur richtigen Section | – | Klick scrollt zur Ziel-Section |
| 3.4 | Hero-Bild wird korrekt geladen | – | Hintergrundbild oder `<img>` ohne 404-Fehler |

---

## 4. Über mich

| # | Testfall | Vorbedingung | Erwartetes Ergebnis |
|---|----------|--------------|---------------------|
| 4.1 | Section `#ueber` ist erreichbar | – | Bereich ist im DOM vorhanden und sichtbar |
| 4.2 | Zitat wird angezeigt | – | `siteData.ueber.zitat` ist sichtbar |
| 4.3 | Text ist vollständig gerendert | – | Kein abgeschnittener oder fehlender Text |

---

## 5. Angebote (3 Karten)

| # | Testfall | Vorbedingung | Erwartetes Ergebnis |
|---|----------|--------------|---------------------|
| 5.1 | Alle 3 Angebots-Karten werden angezeigt | – | Karten für Kaufen, Kurse, Verleih sind sichtbar |
| 5.2 | Karten enthalten Titel, Beschreibung und Button | – | Alle Elemente pro Karte vorhanden |
| 5.3 | Button-Links navigieren korrekt | – | Klick auf Button scrollt zu oder öffnet richtigen Bereich |

---

## 6. Kurse

| # | Testfall | Vorbedingung | Erwartetes Ergebnis |
|---|----------|--------------|---------------------|
| 6.1 | Kurs-Karten werden dynamisch gerendert | `siteData.kurse[]` nicht leer | Anzahl der Karten entspricht Array-Länge |
| 6.2 | Kurs-Karte zeigt Titel, Datum, Preis | – | Alle Felder pro Kurs sichtbar |
| 6.3 | Anmelde-Button pro Kurs vorhanden | – | Jede Kurs-Karte hat einen klickbaren Button |
| 6.4 | Korrekte Darstellung ohne Kurse | `siteData.kurse[]` leer | Hinweistext oder leerer Bereich ohne JS-Fehler |

---

## 7. Galerie

| # | Testfall | Vorbedingung | Erwartetes Ergebnis |
|---|----------|--------------|---------------------|
| 7.1 | Galerie-Bereich wird angezeigt | – | Section `#galerie` ist sichtbar |
| 7.2 | Galerie-Elemente sind vorhanden | – | Mindestens ein Galerie-Item wird gerendert |
| 7.3 | Bilder haben Alt-Texte (nach Foto-Einbau) | Echte Bilder vorhanden | `alt`-Attribut ist beschreibend und nicht leer |

---

## 8. Töpferscheiben-Verleih

| # | Testfall | Vorbedingung | Erwartetes Ergebnis |
|---|----------|--------------|---------------------|
| 8.1 | Verleih-Bereich mit Preisen wird angezeigt | – | Preisangaben aus `siteData` sichtbar |
| 8.2 | Buchungskalender ist sichtbar | – | Kalender-UI wird gerendert |
| 8.3 | Belegte Zeiträume sind ausgegraut | Buchungen in DB vorhanden | Blockierte Tage nicht auswählbar |
| 8.4 | Freie Zeiträume sind auswählbar | – | Tage können angeklickt werden |
| 8.5 | Startdatum auswählen | – | Kalender markiert Startdatum |
| 8.6 | Enddatum auswählen | Startdatum gesetzt | Kalender markiert Enddatum |
| 8.7 | Mindestmietdauer-Validierung (14 Tage) | – | Weniger als 14 Tage zeigt Fehlermeldung |
| 8.8 | Buchungsformular erscheint nach Datumsauswahl | Gültige Daten ausgewählt | Formular mit Name/E-Mail sichtbar |
| 8.9 | Buchung absenden | Formular ausgefüllt | Bestätigungsmail wird erwähnt / Erfolgsmeldung erscheint |

---

## 9. Buchungsworkflow (End-to-End)

### 9.1 Buchung über die Website durchführen

| # | Testfall | Vorbedingung | Erwartetes Ergebnis |
|---|----------|--------------|---------------------|
| 9.1.1 | Startdatum im Kalender auswählen | Kalender sichtbar, Datum frei | Datum wird markiert |
| 9.1.2 | Enddatum (min. 14 Tage später) auswählen | Startdatum gesetzt | Zeitraum wird farblich hervorgehoben |
| 9.1.3 | Buchungsformular erscheint nach Datumsauswahl | Gültiger Zeitraum gewählt | Formular mit Feldern für Name, E-Mail, Telefon sichtbar |
| 9.1.4 | Pflichtfelder werden validiert | Formular leer abgeschickt | Fehlermeldung bei leeren Pflichtfeldern |
| 9.1.5 | Buchung erfolgreich absenden | Alle Felder korrekt | Erfolgsmeldung erscheint, Bestätigungsmail an Kunden erwähnt |
| 9.1.6 | Gebuchter Zeitraum ist sofort ausgegraut | Nach erfolgreicher Buchung | Der gebuchte Zeitraum ist im Kalender nicht mehr auswählbar |
| 9.1.7 | Doppelbuchung ist nicht möglich | Zeitraum bereits gebucht | Überlappende Datumsauswahl wird blockiert oder zeigt Fehler |
| 9.1.8 | Teilweise belegter Zeitraum wird korrekt angezeigt | Teil des Kalenders gebucht | Nur freie Tage sind auswählbar |

### 9.2 Buchungsstatus im Kalender (Sichtbarkeit)

| # | Testfall | Vorbedingung | Erwartetes Ergebnis |
|---|----------|--------------|---------------------|
| 9.2.1 | Ausstehende Buchung ist ausgegraut | Buchung angelegt, noch nicht bestätigt | Zeitraum im Kalender als belegt/ausgegraut dargestellt |
| 9.2.2 | Bestätigte Buchung bleibt ausgegraut | Admin hat Buchung akzeptiert | Zeitraum weiterhin nicht buchbar |
| 9.2.3 | Stornierte Buchung gibt Zeitraum frei | Admin hat Buchung storniert | Zeitraum erscheint wieder als buchbar (nicht ausgegraut) |
| 9.2.4 | Kalender-Ansicht aktualisiert sich ohne Neuladen | – | Statusänderungen im Admin spiegeln sich zeitnah im Kalender wider |

---

## 10. Kontaktformular

| # | Testfall | Vorbedingung | Erwartetes Ergebnis |
|---|----------|--------------|---------------------|
| 9.1 | Formular ist sichtbar | – | Felder für Name, E-Mail, Nachricht vorhanden |
| 9.2 | Pflichtfeld-Validierung | Felder leer | Fehlermeldung bei leerem Absenden |
| 9.3 | E-Mail-Format-Validierung | Ungültige E-Mail eingegeben | Fehlermeldung wird angezeigt |
| 9.4 | Erfolgreiches Absenden | Alle Felder korrekt | Erfolgsmeldung erscheint, Formular wird geleert |
| 9.5 | Kontaktdaten werden angezeigt | – | E-Mail-Adresse und Telefonnummer aus `siteData` sichtbar |

---

## 10. Etsy-Shop-Integration

| # | Testfall | Vorbedingung | Erwartetes Ergebnis |
|---|----------|--------------|---------------------|
| 10.1 | Produkt-Karten werden geladen | Etsy API erreichbar | Mindestens eine Produkt-Karte angezeigt |
| 10.2 | Karte zeigt Titel, Preis und Bild | – | Alle Felder sichtbar und korrekt befüllt |
| 10.3 | Klick öffnet Etsy-Listing in neuem Tab | – | `target="_blank"` Link öffnet sich |
| 10.4 | Fallback bei API-Fehler | Etsy API nicht erreichbar | Fehlermeldung oder leerer Bereich ohne JS-Fehler |

---

## 11. Admin-Bereich (`admin.html`)

### Login

| # | Testfall | Vorbedingung | Erwartetes Ergebnis |
|---|----------|--------------|---------------------|
| 11.1 | Login-Formular ist sichtbar | Nicht eingeloggt | E-Mail- und Passwort-Felder vorhanden |
| 11.2 | Falsches Passwort zeigt Fehler | – | Fehlermeldung erscheint, kein Zugang |
| 11.3 | Zu viele Fehlversuche sperren Zugang | 5× falsches PW | Konto temporär gesperrt (Rate Limiting) |
| 11.4 | Korrekter Login gewährt Zugang | Gültige Credentials | Dashboard wird angezeigt |
| 11.5 | Session läuft nach Timeout ab | – | Nutzer wird automatisch ausgeloggt |
| 11.6 | Logout funktioniert | Eingeloggt | Weiterleitung zur Login-Seite |

### Dashboard – Kurs-Verwaltung

| # | Testfall | Vorbedingung | Erwartetes Ergebnis |
|---|----------|--------------|---------------------|
| 11.7 | Kursliste wird angezeigt | Kurse in DB | Alle Kurse aufgelistet |
| 11.8 | Neuen Kurs anlegen | – | Formular ausfüllen und speichern legt Kurs an |
| 11.9 | Kurs bearbeiten | Kurs vorhanden | Änderungen werden gespeichert |
| 11.10 | Kurs löschen | Kurs vorhanden | Kurs wird aus Liste entfernt |

### Dashboard – Buchungsverwaltung

| # | Testfall | Vorbedingung | Erwartetes Ergebnis |
|---|----------|--------------|---------------------|
| 11.11 | Buchungsübersicht wird angezeigt | Buchungen vorhanden | Liste aller Buchungen mit Name, Zeitraum und Status sichtbar |
| 11.12 | Ausstehende Buchung akzeptieren | Buchung im Status „ausstehend" | Status wechselt auf „bestätigt", Kunde erhält Bestätigungsmail |
| 11.13 | Buchung stornieren (durch Admin) | Bestätigte Buchung vorhanden | Status wechselt auf „storniert", Zeitraum wird im Kalender wieder freigegeben |
| 11.14 | Buchung löschen | Buchung vorhanden | Buchung wird vollständig aus der Liste entfernt |
| 11.15 | Zeitraum manuell sperren | – | Gesperrter Zeitraum im Kalender ausgegraut, nicht buchbar |
| 11.16 | Zeitraum wieder freigeben | Gesperrter Zeitraum | Zeitraum ist wieder buchbar |

### Dashboard – Bilder-Upload

| # | Testfall | Vorbedingung | Erwartetes Ergebnis |
|---|----------|--------------|---------------------|
| 11.14 | Hero-Bild hochladen | Admin eingeloggt | Bild wird gespeichert und angezeigt |
| 11.15 | Galerie-Bild hochladen | – | Bild erscheint in der Galerie |
| 11.16 | Falsches Dateiformat abgelehnt | Nicht-Bild-Datei | Fehlermeldung wird angezeigt |

---

## 13. Rechtliche Seiten

| # | Testfall | Vorbedingung | Erwartetes Ergebnis |
|---|----------|--------------|---------------------|
| 12.1 | Impressum erreichbar | – | `impressum.html` lädt ohne Fehler |
| 12.2 | Datenschutzerklärung erreichbar | – | `datenschutz.html` lädt ohne Fehler |
| 12.3 | AGB erreichbar | – | `agb.html` lädt ohne Fehler |
| 12.4 | Footer-Links zu Impressum/Datenschutz vorhanden | – | Links im Footer sind klickbar und führen zur richtigen Seite |
| 12.5 | Pflichtangaben im Impressum vorhanden | – | Name, Adresse, E-Mail, Telefon vorhanden |

---

## 14. Responsives Design

| # | Testfall | Viewport | Erwartetes Ergebnis |
|---|----------|----------|---------------------|
| 13.1 | Desktop-Layout korrekt | 1280×800 | Zweispaltiges Grid, Desktop-Navigation |
| 13.2 | Tablet-Layout korrekt | 768×1024 | Angepasste Spaltenbreiten, keine Überlappung |
| 13.3 | Mobil-Layout korrekt | 375×812 | Einspaltiges Layout, Hamburger-Menü |
| 13.4 | Kein horizontales Scrolling auf Mobil | 375px | `overflow-x` nicht vorhanden |
| 13.5 | Schriftgrößen auf Mobil lesbar | 375px | Mindestens 16px Schriftgröße |

---

## 15. Barrierefreiheit & Performance

| # | Testfall | Erwartetes Ergebnis |
|---|----------|---------------------|
| 14.1 | Keine gebrochenen Links (404) | Alle internen Links antworten mit 200 |
| 14.2 | Alle Bilder haben `alt`-Attribute | Kein `<img>` ohne `alt` |
| 14.3 | Seite lädt ohne JS-Konsolenfehler | Console zeigt keine Fehler beim Laden |
| 14.4 | Seite ist ohne JavaScript nutzbar (Basisinhalt) | Kerninhalt sichtbar ohne JS |

---

## Implementierungsempfehlung

```bash
# Playwright installieren
npm init -y
npm install -D @playwright/test
npx playwright install

# Tests ausführen
npx playwright test
```

Playwright-Tests können direkt gegen die GitHub-Pages-URL oder einen lokalen Server (z.B. `npx serve .`) laufen und lassen sich gut in die bestehende GitHub Actions Pipeline integrieren.
