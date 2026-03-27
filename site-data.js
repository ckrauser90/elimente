/* ═══════════════════════════════════════════════════════
   ✏️  HIER INHALTE ÄNDERN!

   Texte, Preise und Kontaktdaten einfach anpassen —
   den Text zwischen den Anführungszeichen "..." ändern
   und die Datei speichern. Fertig!
   ═══════════════════════════════════════════════════════ */

const siteData = {

  // ── Supabase Verbindung ──
  // Im Repo stehen hier Platzhalter. Der GitHub Actions Workflow setzt
  // die echten Keys beim Deploy ein (aus den GitHub Secrets).
  // Für lokale Tests: config.local.js mit den echten Keys anlegen.
  supabase: {
    url:     window.SUPABASE_URL     || "DEINE_SUPABASE_URL",
    anonKey: window.SUPABASE_ANON_KEY || "DEIN_SUPABASE_ANON_KEY"
  },

  // ── Name & Slogan ──
  name: "elimente",
  tagline: "Keramik · Kurse · Verleih",

  // ── Startseite ──
  hero: {
    label: "Handgemachte Keramik mit Herz",
    headline: 'Erde, Wasser,\nFeuer — <span class="accent">Elimente.</span>',
    description: "Entdecke handgefertigte Keramik, lerne Töpfern in meinen Kursen oder leihe dir eine Töpferscheibe für dein eigenes Projekt.",
    buttonPrimary: "Kurse entdecken",
    buttonSecondary: "Meine Geschichte"
  },

  // ── Über uns ──
  about: {
    quote: "Jedes Stück erzählt eine Geschichte — geformt von Hand, gebrannt mit Leidenschaft.",
    text1: "Willkommen bei Elimente! Hier dreht sich alles um die Freude am Gestalten mit Ton. In meiner kleinen Werkstatt entstehen Unikate — von der Tasse bis zur Vase, jedes Stück mit Liebe von Hand gefertigt.",
    text2: "Ob du selbst töpfern lernen möchtest, ein besonderes handgemachtes Stück suchst oder eine Töpferscheibe für dein eigenes Projekt brauchst — hier bist du richtig."
  },

  // ── Kurse (beliebig viele hinzufügen oder entfernen!) ──
  kurse: [
    {
      name: "Schnupperkurs Töpfern",
      level: "Anfänger",
      schedule: "Samstags",
      description: "Der perfekte Einstieg: Lerne die Grundlagen an der Scheibe und nimm dein erstes Stück mit nach Hause.",
      price: "45 €",
      duration: "3 Stunden"
    },
    {
      name: "Grundkurs Drehen",
      level: "Anfänger",
      schedule: "4 Abende",
      description: "In vier Abenden lernst du Zentrieren, Hochziehen und Formen. Glasur und Brennen inklusive!",
      price: "160 €",
      duration: "4 × 2,5 Std."
    },
    {
      name: "Glasur-Workshop",
      level: "Fortgeschritten",
      schedule: "Auf Anfrage",
      description: "Experimentiere mit verschiedenen Glasuren, Techniken und Brennverfahren für einzigartige Oberflächen.",
      price: "85 €",
      duration: "4 Stunden"
    },
    {
      name: "Aufbautechnik",
      level: "Alle Level",
      schedule: "Sonntags",
      description: "Ohne Scheibe — mit Platten, Wülsten und freiem Formen gestaltest du ganz individuelle Objekte.",
      price: "55 €",
      duration: "3,5 Stunden"
    }
  ],

  // ── Galerie-Kategorien ──
  galerie: [
    { emoji: "🏺", label: "Vasen" },
    { emoji: "☕", label: "Tassen & Becher" },
    { emoji: "🥣", label: "Schalen" },
    { emoji: "🪴", label: "Pflanzentöpfe" },
    { emoji: "🕯️", label: "Kerzenhalter" },
    { emoji: "✨", label: "Dekoration" }
  ],
  galerieHint: "Hier werden bald echte Fotos deiner Werke stehen — lade einfach Bilder hoch!",

  // ── Töpferscheiben-Verleih ──
  verleih: {
    title: "Professionelle Töpferscheibe",
    description: "Meine Scheibe ist ideal für zuhause — kompakt, leise und leistungsstark. Lieferung und Abholung inklusive im näheren Umkreis.",
    priceMonth: "150 €",
    aktiv: "true", // 'false' = Verleih deaktiviert (per Admin Toggle steuerbar)
    perks: ["Selbstabholung", "Einweisung inklusive", "Werkzeug-Set dabei", "Ton auf Wunsch"]
  },

  // ── Kontaktdaten ──
  kontakt: {
    adresse: "Musterstraße 12, 12345 Musterstadt",
    email: "hallo@elemente-keramik.de",
    telefon: "0123 – 456 789 0",
    instagram: "@elimen_te",
    instagramUrl: "https://www.instagram.com/elimen_te",
  },

  // ── Webhooks (Make.com → Brevo) ──
  // URLs werden im Admin-Bereich unter Texte → Webhooks eingetragen
  webhooks: {
    buchungAngefragt:   "https://hook.eu1.make.com/es4rs7xpk6r3khl6wk4fys9469apxyoy", // Kurs-Buchungsanfrage eingegangen
    buchungBestaetigt:  "", // Kurs-Buchung vom Admin bestätigt
    buchungStorniert:   "", // Kurs-Buchung storniert
    verleihAngefragt:   "", // Verleih-Anfrage eingegangen
    verleihBestaetigt:  "", // Verleih vom Admin bestätigt
    verleihStorniert:   "", // Verleih storniert
  },

  // ── Footer ──
  footer: {
    copyright: "© 2026 Elimente Keramik",
    links: ["Impressum", "Datenschutz", "AGB"]
  }
};
