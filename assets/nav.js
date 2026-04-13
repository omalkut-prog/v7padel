/* V7 Padel — единая навигация
 * Подключается на всех страницах: <script src="assets/nav.js"></script>
 * Автоматически:
 *   1. Находит <nav> и добавляет hamburger кнопку
 *   2. Подсвечивает active ссылку по текущему URL
 *   3. Управляет мобильным меню (открытие/закрытие)
 */
(function () {
  var nav = document.querySelector('nav');
  if (!nav) return;

  // ── Hamburger button ──
  var burger = document.createElement('button');
  burger.className = 'nav-burger';
  burger.setAttribute('aria-label', 'Меню');
  burger.innerHTML = '<span></span><span></span><span></span>';

  // Insert burger before .nav-links
  var links = nav.querySelector('.nav-links');
  if (links) {
    nav.insertBefore(burger, links);
  }

  // ── Toggle menu ──
  burger.addEventListener('click', function (e) {
    e.stopPropagation();
    nav.classList.toggle('nav-open');
  });

  // Close on link click
  if (links) {
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('nav-open');
      }
    });
  }

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target)) {
      nav.classList.remove('nav-open');
    }
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') nav.classList.remove('nav-open');
  });
})();

// ── Logout button ──
(function() {
  var role = sessionStorage.getItem('v7role');
  if (!role) return;
  var nav = document.querySelector('nav') || document.querySelector('.nav');
  if (!nav) return;

  var lang = sessionStorage.getItem('v7lang') || 'ru';
  var exitLabels = { ru: 'Выйти', en: 'Sign out', tr: 'Çıkış' };
  var label = (role === 'coach' || role === 'administrator')
    ? (exitLabels[lang] || 'Sign out')
    : 'Выйти';

  var btn = document.createElement('button');
  btn.textContent = label;
  btn.id = 'nav-logout-btn';
  btn.style.cssText = 'margin-left:auto;padding:6px 16px;background:transparent;border:1px solid currentColor;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;opacity:0.6;transition:opacity .2s;font-family:inherit;color:inherit';
  btn.onmouseover = function(){ btn.style.opacity = '1'; };
  btn.onmouseout  = function(){ btn.style.opacity = '0.6'; };
  btn.onclick = function() {
    sessionStorage.clear();
    location.href = 'login.html';
  };
  nav.appendChild(btn);
})();
