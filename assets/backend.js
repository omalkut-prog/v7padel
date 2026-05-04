/**
 * V7 Backend client — wrapper для https://backend-production-7989f.up.railway.app
 *
 * Хранит JWT в sessionStorage (одной сессии). Login происходит автоматически
 * с тем же паролем что в login.html — пользователь не видит лишнего шага.
 *
 * Usage:
 *   await V7Backend.notes.list(38)            → list[note]
 *   await V7Backend.notes.create(38, 'text')  → {id, ...}
 *   await V7Backend.notes.delete(noteId)
 *   await V7Backend.tags.list(38)             → list[tag]
 *   await V7Backend.tags.create(38, 'VIP')
 *   await V7Backend.contactLog.create(38, {channel, direction, result, note})
 *   await V7Backend.client(38)                → full profile
 */
(function() {
  var BASE = 'https://backend-production-7989f.up.railway.app';
  var TOKEN_KEY = 'v7-backend-jwt';

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  function setToken(t) {
    sessionStorage.setItem(TOKEN_KEY, t);
  }

  /**
   * Auto-login: если нет JWT, делаем login с паролем из v7auth (login.html).
   * Если v7auth.password нет (другая роль или не залогинен) — используем admin как fallback.
   */
  async function ensureAuth() {
    var t = getToken();
    if (t) {
      // Quick test if token still valid
      try {
        var r = await fetch(BASE + '/api/auth/me', {
          headers: { 'Authorization': 'Bearer ' + t }
        });
        if (r.ok) return t;
      } catch (e) {}
    }
    // Login заново. Берём пароль из sessionStorage v7-password (login.html
    // должен сохранять его на момент сессии).
    var pwd = sessionStorage.getItem('v7-password');
    if (!pwd) {
      // Без пароля — пользователь не залогинен в site. Выходим.
      console.warn('[v7backend] No v7-password in session — login.html не залогинил');
      return null;
    }
    var resp = await fetch(BASE + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd })
    });
    if (!resp.ok) {
      console.warn('[v7backend] Login failed:', resp.status);
      return null;
    }
    var data = await resp.json();
    setToken(data.token);
    return data.token;
  }

  async function apiFetch(method, path, body) {
    var token = await ensureAuth();
    if (!token) throw new Error('Not authenticated');
    // AbortController — timeout 12 сек, чтобы Railway cold start (~5-8s) укладывался,
    // но если сервер реально завис — не висим бесконечно (страница не зависает).
    var ctl = new AbortController();
    var to = setTimeout(() => ctl.abort(), 12000);
    var resp = await fetch(BASE + path, {
      method: method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctl.signal,
    }).finally(() => clearTimeout(to));
    if (resp.status === 401) {
      // token expired
      sessionStorage.removeItem(TOKEN_KEY);
      throw new Error('401 — re-login required');
    }
    if (!resp.ok) {
      var txt = await resp.text();
      throw new Error('API ' + resp.status + ': ' + txt);
    }
    if (resp.status === 204) return null;
    return await resp.json();
  }

  window.V7Backend = {
    BASE: BASE,
    notes: {
      list: function(cid) { return apiFetch('GET', '/api/notes/' + cid); },
      create: function(cid, text) { return apiFetch('POST', '/api/notes', { cid: cid, text: text }); },
      delete: function(noteId) { return apiFetch('DELETE', '/api/notes/' + noteId); },
    },
    tags: {
      list: function(cid) {
        return apiFetch('GET', '/api/client/' + cid).then(function(c) { return c.crm ? c.crm.tags || [] : []; });
      },
      create: function(cid, tag) { return apiFetch('POST', '/api/tags', { cid: cid, tag: tag }); },
      delete: function(tagId) { return apiFetch('DELETE', '/api/tags/' + tagId); },
    },
    contactLog: {
      create: function(cid, data) {
        return apiFetch('POST', '/api/contact_log', Object.assign({ cid: cid }, data));
      },
    },
    client: function(cid) { return apiFetch('GET', '/api/client/' + cid); },
    cache: function(tab) { return apiFetch('GET', '/api/cache/' + tab); },
    db: function(tab) { return apiFetch('GET', '/api/db/' + tab); },
  };
})();
