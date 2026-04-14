(function() {
  var PAGE = location.pathname.split('/').pop() || 'index.html';
  if (PAGE === '') PAGE = 'index.html';
  var role = sessionStorage.getItem('v7role');

  var PUBLIC = ['login.html'];
  if (PUBLIC.indexOf(PAGE) !== -1) return;

  if (!role) {
    location.href = 'login.html';
    return;
  }

  var ACCESS = {
    'index.html':                ['admin'],
    'dashboard.html':            ['admin'],
    'finance.html':              ['admin'],
    'revenue.html':              ['admin'],
    'management.html':           ['admin'],
    'clients.html':              ['admin', 'manager', 'coach', 'administrator'],
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
    'club-coach-calculator.html':['admin', 'manager', 'coach', 'administrator'],
    'manager-dashboard.html':    ['admin', 'manager'],
    'coach-dashboard.html':      ['admin', 'coach'],
    'admin-dashboard.html':      ['admin', 'administrator'],
  };

  var DASHBOARDS = {
    'admin':         'index.html',
    'manager':       'manager-dashboard.html',
    'coach':         'coach-dashboard.html',
    'administrator': 'admin-dashboard.html',
  };

  var allowed = ACCESS[PAGE];
  if (!allowed) {
    if (role !== 'admin') location.href = DASHBOARDS[role] || 'login.html';
    return;
  }
  if (allowed.indexOf(role) === -1) {
    location.href = DASHBOARDS[role] || 'login.html';
  }
})();
