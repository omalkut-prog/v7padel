/* V7 Padel — theme controller
 * - Читает localStorage['v7-theme']
 * - Ставит <html data-theme="..."> до рендера чтоб не мигало
 * - Монтирует переключатель в правом верхнем углу на каждой странице
 * - 3 темы: tiffany (CEO), dark (PM), v7 (команда)
 */
(function () {
  var KEY = 'v7-theme';
  var THEMES = ['tiffany', 'dark', 'v7'];
  var DEFAULT = 'v7';

  function get() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(t) {
    try { localStorage.setItem(KEY, t); } catch (e) {}
  }
  function apply(t) {
    if (THEMES.indexOf(t) < 0) t = DEFAULT;
    document.documentElement.dataset.theme = t;
    var btns = document.querySelectorAll('.theme-switcher button');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', btns[i].dataset.theme === t);
    }
  }
  function set(t) { save(t); apply(t); }

  // --- Apply as early as possible (script is in <head>, runs before body) ---
  var initial = get() || DEFAULT;
  document.documentElement.dataset.theme = initial;

  // Public API
  window.V7Theme = { get: get, set: set, apply: apply, themes: THEMES };

  function mount() {
    if (document.querySelector('.theme-switcher')) return;
    var box = document.createElement('div');
    box.className = 'theme-switcher';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Переключить тему');
    box.innerHTML =
      '<button type="button" data-theme="tiffany" title="CEO · Tiffany">T</button>' +
      '<button type="button" data-theme="dark"    title="PM · Dark">D</button>' +
      '<button type="button" data-theme="v7"      title="Команда · V7">V</button>';
    var btns = box.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function (e) { set(e.currentTarget.dataset.theme); });
    }
    document.body.appendChild(box);
    apply(document.documentElement.dataset.theme || DEFAULT);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
