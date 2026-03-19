import { Page } from '@playwright/test';

// ── Supabase Mock-Bibliothek ──────────────────────────────
// Minimale Implementierung: macht echte fetch-Anfragen an window.location.origin
// damit page.route('**/rest/v1/**') greifen kann.
export const SUPABASE_MOCK_JS = `
(function() {
  var BASE = window.location.origin;

  function makeQuery(table) {
    var _method = 'GET';
    var _params = [];
    var _body = null;
    var _eqFilters = {};

    function buildUrl() {
      var qs = _params.join('&');
      var eqPart = Object.keys(_eqFilters).map(function(k){ return k + '=eq.' + _eqFilters[k]; }).join('&');
      var full = [qs, eqPart].filter(Boolean).join('&');
      return BASE + '/rest/v1/' + table + (full ? '?' + full : '');
    }

    function doFetch() {
      var opts = { method: _method, headers: { 'Content-Type': 'application/json', 'apikey': 'mock', 'Authorization': 'Bearer mock' } };
      if (_body !== null) opts.body = JSON.stringify(_body);
      return fetch(buildUrl(), opts).then(function(r) {
        if (r.status === 204) return { data: [], error: null };
        return r.json().then(function(data) { return { data: data, error: null }; });
      }).catch(function(e) { return { data: null, error: e }; });
    }

    var q = {
      select:  function(s) { _params.push('select=' + (s||'*')); return q; },
      insert:  function(rows) { _method='POST'; _body=rows; return doFetch(); },
      update:  function(vals) { _method='PATCH'; _body=vals; return q; },
      delete:  function() { _method='DELETE'; return q; },
      upsert:  function(rows) { _method='POST'; _body=rows; return doFetch(); },
      eq:      function(col, val) { _eqFilters[col]=val; return q; },
      neq:     function() { return q; },
      gte:     function(col, val) { _params.push(col + '=gte.' + val); return q; },
      lte:     function(col, val) { _params.push(col + '=lte.' + val); return q; },
      order:   function() { return q; },
      limit:   function() { return q; },
      single:  function() { return doFetch().then(function(r){ return { data: Array.isArray(r.data) ? r.data[0]||null : r.data, error: null }; }); },
      then:    function(resolve, reject) { return doFetch().then(resolve, reject); }
    };
    return q;
  }

  function createClient(url, key) {
    var client = {
      auth: {
        onAuthStateChange: function(cb) {
          setTimeout(function() { cb('INITIAL_SESSION', null); }, 50);
          return { data: { subscription: { unsubscribe: function(){} } } };
        },
        signInWithPassword: function(creds) {
          return Promise.resolve({ data: null, error: { message: 'Mock: no auth' } });
        },
        signOut: function() {
          return Promise.resolve({ error: null });
        },
        getSession: function() {
          return Promise.resolve({ data: { session: null }, error: null });
        }
      },
      from: function(table) {
        return makeQuery(table);
      },
      rpc: function(fn, args) {
        return fetch(BASE + '/rest/v1/rpc/' + fn, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': 'mock', 'Authorization': 'Bearer mock' },
          body: JSON.stringify(args || {})
        }).then(function(r) {
          if (r.status === 204) return { data: null, error: null };
          return r.json().then(function(data) { return { data: data, error: null }; });
        }).catch(function(e) { return { data: null, error: e }; });
      },
      storage: {
        from: function() {
          return {
            upload: function() { return Promise.resolve({ data: {}, error: null }); },
            remove: function() { return Promise.resolve({ data: {}, error: null }); },
            getPublicUrl: function() { return { data: { publicUrl: '' } }; }
          };
        }
      }
    };
    return client;
  }

  window.supabase = { createClient: createClient };
})();
`;

// Supabase-Anfragen mocken – verhindert echte DB-Zugriffe in Tests
// Setzt auch window.SUPABASE_URL damit der Kalender gerendert wird
export async function mockSupabase(page: Page) {
  // CDN durch lokale Mock-Bibliothek ersetzen (kein Netzwerkzugriff nötig)
  await page.route('https://cdn.jsdelivr.net/**', async route => {
    await route.fulfill({ contentType: 'application/javascript', body: SUPABASE_MOCK_JS });
  });
  // Google Fonts blocken (kein Netzwerkzugriff in Tests)
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://fonts.gstatic.com/**', route => route.abort());

  // window.SUPABASE_URL auf localhost setzen, damit der init-Check nicht "DEINE..." sieht
  await page.addInitScript(() => {
    (window as any).SUPABASE_URL = window.location.origin;
    (window as any).SUPABASE_ANON_KEY = 'mock-key';
  });

  // REST-Anfragen der Mock-Bibliothek abfangen
  await page.route('**/rest/v1/**', async route => {
    const url = route.request().url();

    // Verleih-Buchungen: leere Liste zurückgeben
    if (url.includes('verleih_buchungen')) {
      await route.fulfill({ json: [] });
      return;
    }
    // Kurs-Termine: Beispieldaten
    if (url.includes('kurs_termine')) {
      await route.fulfill({
        json: [
          {
            id: 'termin-1',
            datum: '2026-04-15',
            uhrzeit_start: '10:00:00',
            max_teilnehmer: 8,
            buchungen_count: 2,
            status: 'offen',
            notiz: null,
            kurs_typen: { name: 'Einführungskurs', id: 'typ-1' }
          },
          {
            id: 'termin-voll',
            datum: '2026-04-22',
            uhrzeit_start: '14:00:00',
            max_teilnehmer: 6,
            buchungen_count: 6,
            status: 'voll',
            notiz: null,
            kurs_typen: { name: 'Fortgeschrittene', id: 'typ-2' }
          }
        ]
      });
      return;
    }
    // Kurs-Typen
    if (url.includes('kurs_typen')) {
      await route.fulfill({
        json: [
          { id: 'typ-1', name: 'Einführungskurs', aktiv: true, sort_order: 1 },
          { id: 'typ-2', name: 'Fortgeschrittene', aktiv: true, sort_order: 2 }
        ]
      });
      return;
    }
    // Site-Texte: leere Antwort
    if (url.includes('site_texte')) {
      await route.fulfill({ json: [] });
      return;
    }
    // Galerie-Bilder: leere Liste
    if (url.includes('galerie_bilder')) {
      await route.fulfill({ json: [] });
      return;
    }
    // Alles andere: leere Antwort
    await route.fulfill({ json: [] });
  });

  // Supabase RPC-Aufrufe mocken
  await page.route('**/rest/v1/rpc/**', async route => {
    await route.fulfill({ json: { success: true } });
  });
}

// Cookie-Einwilligung direkt in localStorage setzen (Banner überspringen)
export async function setCookieConsent(page: Page, value: 'all' | 'necessary') {
  await page.addInitScript(v => {
    localStorage.setItem('elimente_cookie_consent', v);
  }, value);
}

// Cookie-Einwilligung aus localStorage entfernen (Banner anzeigen)
export async function clearCookieConsent(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem('elimente_cookie_consent');
  });
}
