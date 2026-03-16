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
- **Über uns** (`#ueber`): Geschichte und Zitat
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

## Zielgruppe
Die Website-Besitzerin ist keine Entwicklerin. Änderungen müssen einfach bleiben. Code-Änderungen sollten gut kommentiert sein.

## Sprache
Die Website ist komplett auf Deutsch. Commit-Messages und Kommentare dürfen auf Deutsch oder Englisch sein.

## Deployment
Push to `main` branch → GitHub Pages deployed automatisch (1-2 Minuten).