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
