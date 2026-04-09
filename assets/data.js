/* ============================================================================
 * V7 Padel · assets/data.js
 *
 * Единый модуль для работы с данными v7padel_db через публичный gviz CSV.
 * Подключается на всех страницах ДО локальных <script> блоков. Экспортирует
 * window.V7 с набором функций и констант.
 *
 * Правила (см. brain.html):
 *   - Все константы и ID таблиц — здесь, в шапке файла.
 *   - Общий код (gviz парсер, утилиты) — только здесь, без дублей на страницах.
 *   - Таймаут gviz — 10 секунд. При таймауте — кнопка "Обновить".
 *   - Нет данных = явное сообщение с причиной, никогда вечный спиннер.
 *
 * Источник правды для P&L: pnl_monthly (source=accountant_pnl).
 *   Revenue = level=0, branch=revenue, article_name содержит "доход от деятельности"
 *   OPEX    = branch=expense, article_name содержит "условно-постоянные расходы"
 * ========================================================================= */
(function () {
  if (window.V7) return; // idempotent

  // --- Constants ---
  const SHEET_ID = '1BfRgbVldM6sZUbNxSo77sS5XTaqf9-TKLnoce1jq1UY';
  const GVIZ_BASE = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?tqx=out:csv&sheet=';
  const DEFAULT_TIMEOUT = 10000;

  const REV_CAT_ORDER  = ['Корты и инвентарь', 'Клубные карты', 'Тренировки', 'Турниры', 'Товары', 'Прочее'];
  const REV_CAT_COLORS = ['#0ABAB5', '#7C3AED', '#13c296', '#f39c12', '#5ac8fa', '#8a9ba8'];

  /* -------------------------------------------------------------------------
   * CSV parsing (RFC 4180 minimal: handles quoted fields + "" escaping + CRLF)
   * ----------------------------------------------------------------------- */
  function parseCSV(text) {
    const rows = []; let i = 0, field = '', row = [], inQ = false;
    while (i < text.length) {
      const c = text[i];
      if (inQ) {
        if (c === '"' && text[i+1] === '"') { field += '"'; i += 2; continue; }
        if (c === '"') { inQ = false; i++; continue; }
        field += c; i++; continue;
      }
      if (c === '"') { inQ = true; i++; continue; }
      if (c === ',') { row.push(field); field = ''; i++; continue; }
      if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
      if (c === '\r') { i++; continue; }
      field += c; i++;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    if (!rows.length) return [];
    const headers = rows[0].map(h => (h || '').trim());
    return rows.slice(1)
      .filter(r => r.some(v => v && v.trim()))
      .map(r => {
        const o = {};
        headers.forEach((h, idx) => o[h] = (r[idx] || '').trim());
        return o;
      });
  }

  /* -------------------------------------------------------------------------
   * loadSheet(name, opts?) — fetch + parse, with 10s AbortController timeout.
   * Throws DOMException('AbortError') on timeout, or Error('HTTP NNN') on HTTP errors.
   * ----------------------------------------------------------------------- */
  async function loadSheet(name, opts) {
    opts = opts || {};
    const timeoutMs = opts.timeoutMs || DEFAULT_TIMEOUT;
    const url = GVIZ_BASE + encodeURIComponent(name);
    const ctrl = new AbortController();
    const tmr = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status + ' для ' + name);
      return parseCSV(await r.text());
    } finally {
      clearTimeout(tmr);
    }
  }

  /* -------------------------------------------------------------------------
   * renderReloadNotice(target, err, retryFn)
   * Показывает сообщение об ошибке и кнопку "Обновить".
   * Кнопка >= 44px высоты (мобильные touch targets).
   * ----------------------------------------------------------------------- */
  function renderReloadNotice(target, err, retryFn) {
    if (!target) return;
    const isTimeout = err && (err.name === 'AbortError' || String(err).indexOf('abort') >= 0);
    const msg = isTimeout
      ? 'Google Sheets не ответил за 10 секунд.'
      : 'Не удалось загрузить данные: ' + (err && err.message ? err.message : String(err));
    target.innerHTML =
      '<div style="text-align:center;padding:32px 20px;">' +
        '<div style="color:var(--bad);font-size:13px;margin-bottom:16px;line-height:1.5">⚠ ' + msg + '</div>' +
        '<button type="button" class="v7-reload-btn" style="appearance:none;background:var(--accent);color:#fff;border:0;border-radius:10px;padding:12px 28px;font-size:14px;font-weight:600;cursor:pointer;min-height:44px;font-family:inherit;">Обновить</button>' +
      '</div>';
    const btn = target.querySelector('.v7-reload-btn');
    if (btn && typeof retryFn === 'function') {
      btn.addEventListener('click', retryFn);
    }
  }

  /* -------------------------------------------------------------------------
   * Number + date helpers
   * ----------------------------------------------------------------------- */
  function num(x) {
    if (x == null) return 0;
    const s = String(x)
      .replace(/\s|\u00a0/g, '')
      .replace(/[^\d\-.,]/g, '')
      .replace(/,(\d{1,2})$/, '.$1')
      .replace(/,/g, '');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  function fmt(n) {
    if (!isFinite(n) || n == null) return '—';
    const abs = Math.abs(n);
    if (abs >= 1e6) return (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
    if (abs >= 1e3) return (n / 1e3).toFixed(0) + 'K';
    return n.toFixed(0);
  }
  function fmtMoney(n) { return fmt(n) + ' ₺'; }
  function fmtPct(n)   { return (isFinite(n) ? n.toFixed(1) : '0') + '%'; }
  function fmtSigned(n) {
    if (!isFinite(n) || n == null) return '—';
    const s = n > 0 ? '+' : '';
    return s + fmt(n) + ' ₺';
  }
  function fmtInt(n) {
    if (!isFinite(n) || n == null) return '—';
    return Math.round(n).toLocaleString('ru-RU');
  }

  // parseDate: explicit DD/MM/YYYY priority, then fall back to native Date().
  // Rationale: `new Date("08/04/2026")` in JS is US MM/DD, so August 4 — wrong.
  function parseDate(s) {
    if (!s) return null;
    s = String(s).trim();
    const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    if (m) {
      let [, dd, mm, yy, hh, mi, ss] = m;
      yy = yy.length === 2 ? '20' + yy : yy;
      const dt = new Date(+yy, +mm - 1, +dd, +(hh || 0), +(mi || 0), +(ss || 0));
      if (!isNaN(dt)) return dt;
    }
    const d = new Date(s);
    if (!isNaN(d)) return d;
    return null;
  }

  function ymKey(d) {
    if (!d) return '';
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }
  const MONTHS_RU = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
  function ymLabel(ym) {
    const p = String(ym || '').split('-');
    if (p.length < 2) return ym || '';
    return (MONTHS_RU[(+p[1]) - 1] || p[1]) + ' ' + p[0];
  }

  // Normalized name key for matching customers.name ↔ memberships.holder
  function nameKey(s) {
    return (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function accent() { return cssVar('--accent') || '#0ABAB5'; }

  /* -------------------------------------------------------------------------
   * Domain helpers
   * ----------------------------------------------------------------------- */

  // pnlByMonth(pnl_monthly_rows) -> { 'YYYY-MM': {revenue, opex, pnl} }
  // AUTHORITATIVE — only accountant_pnl, never derived from transactions/expenses.
  function pnlByMonth(rows) {
    const out = {};
    if (!rows || !rows.length) return out;
    rows.forEach(r => {
      const m = r.period_month;
      if (!m || !/^\d{4}-\d{2}$/.test(m)) return;
      if (!out[m]) out[m] = { revenue: 0, opex: 0, pnl: 0 };
      const total = num(r.total);
      const art = (r.article_name || '').toLowerCase();
      const level = String(r.level || '');
      const branch = String(r.branch || '').toLowerCase();
      if (level === '0' && branch === 'revenue' && art.indexOf('доход от деятельности') >= 0) {
        out[m].revenue = total;
      }
      if (branch === 'expense' && art.indexOf('условно-постоянные расходы') >= 0) {
        out[m].opex = Math.abs(total);
      }
    });
    Object.keys(out).forEach(m => { out[m].pnl = out[m].revenue - out[m].opex; });
    return out;
  }

  // categorizeRevenue(category_text) -> one of REV_CAT_ORDER or null (skip)
  function categorizeRevenue(category) {
    const s = (category || '').toString().toLowerCase();
    if (!s) return 'Прочее';
    if (s.indexOf('rent from') >= 0 || s.indexOf('equipment rental') >= 0) return 'Корты и инвентарь';
    if (s.indexOf('club card') >= 0) return 'Клубные карты';
    if (s.indexOf('tournament') >= 0) return 'Турниры';
    if (s.indexOf('training') >= 0 || s.indexOf('individual') >= 0 || s.indexOf('group') >= 0 ||
        s.indexOf('children') >= 0 || s.indexOf('kids') >= 0 || s.indexOf('adult') >= 0) return 'Тренировки';
    if (s.indexOf('sale of goods') >= 0 || s.indexOf('inventory') >= 0 ||
        s.indexOf('giftbox') >= 0 || s.indexOf('accessor') >= 0) return 'Товары';
    if (s.indexOf('internal') >= 0 || s.indexOf('deposit') >= 0) return null; // skip internal movements
    return 'Прочее';
  }

  // Export
  window.V7 = {
    SHEET_ID,
    parseCSV,
    loadSheet,
    renderReloadNotice,
    num, fmt, fmtMoney, fmtPct, fmtSigned, fmtInt,
    parseDate, ymKey, ymLabel, nameKey,
    cssVar, accent,
    pnlByMonth, categorizeRevenue,
    REV_CAT_ORDER, REV_CAT_COLORS
  };
})();
