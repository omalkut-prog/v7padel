/**
 * V7 Padel — Sidebar Navigation (Notion/Linear style)
 * Dynamically generates sidebar with grouped items, role filtering, icons.
 * Replaces hardcoded <nav> on every page.
 *
 * Usage: include <link rel="stylesheet" href="assets/sidebar.css"> and
 *        <script src="assets/sidebar.js"></script> AFTER auth-guard.js
 */
(function() {
  var role = sessionStorage.getItem('v7role') || 'admin';

  // ── SVG Icons (18×18, stroke-based) ──
  var ICONS = {
    home:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    dashboard:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    revenue: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    finance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
    audit:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    clients: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    tournaments:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
    management:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    data:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
    team:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    brain:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 0-7 7c0 3.5 2.5 6 4.5 7.5L12 22l2.5-5.5C16.5 15 19 12.5 19 9a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>',
    knowledge:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    schedule:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    calculator:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="12" y1="18" x2="12" y2="18.01"/><line x1="16" y1="18" x2="16" y2="18.01"/><line x1="8" y1="10" x2="16" y2="10"/></svg>',
    collapse:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>',
    menu:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    recall:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    members: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.39 4.84L20 7.77l-4 3.9.94 5.5L12 14.55l-4.94 2.6L8 11.67 4 7.77l5.61-.93z"/></svg>',
  };

  // ── Navigation structure: groups → items ──
  // roles: which roles can see this item (empty = all)
  var NAV = [
    { group: 'Обзор', items: [
      { label: 'Главная',   href: 'index.html',     icon: 'home',      roles: ['admin'] },
      { label: 'Дашборд',   href: 'dashboard.html',  icon: 'dashboard', roles: ['admin'] },
    ]},
    { group: 'Бизнес', roles: ['admin'], items: [
      { label: 'Выручка',  href: 'revenue.html',    icon: 'revenue',   roles: ['admin'] },
      { label: 'Финансы',  href: 'finance.html',    icon: 'finance',   roles: ['admin'] },
      { label: 'Аудит',    href: 'audit.html',      icon: 'audit',     roles: ['admin'] },
    ]},
    { group: 'Клуб', items: [
      { label: 'Клиенты',    href: 'clients.html',             icon: 'clients',     roles: ['admin', 'manager', 'coach', 'administrator'] },
      { label: 'Участники',  href: 'club-members.html',        icon: 'members',     roles: ['admin', 'manager'] },
      { label: 'Recall',     href: 'recall.html',              icon: 'recall',      roles: ['admin', 'manager'] },
      { label: 'Турниры',    href: 'tournament-analytics.html', icon: 'tournaments', roles: ['admin', 'manager', 'coach', 'administrator'] },
      { label: 'Управление', href: 'management.html',          icon: 'management',  roles: ['admin'] },
      { label: 'Команда',    href: 'team.html',                icon: 'team',        roles: ['admin'], cls: 'team-link' },
    ]},
    { group: 'Инструменты', items: [
      { label: 'Данные',      href: 'data.html',                 icon: 'data',       roles: ['admin'] },
      { label: 'Brain',       href: 'brain.html',                icon: 'brain',      roles: ['admin'], cls: 'brain-link' },
      { label: 'База знаний', href: 'brain.html',                icon: 'knowledge',  roles: ['admin', 'manager', 'coach', 'administrator'] },
      { label: 'Расписание',  href: 'schedule-builder.html',     icon: 'schedule',   roles: ['admin', 'manager', 'coach', 'administrator'] },
      { label: 'Калькулятор', href: 'club-coach-calculator.html', icon: 'calculator', roles: ['admin', 'manager', 'coach', 'administrator'] },
    ]},
  ];

  // ── Role labels ──
  var ROLE_LABELS = { admin: 'Admin', manager: 'Менеджер', coach: 'Тренер', administrator: 'Администратор' };
  var ROLE_SHORT  = { admin: 'A', manager: 'M', coach: 'T', administrator: 'A' };

  // ── Detect current page ──
  var PAGE = location.pathname.split('/').pop() || 'index.html';
  if (PAGE === '') PAGE = 'index.html';

  // Tournament subpages → highlight "Турниры"
  var TOURNAMENT_PAGES = ['tournament-analytics.html', 'tournament-calendar.html', 'tournament-list.html', 'tournament-tools.html', 'campspaine.html'];
  var activePage = PAGE;
  if (TOURNAMENT_PAGES.indexOf(PAGE) !== -1) activePage = 'tournament-analytics.html';

  // ── Skip sidebar on role dashboard pages (they have their own nav) ──
  var ROLE_DASHBOARDS = ['admin-dashboard.html', 'coach-dashboard.html', 'manager-dashboard.html',
                         'admin-kpi.html', 'admin-tasks.html', 'admin-schedule.html', 'admin-checklists.html',
                         'coach-kpi.html', 'coach-tasks.html', 'coach-schedule.html', 'coach-checklists.html',
                         'manager-kpi.html', 'manager-tasks.html', 'manager-schedule.html', 'manager-checklists.html',
                         'login.html'];
  if (ROLE_DASHBOARDS.indexOf(PAGE) !== -1) return;

  // ── Build sidebar HTML ──
  var html = '';

  // Header
  html += '<div class="sb-header">';
  html += '  <a class="sb-logo" href="index.html"><span class="sb-logo-icon">V7</span><span class="sb-logo-text"><em>Padel</em></span></a>';
  html += '  <button class="sb-toggle" title="Свернуть">' + ICONS.collapse + '</button>';
  html += '</div>';

  // Nav groups
  html += '<div class="sb-nav">';
  NAV.forEach(function(g) {
    // Skip entire group if role doesn't match
    if (g.roles && g.roles.indexOf(role) === -1) return;

    var visibleItems = g.items.filter(function(it) {
      return !it.roles || it.roles.length === 0 || it.roles.indexOf(role) !== -1;
    });
    if (!visibleItems.length) return;

    html += '<div class="sb-group">';
    html += '  <div class="sb-group-label">' + g.group + '</div>';
    visibleItems.forEach(function(it) {
      var isActive = (it.href === activePage);
      var cls = 'sb-item' + (isActive ? ' active' : '') + (it.cls ? ' ' + it.cls : '');
      html += '<a class="' + cls + '" href="' + it.href + '" data-tip="' + it.label + '">';
      html += '  <span class="sb-item-icon">' + (ICONS[it.icon] || '') + '</span>';
      html += '  <span class="sb-item-label">' + it.label + '</span>';
      html += '</a>';
    });
    html += '</div>';
  });
  html += '</div>';

  // Footer
  var REFRESH_ICON = '<svg class="sb-refresh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/></svg>';
  html += '<div class="sb-footer">';
  html += '  <div class="sb-role" data-short="' + (ROLE_SHORT[role] || 'U') + '">' + (ROLE_LABELS[role] || role) + '</div>';
  html += '  <button class="sb-refresh" id="sb-refresh-btn" title="Обновить данные (Lite — сбросить кеш и перезагрузить)">' + REFRESH_ICON + '<span class="sb-refresh-label">Обновить</span></button>';
  html += '  <button class="sb-logout" onclick="sessionStorage.clear();location.href=\'login.html\'">Выйти</button>';
  html += '</div>';

  // ── Insert into DOM ──
  // Remove old <nav> if present (Type B nav)
  var oldNav = document.querySelector('nav');
  if (oldNav) {
    // Check if it's a Type B nav (has .nav-links) — remove it
    if (oldNav.querySelector('.nav-links')) {
      oldNav.remove();
    }
  }

  // Create sidebar element
  var sidebar = document.createElement('aside');
  sidebar.className = 'v7-sidebar';
  sidebar.innerHTML = html;
  document.body.insertBefore(sidebar, document.body.firstChild);

  // Wrap remaining content in .v7-page (if not already)
  if (!document.querySelector('.v7-page')) {
    var pageWrap = document.createElement('div');
    pageWrap.className = 'v7-page';
    while (sidebar.nextSibling) {
      pageWrap.appendChild(sidebar.nextSibling);
    }
    document.body.appendChild(pageWrap);
  }

  // Mobile overlay
  var overlay = document.createElement('div');
  overlay.className = 'sb-overlay';
  document.body.appendChild(overlay);

  // Mobile hamburger
  var mobileBtn = document.createElement('button');
  mobileBtn.className = 'sb-mobile-toggle';
  mobileBtn.innerHTML = ICONS.menu;
  document.body.appendChild(mobileBtn);

  // ── Collapse state (persist in localStorage) ──
  var COLLAPSE_KEY = 'v7-sidebar-collapsed';
  if (localStorage.getItem(COLLAPSE_KEY) === '1') {
    sidebar.classList.add('collapsed');
  }

  sidebar.querySelector('.sb-toggle').addEventListener('click', function() {
    sidebar.classList.toggle('collapsed');
    localStorage.setItem(COLLAPSE_KEY, sidebar.classList.contains('collapsed') ? '1' : '0');
  });

  // ── Mobile toggle ──
  mobileBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    sidebar.classList.toggle('mobile-open');
  });
  overlay.addEventListener('click', function() {
    sidebar.classList.remove('mobile-open');
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') sidebar.classList.remove('mobile-open');
  });
  // Close mobile on link click
  sidebar.addEventListener('click', function(e) {
    if (e.target.closest('.sb-item') && window.innerWidth <= 768) {
      sidebar.classList.remove('mobile-open');
    }
  });

  // ── Remove old nav.js logout button if it was added ──
  var oldLogout = document.getElementById('nav-logout-btn');
  if (oldLogout) oldLogout.remove();

  // ── Lite refresh: clear IndexedDB cache, then reload ──
  var refreshBtn = document.getElementById('sb-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
      if (refreshBtn.disabled) return;
      refreshBtn.disabled = true;
      refreshBtn.classList.add('spinning');
      var labelEl = refreshBtn.querySelector('.sb-refresh-label');
      if (labelEl) labelEl.textContent = 'Обновляю…';
      var finish = function() {
        try {
          // cache-bust: force reload ignoring HTTP cache
          location.reload();
        } catch(e) { location.href = location.href; }
      };
      try {
        if (window.V7 && typeof window.V7.clearCache === 'function') {
          Promise.resolve(window.V7.clearCache()).then(finish, finish);
        } else {
          // Fallback: drop the whole IDB DB by name
          if (window.indexedDB && indexedDB.deleteDatabase) {
            var req = indexedDB.deleteDatabase('v7_cache');
            req.onsuccess = finish; req.onerror = finish; req.onblocked = finish;
          } else {
            finish();
          }
        }
      } catch(e) { finish(); }
    });
  }

})();
