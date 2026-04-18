# Code Review 2026-04-18 · DEEP (все 37 страниц)

> **Расширение базового ревью** `REVIEW_2026-04-18.md`. Прошёлся ВСЕМИ страницами сайта (37 HTML), не только топ-5.
> **Метод**: 3 параллельных агента + ручная верификация критических находок.
> **Длительность**: ~45 мин wall-clock с автоматизацией.

## TL;DR

Из 37 страниц:
- **22 — рабочие** (core-7, role-3 dashboards, tournament-4, special-6, специальные-2).
- **12 — заглушки role-pages** (admin-kpi/tasks/checklists/schedule, coach-* (4), manager-* (4)). Контент: «WIP/Скоро».
- **3 — критические для разбора** (login.html security, intensive.html performance, recall.html mobile).

Прогресс ревью:
- 🔴 **2 P0** найдено (login passwords, recall mobile) → **1 пофикшено сейчас (recall)**, 1 ждёт твоего решения (login).
- 🟡 **5 P1** в backlog.
- 🔵 несколько P2 — живём с ними.

---

## 🔴 P0 находки

### P0 NEW · `recall.html` — мобильная версия не работала
**Симптом**: на телефоне KPI-карточки в 4 колонки (узкие, нечитаемые), таблица recall обрезана справа без скролла.
**Причина**: `<style>` блок не имел ни одного `@media` правила. `table-wrap { overflow: hidden }` без mobile-override.
**Фикс (применён сейчас)**:
- `@media (max-width: 900px)` — KPI grid 4→2, уменьшение padding/font.
- `@media (max-width: 760px)` — table-wrap получает `overflow-x: auto !important`, table `min-width: 720px`, `white-space: nowrap`.
- `@media (max-width: 480px)` — KPI 2→1.

### P0 OPEN · `login.html` — hardcoded пароли в фронтенд-JS
**Что найдено**:
```js
const PASSWORDS = {
  'V7admin2026':     { role: 'admin',         redirect: 'index.html' },
  'V7manager2026':   { role: 'manager',        redirect: 'manager-dashboard.html' },
  'V7coach2026':     { role: 'coach',          redirect: 'coach-dashboard.html' },
  'V7clubadmin2026': { role: 'administrator',  redirect: 'admin-dashboard.html' },
};
```
**Риск**:
- Любой человек с любым доступом к сайту может открыть DevTools (F12) → видит все пароли + роли в plain text.
- Поисковые боты GitHub Pages проиндексируют public репо (репозиторий публичный? проверить).
- Браузерные расширения, кэши, CDN — всё это потенциально утекает.

**Контекст V7**:
- Это **внутренний портал** для команды (не публичный продукт).
- Пользователи: ты, Оля, тренеры (Bob, Umur и т.д.), админы.
- Возможно hardcoded — это сознательное упрощение пока команда маленькая.

**Решение нужно от тебя:**

**Вариант A — оставляем как есть.** Принимаем риск. Меняем пароли на менее «угадываемые» (не `V7admin2026`). Минимум усилий. Подходит если репо приватный и команда доверенная.

**Вариант B — Google OAuth (recommended).** Логин через Google. У всех в команде есть Google. Бесплатно, безопасно. Контролируешь кто пускается через whitelist email-ов. ~3-4 часа работы.

**Вариант C — Supabase/Auth0 password-based.** Реальный пароль с хешем на сервере. Чуть сложнее, но не привязка к Google. ~5-6 часов.

Я склоняюсь к B (OAuth Google). Если согласен — могу сделать в следующей итерации.

---

## 🟡 P1 находки

### P1-1 · `intensive.html` — 2 МB embedded base64 images
**Что**: 11 встроенных JPEG в base64 в HTML, минифицированный CSS внутри.
**Причина**: лендинг для «Spanish Camp Май 2025» — был быстро собран (видимо из Canva export или автоматическая упаковка в один HTML).
**Последствие**: каждый клик «Кэмпы» в навигации → скачивает 2 МB. На мобильном с медленным 3G — ~30 секунд загрузка.

**Решение**:
- Извлечь 11 base64-image, сохранить в `site/assets/img/intensive/`.
- Заменить на `<img src="assets/img/intensive/foto1.jpg">`.
- Опционально: добавить WebP версии (на 30-40% меньше JPEG).
- Минифицированный CSS развернуть для maintainability.

**Effort**: 1.5 часа (если сделать аккуратно с проверкой что картинки не сломались).

**Решение от тебя**: оптимизируем (это страница для гостей кэмпа — должна быстро грузиться) или оставляем как есть (страница используется редко — раз в кэмп)?

### P1-2 · 12 заглушек role-pages — удалять?
**Файлы (12 шт. ~2.5 KB каждый)**:
- `admin-kpi.html`, `admin-tasks.html`, `admin-checklists.html`, `admin-schedule.html`
- `coach-kpi.html`, `coach-tasks.html`, `coach-checklists.html`, `coach-schedule.html`
- `manager-kpi.html`, `manager-tasks.html`, `manager-checklists.html`, `manager-schedule.html`

**Содержимое каждой**: nav + плашка «🚧 Section under development» + back-кнопка. Никакой функциональности.

**Используются?** Скорее всего ссылки на них есть в `admin-dashboard.html`, `coach-dashboard.html`, `manager-dashboard.html` (10 карточек разделов).

**Решение от тебя**:

**Вариант A — удалить все 12** + убрать ссылки из dashboard'ов. Чисто.

**Вариант B — наполнить.** KPI/Tasks/Checklists/Schedule — это ценные модули если планируешь оперировать командой через портал. Effort: 2-6 часов на каждую страницу.

**Вариант C — оставить заглушками.** Уродливо, но видно «что планируется». Неплохо для UX/roadmap visibility.

Моя рекомендация: **сейчас удалить заглушки**, добавить в `05_BACKLOG.md` пункт «модули KPI/Tasks/Checklists/Schedule по ролям» с приоритетом «когда будет команда из 5+ человек». Лучше показать пустой dashboard чем 10 карточек ведущих в «WIP».

### P1-3 · `finance.html` console.log/warn в production
Строки 951, 528 и др. — оставлены debug-логи. Не критично (никто не смотрит DevTools каждый день), но шум.
**Effort**: 5 минут найти-удалить через grep.

### P1-4 · `data.html` custom CSV parser хрупкий
`parseCSV()` на 234-251 не обрабатывает:
- BOM (`\ufeff` в начале файла).
- Multi-line quoted fields.
- `\r\n` (только `\n`).
**Заменить**: на PapaParse (uses CDN, 30 KB). Или оставить — для простых gviz-CSV всё работает.

### P1-5 · `team.html` зависит от внешнего `V7_Padel_Brain.md`
Если файл удалён или переименован — страница пуста. Сейчас файл есть. Стоит добавить fallback «База знаний переехала, см. /docs/».

---

## 🔵 P2 (живём)

- **`finance.html`**: дублирование render-логики между `renderBlock1()` и `renderBlock1FromCache()`. Рефакторинг ради рефакторинга.
- **`management.html`**: `console.warn` для PnL fail. OK, не P0.
- **`schedule-builder.html`** 88 KB: размер оправдан (drag-and-drop + grid + court-meter). Не трогать.
- **`campspaine.html`** 53 KB: статическая промо, OK.
- **`audit.html`**: финансовая таблица узкая на мобиле. Должна работать после глобального theme.css фикса (overflow-x:auto). Проверить руками.
- **`recall.html`**: localStorage без проверки browser support (инкогнито может сломаться). Edge case.
- **`recall.html`**: дублирует `fmtMoney/fmtFull` из `data.js`. Косметика.

---

## ✅ Хорошо работает

- **Все 4 tournament-страницы** (`list/calendar/tools/analytics`) — структура, mobile, источники данных. OK.
- **`brain.html`** — knowledge base. Чисто.
- **`audit.html`** — финансовый аудит. Кроме мелких таблиц на мобилке — хорошо.
- **`schedule-builder.html`** — сложный drag-and-drop, оправданный размер.
- **`index.html`** — лендинг с responsive grid. OK.
- **`management.html`** — heatmap кортов, аномалии. Хорошо.
- **`data.html`** — браузер сырых данных. OK для internal tool.
- **`team.html`** — markdown reader. OK пока файл существует.
- **`club-members.html`** — таблица карт + экспорт CSV. OK.
- **`finance.html`** — основной финансовый дашборд. Долго грузится (много `loadSheet`), но работает.
- **3 dashboard-страницы по ролям** (`admin/coach/manager`-dashboard) — навигационные хабы, OK.

---

## Сводная таблица 37 страниц

| Категория | Кол-во | Статус |
|---|---:|---|
| **Core** (dashboard, clients, revenue, finance, management, data, team, recall, club-members, index) | 10 | 9 OK + 1 mobile fixed today |
| **Role dashboards** (admin/coach/manager) | 3 | OK |
| **Role заглушки** (kpi/tasks/checklists/schedule × 3 роли) | 12 | Заглушки → решить |
| **Tournament** (list/calendar/tools/analytics) | 4 | OK |
| **Special**: brain/audit/login/schedule-builder/campspaine/intensive | 6 | OK + login P0 + intensive P1 |
| **Аутентификация**: login | 1 | P0 (см. выше) |
| **Тяжёлые/специальные**: schedule-builder/intensive/campspaine | (дубль) | Особый разбор |
| **Итого** | 37 | — |

---

## Что починил **сейчас**

- ✅ recall.html mobile responsiveness (3 @media breakpoint).

## Решения пользователя (2026-04-18)

1. **login.html** → **отложено в `05_BACKLOG.md` как P0**. Володимир пока не раздаёт доступы команде. Когда придёт время — OAuth Google (Variant B). До тех пор оставляем как есть, риск принимается осознанно (узкий круг доступа, не публичный портал).
2. **intensive.html 2 МB** → **оставить как есть**. Лендинг для редкого use case (раз в кэмп), оптимизация не приоритет.
3. **12 role-заглушек** → **оставить как есть**. Показывают «что планируется» — UX/roadmap visibility ценнее, чем clean codebase сейчас.

**Никаких дополнительных фиксов после ответа пользователя.** Только recall.html (P0 mobile) починен в этом ревью — это единственная безопасная правка без необходимости решения.

---

## Метрика для следующего ревью (2026-06-18)

| Метрика | Сейчас | Цель июнь |
|---|---:|---:|
| P0 на входе | 2 | 0 |
| P1 в backlog | 9 | <15 (стабильно) |
| Заглушки в проде | 12 | 0 (если удалим) |
| Размер /intensive.html | 2 МB | ~250 KB (если оптимизируем) |
| Файлов с устаревшим cache-buster | 0 (после сегодня) | 0 (поддерживать) |
| `audit_tools.py` находок P0 | 0 (после фиксов) | 0 |
