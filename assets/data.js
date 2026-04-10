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
 *   - Таймаут gviz — 30 секунд + 1 авто-retry при AbortError. При таймауте — кнопка "Обновить".
 *   - Нет данных = явное сообщение с причиной, никогда вечный спиннер.
 *
 * Источник правды для P&L: NEW_PNL spreadsheet (от бухгалтера, обновляется ежемесячно).
 *   Строка «Доход от деятельности» (row index 1) = Revenue
 *   Строка «Условно-постоянные расходы» (row index 11) = OPEX (absolute)
 *   Строка «Прибыль» (row index 38) = PnL
 *   Месяцы идут колонками: итого на позициях 5,9,13,17,21,25 (Oct→Mar 2025-2026)
 *
 * Старый pnl_monthly в v7padel_db — deprecated, данные читаются из NEW_PNL.
 * ========================================================================= */
(function () {
  if (window.V7) return; // idempotent

  // --- Constants ---
  const SHEET_ID = '1BfRgbVldM6sZUbNxSo77sS5XTaqf9-TKLnoce1jq1UY';
  const CACHE_ID = '1zQAnH-FUlShzWjsy24UWg7Ru2qempWW7Q8GqwFeQES0';
  const NEW_PNL_SHEET_ID = '1wLvhEUAsS08K6LvxSKAx5-soh5NxayMpU3brvd4rQ54';
  const NEW_PNL_GID = '1844112584';
  const GVIZ_BASE = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?tqx=out:csv&sheet=';
  const CACHE_BASE = 'https://docs.google.com/spreadsheets/d/' + CACHE_ID + '/gviz/tq?tqx=out:csv&sheet=';
  const DEFAULT_TIMEOUT = 30000;
  const START_MONTH = '2025-10'; // первый месяц операционных данных клуба
  const MONTHLY_GOAL = 1800000; // целевая выручка в месяц (₺)

  const REV_CAT_ORDER  = ['Корты', 'Инвентарь', 'Клубные карты', 'Тренировки', 'Турниры', 'Товары', 'Прочее'];
  const REV_CAT_COLORS = ['#0ABAB5', '#0e8a87', '#7C3AED', '#13c296', '#f39c12', '#5ac8fa', '#8a9ba8'];

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
   * loadSheet(name, opts?) — fetch + parse, with 30s timeout + 1 auto-retry.
   * Запросы выполняются последовательно (через очередь) чтобы не перегружать
   * Google Sheets API параллельными запросами.
   * ----------------------------------------------------------------------- */
  // Sequential queue to avoid parallel Google Sheets rate limiting
  var _sheetQueue = Promise.resolve();

  async function _fetchSheet(name, timeoutMs) {
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

  async function loadSheet(name, opts) {
    opts = opts || {};
    const timeoutMs = opts.timeoutMs || DEFAULT_TIMEOUT;
    // Queue: each request waits for the previous one to finish
    const job = _sheetQueue.then(async () => {
      try {
        return await _fetchSheet(name, timeoutMs);
      } catch (err) {
        // Auto-retry once on AbortError (timeout) or network failure
        const isRetryable = err.name === 'AbortError' || String(err).indexOf('Failed to fetch') >= 0;
        if (isRetryable) {
          console.warn(name + ': retry after ' + err.name);
          return await _fetchSheet(name, timeoutMs);
        }
        throw err;
      }
    });
    _sheetQueue = job.catch(() => {}); // keep queue alive even on error
    return job;
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
      ? 'Google Sheets не ответил за 30 секунд (после повторной попытки).'
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
  // LEGACY — reads from old pnl_monthly sheet in v7padel_db.
  // Prefer loadPnL() which reads from NEW accountant's spreadsheet.
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

  /* -------------------------------------------------------------------------
   * loadPnL() — reads NEW accountant PnL spreadsheet directly.
   * Returns { 'YYYY-MM': { revenue, opex, pnl, details: {...} } }
   *
   * Sheet structure: months as columns, grouped by 4 (Cashless, Cash, итого, %).
   *   итого columns at indices: 5, 9, 13, 17, 21, 25
   *   Row 1 = «Доход от деятельности» (Revenue)
   *   Row 11 = «Условно-постоянные расходы» (OPEX, negative)
   *   Row 38 = «Прибыль» (PnL)
   *   Rows 2-10 = revenue breakdown (Падел, Bookings, Membership, Classes, etc.)
   *   Rows 12-36 = OPEX breakdown
   * ----------------------------------------------------------------------- */
  // Month mapping: column header prefix → YYYY-MM
  var PNL_MONTH_MAP = {
    'октябрь':  '2025-10',
    'ноябрь':   '2025-11',
    'декабрь':  '2025-12',
    'январь':   '2026-01',
    'февраль':  '2026-02',
    'март':     '2026-03',
    'апрель':   '2026-04',
    'май':      '2026-05',
    'июнь':     '2026-06',
    'июль':     '2026-07',
    'август':   '2026-08',
    'сентябрь': '2026-09'
  };

  async function loadPnL(opts) {
    opts = opts || {};
    var timeoutMs = opts.timeoutMs || DEFAULT_TIMEOUT;
    var url = 'https://docs.google.com/spreadsheets/d/' + NEW_PNL_SHEET_ID +
              '/gviz/tq?tqx=out:csv&gid=' + NEW_PNL_GID;

    async function _fetchPnL() {
      var ctrl = new AbortController();
      var tmr = setTimeout(function() { ctrl.abort(); }, timeoutMs);
      try {
        var r = await fetch(url, { signal: ctrl.signal });
        if (!r.ok) throw new Error('HTTP ' + r.status + ' для PnL');
        return await r.text();
      } finally {
        clearTimeout(tmr);
      }
    }

    // PnL fetch also goes through the sequential queue
    var text;
    var pnlJob = _sheetQueue.then(async () => {
      try {
        return await _fetchPnL();
      } catch (err) {
        var isRetryable = err.name === 'AbortError' || String(err).indexOf('Failed to fetch') >= 0;
        if (isRetryable) {
          console.warn('PnL: retry after ' + err.name);
          return await _fetchPnL();
        }
        throw err;
      }
    });
    _sheetQueue = pnlJob.catch(() => {});
    text = await pnlJob;

    // Parse CSV into raw 2D array
    var lines = text.replace(/\r/g, '').split('\n');
    var rawRows = [];
    // Simple CSV parse for this specific file
    for (var li = 0; li < lines.length; li++) {
      var line = lines[li];
      if (!line.trim()) continue;
      var cells = [];
      var inQ = false, field = '';
      for (var ci = 0; ci < line.length; ci++) {
        var ch = line[ci];
        if (inQ) {
          if (ch === '"' && line[ci+1] === '"') { field += '"'; ci++; }
          else if (ch === '"') { inQ = false; }
          else { field += ch; }
        } else {
          if (ch === '"') { inQ = true; }
          else if (ch === ',') { cells.push(field); field = ''; }
          else { field += ch; }
        }
      }
      cells.push(field);
      rawRows.push(cells);
    }

    if (rawRows.length < 2) return {};

    // Detect month columns: find «итого» positions from header
    var header = rawRows[0];
    var months = []; // [{ym:'2025-10', col: 5}, ...]
    for (var hi = 3; hi < header.length; hi += 4) {
      var htext = (header[hi] || '').toLowerCase().trim();
      // Extract month name (first word before "cashless")
      var monthName = htext.replace(/\s*cashless.*/, '').trim();
      var ym = PNL_MONTH_MAP[monthName];
      if (ym) {
        months.push({ ym: ym, col: hi + 2 }); // +2 = итого column (3rd in group)
      }
    }

    // Extract values
    var out = {};
    // Row indices (0-based after header): row1=Revenue, row11=OPEX, row38=PnL
    // Article name is in col 2
    var REV_ROW = -1, OPEX_ROW = -1, PNL_ROW = -1;
    // Revenue detail rows
    var DETAIL_MAP = {}; // rowIdx -> key

    for (var ri = 1; ri < rawRows.length; ri++) {
      var art = (rawRows[ri][2] || '').trim().toLowerCase();
      if (art.indexOf('доход от деятельности') >= 0 && REV_ROW < 0) REV_ROW = ri;
      if (art.indexOf('условно-постоянные расход') >= 0 && OPEX_ROW < 0) OPEX_ROW = ri;
      if (art.indexOf('прибыль') >= 0 && PNL_ROW < 0) PNL_ROW = ri;

      // Revenue breakdown
      var code = (rawRows[ri][1] || '').trim();
      if (code === '01 -') DETAIL_MAP[ri] = 'padel';
      if (code === '01.10 -') DETAIL_MAP[ri] = 'bookings';
      if (code === '01.20 -') DETAIL_MAP[ri] = 'membership';
      if (code === '01.30 -') DETAIL_MAP[ri] = 'classes';
      if (code === '01.50 -') DETAIL_MAP[ri] = 'vouchers';
      if (code === '02 -') DETAIL_MAP[ri] = 'tournaments';
      if (code === '030 -' || code === '03 -') {
        if (art.indexOf('чистый') >= 0) DETAIL_MAP[ri] = 'goods_net';
        else DETAIL_MAP[ri] = 'goods_gross';
      }
      // OPEX breakdown
      if (code === '04.40 -') DETAIL_MAP[ri] = 'utilities';
      if (code === '04.50 -') DETAIL_MAP[ri] = 'marketing';
      if (code === '04.70 -') DETAIL_MAP[ri] = 'staff';
      if (code === '04.80 -') DETAIL_MAP[ri] = 'taxes';
      if (code === '04.10 -') DETAIL_MAP[ri] = 'admin';
      if (code === '04.20 -') DETAIL_MAP[ri] = 'bank';
      if (code === '04.30 -') DETAIL_MAP[ri] = 'investments';
    }

    months.forEach(function(mo) {
      var d = { revenue: 0, opex: 0, pnl: 0, details: {} };
      if (REV_ROW >= 0) d.revenue = num(rawRows[REV_ROW][mo.col]);
      if (OPEX_ROW >= 0) d.opex = Math.abs(num(rawRows[OPEX_ROW][mo.col]));
      if (PNL_ROW >= 0) d.pnl = num(rawRows[PNL_ROW][mo.col]);

      // Fill details
      Object.keys(DETAIL_MAP).forEach(function(ri) {
        var key = DETAIL_MAP[ri];
        var val = num((rawRows[+ri] || [])[mo.col]);
        d.details[key] = val;
      });

      out[mo.ym] = d;
    });

    // --- Fill current month from transactions + expenses if PnL is missing ---
    var now = new Date();
    var curYM = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    if (!out[curYM]) {
      try {
        var txRows = await loadSheet('transactions');
        var exRows = await loadSheet('expenses');

        var rev = 0, details = {};
        txRows.forEach(function(r) {
          if (r.month !== curYM) return;
          var t = num(r.total);
          rev += t;
          // Categorize revenue details
          var cat = (r.category || '').toLowerCase();
          if (cat.indexOf('tournament') >= 0) details.tournaments = (details.tournaments || 0) + t;
          else if (cat.indexOf('club card') >= 0 || cat.indexOf('membership') >= 0) details.membership = (details.membership || 0) + t;
          else if (cat.indexOf('training') >= 0 || cat.indexOf('individual') >= 0 || cat.indexOf('group') >= 0 || cat.indexOf('children') >= 0 || cat.indexOf('kids') >= 0) details.classes = (details.classes || 0) + t;
          else if (cat.indexOf('sale of goods') >= 0 || cat.indexOf('inventory') >= 0) details.goods_gross = (details.goods_gross || 0) + t;
          else if (cat.indexOf('rent from') >= 0 || cat.indexOf('equipment') >= 0 || cat.indexOf('booking') >= 0) details.bookings = (details.bookings || 0) + t;
          else details.padel = (details.padel || 0) + t;
        });

        var opex = 0;
        exRows.forEach(function(r) {
          if (r.month !== curYM) return;
          var src = (r.source || '').toLowerCase();
          // Skip payroll for live month — staff list is unstable, wait for accountant PnL
          if (src === 'payroll') return;
          var a = num(r.amount);
          // Exclude capex
          if ((r.capex_flag || '').toLowerCase() === 'true' || (r.capex_flag || '') === '1') return;
          opex += Math.abs(a);
          // Categorize expenses
          var item = (r.category || r.item || '').toLowerCase();
          if (item.indexOf('market') >= 0 || item.indexOf('реклам') >= 0) details.marketing = (details.marketing || 0) + Math.abs(a);
          else if (item.indexOf('utility') >= 0 || item.indexOf('electric') >= 0 || item.indexOf('water') >= 0) details.utilities = (details.utilities || 0) + Math.abs(a);
          else details.admin = (details.admin || 0) + Math.abs(a);
        });

        out[curYM] = {
          revenue: rev,
          opex: opex,
          pnl: rev - opex,
          details: details,
          source: 'live'  // marker: this month is from transactions, not accountant PnL
        };
      } catch (e) {
        console.warn('loadPnL: failed to fill current month from transactions:', e);
      }
    }

    return out;
  }

  // categorizeRevenue(category_text) -> one of REV_CAT_ORDER or null (skip)
  function categorizeRevenue(category) {
    const s = (category || '').toString().toLowerCase();
    if (!s) return 'Прочее';
    if (s.indexOf('rent from') >= 0) return 'Корты';
    if (s.indexOf('equipment rental') >= 0 || s.indexOf('equipment') >= 0) return 'Инвентарь';
    if (s.indexOf('club card') >= 0) return 'Клубные карты';
    if (s.indexOf('tournament') >= 0) return 'Турниры';
    if (s.indexOf('training') >= 0 || s.indexOf('individual') >= 0 || s.indexOf('group') >= 0 ||
        s.indexOf('children') >= 0 || s.indexOf('kids') >= 0 || s.indexOf('adult') >= 0) return 'Тренировки';
    if (s.indexOf('sale of goods') >= 0 || s.indexOf('inventory') >= 0 ||
        s.indexOf('giftbox') >= 0 || s.indexOf('accessor') >= 0) return 'Товары';
    if (s.indexOf('internal') >= 0 || s.indexOf('deposit') >= 0) return null; // skip internal movements
    return 'Прочее';
  }

  /* -------------------------------------------------------------------------
   * CACHE: fast pre-aggregated data from v7padel_cache (built by ETL).
   * loadFullCache() → {kpis, series, revMix, liabilities} or null
   * 4 parallel requests to tiny sheets — all data for dashboard in <2s.
   * ----------------------------------------------------------------------- */
  async function _fetchCacheTab(tab) {
    var url = CACHE_BASE + encodeURIComponent(tab);
    var ctrl = new AbortController();
    var tmr = setTimeout(function() { ctrl.abort(); }, 10000);
    try {
      var r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) return null;
      return parseCSV(await r.text());
    } catch (e) {
      return null;
    } finally {
      clearTimeout(tmr);
    }
  }

  async function loadFullCache() {
    try {
      var results = await Promise.all([
        _fetchCacheTab('dashboard_kpis'),
        _fetchCacheTab('monthly_series'),
        _fetchCacheTab('rev_mix'),
        _fetchCacheTab('liabilities')
      ]);
      var kpiRows = results[0], seriesRows = results[1], mixRows = results[2], liabRows = results[3];

      // KPIs
      if (!kpiRows || !kpiRows.length) return null;
      var kpis = kpiRows[0];
      ['revenue_last_month','opex_last_month','pnl_last_month',
       'clients_total','clients_new_30d','bookings_30d',
       'memberships_club','memberships_vip','memberships_total',
       'liabilities_total'].forEach(function(k) {
        if (kpis[k] !== undefined) kpis[k] = num(kpis[k]);
      });

      // Monthly series
      var series = [];
      if (seriesRows) {
        series = seriesRows.map(function(r) {
          return {
            period_month: r.period_month,
            revenue: num(r.revenue), opex: num(r.opex), pnl: num(r.pnl),
            courts_p1: num(r.courts_p1), courts_p2: num(r.courts_p2),
            courts_p3: num(r.courts_p3), courts_p4: num(r.courts_p4),
            clients_new: num(r.clients_new), clients_cumulative: num(r.clients_cumulative)
          };
        });
      }

      // Rev mix
      var revMix = [];
      if (mixRows) {
        revMix = mixRows.map(function(r) { return { category: r.category, amount: num(r.amount) }; });
      }

      // Liabilities
      var liabilities = [];
      if (liabRows) {
        liabilities = liabRows.map(function(r) {
          return { date: r.date, creditor: r.creditor, description: r.description, amount: num(r.amount) };
        });
      }

      return { kpis: kpis, series: series, revMix: revMix, liabilities: liabilities };
    } catch (e) {
      console.warn('loadFullCache failed:', e);
      return null;
    }
  }

  // Legacy compat
  async function loadCache() {
    var full = await loadFullCache();
    return full ? full.kpis : null;
  }
  async function loadCacheSeries() {
    var full = await loadFullCache();
    if (!full) return null;
    var out = {};
    full.series.forEach(function(r) { out[r.period_month] = r; });
    return out;
  }

  // Generic cache tab loader (for page-specific cache tabs)
  async function loadCacheTab(tabName) {
    var rows = await _fetchCacheTab(tabName);
    return rows || [];
  }

  // Export
  window.V7 = {
    SHEET_ID,
    CACHE_ID,
    NEW_PNL_SHEET_ID,
    START_MONTH,
    MONTHLY_GOAL,
    parseCSV,
    loadSheet,
    loadPnL,
    loadCache,
    loadCacheSeries,
    loadFullCache,
    loadCacheTab,
    renderReloadNotice,
    num, fmt, fmtMoney, fmtPct, fmtSigned, fmtInt,
    parseDate, ymKey, ymLabel, nameKey,
    cssVar, accent,
    pnlByMonth, categorizeRevenue,
    REV_CAT_ORDER, REV_CAT_COLORS
  };
})();
