(function() {
  // ── Parse current location: support both root (page.html) and subfolder (folder/page.html) ──
  var segs = location.pathname.split('/').filter(Boolean);
  var last = segs.length ? segs[segs.length - 1] : '';
  var isFile = /\.html?$/i.test(last);
  var PAGE = isFile ? last : 'index.html';
  var FOLDER = isFile ? (segs.length >= 2 ? segs[segs.length - 2] : '') : last;
  // Full key used for ACCESS lookups: "playbook/index.html" when inside /playbook/, "dashboard.html" at root
  var KEY = FOLDER ? (FOLDER + '/' + PAGE) : PAGE;
  // Prefix for redirect URLs back to site root (relative: "" if at root, "../" if one level deep)
  var rootPrefix = FOLDER ? '../' : '';

  var role = sessionStorage.getItem('v7role');

  var PUBLIC = ['login.html', 'intensive.html', 'intensive-form.html'];
  if (PUBLIC.indexOf(PAGE) !== -1 && !FOLDER) return;

  if (!role) {
    location.href = rootPrefix + 'login.html';
    return;
  }

  var ACCESS = {
    'index.html':                ['admin'],
    'dashboard.html':            ['admin'],
    'finance.html':              ['admin'],
    'revenue.html':              ['admin'],
    'management.html':           ['admin'],
    'clients.html':              ['admin', 'manager', 'coach', 'administrator'],
    'club-members.html':         ['admin', 'manager'],
    'recall.html':               ['admin', 'manager'],
    'data.html':                 ['admin'],
    'team.html':                 ['admin'],
    'brain.html':                ['admin'],
    'audit.html':                ['admin'],
    'staff.html':                ['admin'],
    'marketing.html':            ['admin'],
    'tournament-calendar.html':  ['admin', 'manager', 'coach', 'administrator'],
    'tournament-tools.html':     ['admin', 'manager', 'coach', 'administrator'],
    'tournament-analytics.html': ['admin', 'manager', 'coach', 'administrator'],
    'tournament-list.html':      ['admin', 'manager', 'coach', 'administrator'],
    'schedule-builder.html':     ['admin', 'manager', 'coach', 'administrator'],
    'club-coach-calculator.html':['admin', 'manager', 'finance'],
    'manager-dashboard.html':    ['admin', 'manager'],
    'coach-dashboard.html':      ['admin', 'coach'],
    'admin-dashboard.html':      ['admin', 'administrator'],

    // ── Strategic docs (admin-only) ──
    'baseline.html':             ['admin'],
  };

  var DASHBOARDS = {
    'admin':         'index.html',
    'manager':       'manager-dashboard.html',
    'coach':         'coach-dashboard.html',
    'administrator': 'admin-dashboard.html',
    'finance':       'club-coach-calculator.html',
  };

  var allowed = ACCESS[KEY];
  if (!allowed) {
    if (role !== 'admin') location.href = rootPrefix + (DASHBOARDS[role] || 'login.html');
    return;
  }
  if (allowed.indexOf(role) === -1) {
    location.href = rootPrefix + (DASHBOARDS[role] || 'login.html');
  }
})();
