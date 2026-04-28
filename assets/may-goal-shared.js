/* V7 Padel — shared logic for may-goal page variants.
   Все три layout (v1/v2/v3) используют одинаковые данные, i18n, тему.
   Загружается ПОСЛЕ data.js. Ожидает наличие DOM-элементов с data-i18n
   ключами и render-target id (см. ниже). */

(function() {
  // ===== I18N =====
  var I18N = {
    en: {
      pill: "MAY 2026 · PEAK SEASON",
      title: 'Goal — <span class="accent">40 hours per day</span>',
      sub: "The best month for V7 Padel since opening. Full team. Perfect weather. No rain. Tourists already here. This is our moment.",
      progressLabel: "Current daily average",
      hourPerDay: "h/day",
      targetPrefix: "of",
      targetSuffix: "target",
      bar38: "38 h · bonus zone",
      bar40: "40 h · goal",
      tierStart: "Starts May 1",
      tierGoal: "Goal achieved · 20 000 ₺ each",
      tierMidPrefix: "10 000 ₺ tier locked · ",
      tierMidSuffix: " h to goal",
      tierLowPrefix: "Need ",
      tierLowSuffix: " more h to enter bonus zone",
      paceTopLabel: "Pace to 40 h",
      paceLowLabel: "Pace to 38 h",
      paceExtra: "h/day average for remaining days",
      bonusTitle: "Team bonus — equal for all 7",
      bonusTitleShort: "Bonus tiers",
      lowWhen: '38 — 39.9 h/day',
      lowDescShort: 'better than April',
      lowDesc: "Even if we don't reach 40, this is locked in. Better than any previous month.",
      topWhen: "40+ h/day",
      topDescShort: "the goal",
      topDesc: "A month at the level of April's peak day. This level has never been reached before.",
      motto: 'One club. <span class="accent">One team.</span> One result.',
      mottoShort: 'One team. One result.',
      rulesTitle: "Rules",
      r1: 'The metric is the <b>average daily court hours for the month</b>. Total over 31 days, divided by the number of days played.',
      r2: 'Hours count only from <b>real bookings of paying clients</b>. Maintenance and 0 ₺ club events do not count.',
      r3: 'The bonus is team-wide — <b>same for every one of 7 people</b>.',
      r4: 'Payment: <b>50% in the first week of June</b>, <b>50% at the end of June</b> if June stays at 36 h/day average or higher.',
      r5: 'This page updates daily — check it, adjust the pace.',
      updated: "Updated",
      dashLink: "internal dashboard",
      daysPlayedTpl: "{0} days played · {1} remaining",
      daysToStart: "Until May 1: {0} days",
      todayLabel: "Today's pace target",
      hoursToday: "h today",
      played: "Played",
      remaining: "Remaining",
      days: "days",
      layoutLabel: "Layout",
    },
    ru: {
      pill: "МАЙ 2026 · ПИК СЕЗОНА",
      title: 'Цель — <span class="accent">40 часов в день</span>',
      sub: "Лучший месяц V7 Padel с момента открытия. Команда полностью укомплектована. Погода идеальная. Дождей нет. Туристов уже много. Это наш момент.",
      progressLabel: "Текущая средняя",
      hourPerDay: "ч/день",
      targetPrefix: "из",
      targetSuffix: "цели",
      bar38: "38 ч · бонусная зона",
      bar40: "40 ч · цель",
      tierStart: "Стартуем 1 мая",
      tierGoal: "Цель взята · 20 000 ₺ каждому",
      tierMidPrefix: "В уровне 10 000 ₺ · до цели ещё ",
      tierMidSuffix: " ч",
      tierLowPrefix: "До бонусной зоны ",
      tierLowSuffix: " ч",
      paceTopLabel: "Темп до 40 ч",
      paceLowLabel: "Темп до 38 ч",
      paceExtra: "часов в день в среднем за оставшиеся",
      bonusTitle: "Командный бонус — каждому из 7",
      bonusTitleShort: "Уровни бонуса",
      lowWhen: '38 — 39,9 ч/день',
      lowDescShort: 'лучше апреля',
      lowDesc: "Даже если 40 не дотянем, эта ставка наша. Лучше любого предыдущего месяца.",
      topWhen: "40+ ч/день",
      topDescShort: "цель",
      topDesc: "Месяц на уровне самого пикового дня апреля. Это уровень которого никогда не было.",
      motto: 'Один клуб. <span class="accent">Одна команда.</span> Один результат.',
      mottoShort: 'Одна команда. Один результат.',
      rulesTitle: "Правила",
      r1: 'Метрика — <b>средняя загрузка кортов в часах за день</b> по месяцу. Считается за 31 день, делится на количество отыгранных дней.',
      r2: 'Часы только из <b>реальных бронирований играющих клиентов</b>. Maintenance и клубные ивенты с нулевой ценой не считаются.',
      r3: 'Бонус командный — <b>каждому из 7 человек одинаково</b>.',
      r4: 'Выплата: <b>50% в первую неделю июня</b>, <b>50% в конце июня</b> при условии что июнь не упал ниже 36 ч/день в среднем.',
      r5: 'Эта страница обновляется ежедневно — заходите, смотрите, корректируйте темп.',
      updated: "Обновлено",
      dashLink: "внутренний дашборд",
      daysPlayedTpl: "{0} дн. сыграно · {1} впереди",
      daysToStart: "До старта мая: {0} дн.",
      todayLabel: "Темп на сегодня",
      hoursToday: "ч сегодня",
      played: "Сыграно",
      remaining: "Осталось",
      days: "дн.",
      layoutLabel: "Вариант",
    },
    tr: {
      pill: "MAYIS 2026 · SEZON ZİRVESİ",
      title: 'Hedef — <span class="accent">günde 40 saat</span>',
      sub: "V7 Padel'in açılışından bu yana en iyi ay. Tam kadro takım. Hava mükemmel. Yağmur yok. Turistler şimdiden burada. Bu bizim anımız.",
      progressLabel: "Günlük ortalama",
      hourPerDay: "saat/gün",
      targetPrefix: "hedef",
      targetSuffix: "",
      bar38: "38 saat · bonus bölgesi",
      bar40: "40 saat · hedef",
      tierStart: "1 Mayıs'ta başlıyoruz",
      tierGoal: "Hedefe ulaşıldı · kişi başı 20 000 ₺",
      tierMidPrefix: "10 000 ₺ seviyesinde · hedefe ",
      tierMidSuffix: " saat kaldı",
      tierLowPrefix: "Bonus bölgesine ",
      tierLowSuffix: " saat kaldı",
      paceTopLabel: "40 saate tempo",
      paceLowLabel: "38 saate tempo",
      paceExtra: "kalan günlerde ortalama saat",
      bonusTitle: "Takım bonusu — 7 kişiye eşit",
      bonusTitleShort: "Bonus seviyeleri",
      lowWhen: '38 — 39,9 saat/gün',
      lowDescShort: "Nisan'dan iyi",
      lowDesc: "40'a ulaşamazsak bile bu garantili. Önceki tüm aylardan iyi.",
      topWhen: "40+ saat/gün",
      topDescShort: "hedef",
      topDesc: "Bir ay boyunca Nisan'ın en yoğun günü seviyesi. Bu seviyeye daha önce hiç ulaşılmadı.",
      motto: 'Tek kulüp. <span class="accent">Tek takım.</span> Tek sonuç.',
      mottoShort: 'Tek takım. Tek sonuç.',
      rulesTitle: "Kurallar",
      r1: 'Metrik — <b>kortların aylık günlük ortalama saat doluluğu</b>. 31 günün toplamı, oynanan gün sayısına bölünür.',
      r2: 'Saatler yalnızca <b>ödeme yapan müşterilerin gerçek rezervasyonlarından</b> sayılır. Bakım ve 0 ₺ kulüp etkinlikleri sayılmaz.',
      r3: 'Bonus tüm takıma — <b>7 kişiye eşit miktarda</b>.',
      r4: 'Ödeme: <b>%50 Haziran ilk haftası</b>, <b>%50 Haziran sonunda</b> — Haziran 36 saat/gün ortalamasının altına düşmezse.',
      r5: 'Bu sayfa her gün güncellenir — kontrol edin, tempoyu ayarlayın.',
      updated: "Güncellendi",
      dashLink: "iç panel",
      daysPlayedTpl: "{0} gün oynandı · {1} gün kaldı",
      daysToStart: "1 Mayıs'a kadar: {0} gün",
      todayLabel: "Bugünkü tempo hedefi",
      hoursToday: "saat bugün",
      played: "Oynandı",
      remaining: "Kaldı",
      days: "gün",
      layoutLabel: "Tasarım",
    }
  };

  var CURRENT_LANG = 'en';
  try { CURRENT_LANG = localStorage.getItem('v7lang') || 'en'; } catch(e) {}
  if (!I18N[CURRENT_LANG]) CURRENT_LANG = 'en';

  function applyLang(lang) {
    if (!I18N[lang]) lang = 'en';
    CURRENT_LANG = lang;
    try { localStorage.setItem('v7lang', lang); } catch(e) {}
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var v = I18N[lang][el.dataset.i18n];
      if (v !== undefined) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function(el) {
      var v = I18N[lang][el.dataset.i18nHtml];
      if (v !== undefined) el.innerHTML = v;
    });
    document.querySelectorAll('.lang-switcher button').forEach(function(b) {
      b.classList.toggle('active', b.dataset.lang === lang);
    });
    if (typeof window._renderState === 'function') window._renderState();
  }
  document.querySelectorAll('.lang-switcher button').forEach(function(b) {
    b.addEventListener('click', function() { applyLang(this.dataset.lang); });
  });
  applyLang(CURRENT_LANG);

  // ===== Theme =====
  function applyTheme(theme) {
    if (theme !== 'dark' && theme !== 'light') theme = 'light';
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'tiffany' : 'dark');
    try { localStorage.setItem('v7-theme', theme === 'light' ? 'tiffany' : 'dark'); } catch(e) {}
    document.querySelectorAll('.theme-switcher button').forEach(function(b) {
      b.classList.toggle('active', b.dataset.themeBtn === theme);
    });
  }
  var savedTheme = 'light';
  try {
    var t = localStorage.getItem('v7-theme');
    savedTheme = t === 'dark' ? 'dark' : 'light';
  } catch(e) {}
  document.querySelectorAll('.theme-switcher button').forEach(function(b) {
    b.addEventListener('click', function() { applyTheme(this.dataset.themeBtn); });
  });
  applyTheme(savedTheme);

  // Expose for variant pages
  window._mgI18N = I18N;
  window._mgLang = function() { return CURRENT_LANG; };
  window._mgT = function(key) { return I18N[CURRENT_LANG][key] || I18N.en[key] || key; };
  window._mgTpl = function(key, args) {
    var s = window._mgT(key);
    (args || []).forEach(function(a, i) { s = s.replace('{' + i + '}', a); });
    return s;
  };

  // ===== Data load =====
  var TARGET_MONTH = '2026-05';
  var TARGET_HOURS = 40;
  var LOW_HOURS = 38;
  var DAYS_IN_MONTH = 31;

  function _num(v) {
    if (v == null) return 0;
    var n = parseFloat(String(v).replace(/[^\d.\-]/g, ''));
    return isNaN(n) ? 0 : n;
  }

  window._mgState = { mode: 'pre', avg: 0, days: 0, daysLeft: DAYS_IN_MONTH, sum: 0 };
  window._mgConfig = { TARGET_MONTH: TARGET_MONTH, TARGET_HOURS: TARGET_HOURS, LOW_HOURS: LOW_HOURS, DAYS_IN_MONTH: DAYS_IN_MONTH };

  window._mgLoadData = async function() {
    var now = new Date();
    var mPrefix = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var inMay = mPrefix === TARGET_MONTH;
    if (!inMay) {
      window._mgState = { mode: 'pre', avg: 0, days: 0, daysLeft: DAYS_IN_MONTH, sum: 0 };
      return window._mgState;
    }
    try {
      var rows = await V7.loadSheet('occupancy_daily');
      var todayIso = now.toISOString().slice(0, 10);
      var sum = 0, daysCount = 0;
      (rows || []).forEach(function(r) {
        var d = String(r.date || '').slice(0, 10);
        if (!d.startsWith(TARGET_MONTH) || d > todayIso) return;
        var h = _num(r.hours);
        if (h > 0) { sum += h; daysCount++; }
      });
      window._mgState = {
        mode: 'in',
        avg: daysCount > 0 ? sum / daysCount : 0,
        days: daysCount,
        daysLeft: DAYS_IN_MONTH - now.getDate(),
        sum: sum
      };
      return window._mgState;
    } catch (e) {
      console.error('[may-goal] load failed:', e);
      return null;
    }
  };

  // Helper for tier classification
  window._mgTier = function(avg) {
    if (avg >= TARGET_HOURS) return 'top';
    if (avg >= LOW_HOURS) return 'mid';
    if (avg > 0) return 'low';
    return 'zero';
  };

  // Compute pace for a target
  window._mgPace = function(target) {
    var s = window._mgState;
    if (s.mode === 'pre') return target.toFixed(1);
    if (s.daysLeft <= 0) return '—';
    var stillNeed = Math.max(0, target * DAYS_IN_MONTH - s.sum);
    return (stillNeed / s.daysLeft).toFixed(1);
  };
})();
