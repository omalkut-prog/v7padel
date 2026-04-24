# 05 — Backlog

*Last updated: 2026-04-16*
*Пересматривается*: воскресенье 18:00 (Володимир + ИИ)

## Правила

- **Max 5 в `NOW`**. Шестой пункт не попадает пока пятый не закрыт.
- Каждый пункт: **Impact on NS · Effort · Owner**. Без этого — не в `NOW`.
- `LATER` без ограничений, но кандидаты на выбрасывание при следующем ревью.
- `PARKING LOT` — идеи без решения делать.

---

## NOW (5 max)

### 1. ~~Fix `bookings.customer_id` пустой для ~XX% записей~~ ✅ DONE (2026-04-16)
- Закрыто: см. ADR в `09_DECISIONS.md` / запись `sync_bookings_matchpoint.py`.
- Было: stale xlsx-дамп, `customer_id` пустой для ~93%, fuzzy_match не помогал (мало имён в карточке).
- **Phase F (временная заплатка)**: в `build_cache.compute_client_kpis` union cid из `bookings ∪ client_transactions` (последний имеет точные cid). `clients_active_30d`: 68 → 199.
- **Phase D (основное решение)**: новый скрипт `sync_bookings_matchpoint.py` — два Matchpoint API (`ObtenerCuadro` + `ObtenerInformacionReservaTooltip`), окно −90 / +60 дней, расширенная схема (`customer_ids, amount, debt, origen, reg_*`). Покрытие cid: 100% на `reserva_individual/partida/clase_suelta`, 77% на `actividad_abierta`, 0% на `reserva_club/mantenimiento` (by design).
- Следствие: можно считать воронку «бронирование → клиент → повтор» и точный recall по активности.

### 2. Заполнить стратегические блоки `00_NORTH_STAR.md`
- **Impact on NS**: высокий. Без этого другой ИИ и сам Володимир не имеют опорных цифр для приоритизации.
- **Effort**: 1-2 ч (Володимир выписывает) + 30 мин (ИИ форматирует)
- **Owner**: Володимир + Claude
- **Что заполнить**: топ-3 цели Q2, остальные позиционные правила, все KPI-числа (цели заполняемости, MRR, конверсии, retention, ATV).

### 3. Редизайн навигации (сайдбар)
- **Impact on NS**: средний. 15+ пунктов в сайдбаре — «привет из 90-х». Замедляет навигацию всех ролей.
- **Effort**: 1-2 дня + обсуждение с Володимиром
- **Owner**: Claude + Володимир (приоритеты разделов)
- **Детали**: группировка по частоте использования, ролевая видимость уже есть, но структура групп «Обзор / Бизнес / Клуб / Инструменты» требует пересмотра. Рассмотреть мега-меню для свёрнутого режима.

### 4. Миграция: удалить `V7_Padel_Brain.md`, `knowledge.html`, превратить `brain.html` в ридер `docs/`
- **Impact on NS**: низкий (косметика), но устраняет фрагментацию.
- **Effort**: 1 ч
- **Owner**: Claude
- **Детали**: контент из `V7_Padel_Brain.md` уже перенесён в новые доки → удалить. `knowledge.html` — redirect без смысла. `brain.html` переделать: рендерить `docs/*.md` через marked.js (или ссылки на GitHub).

### 5. Fix `is_paid` / `is_cancel` парсинг в `sync_client_transactions.py`
- **Impact on NS**: низкий, но данные врут. Сейчас всегда 0 — невозможно отсечь отмены.
- **Effort**: 30 мин
- **Owner**: Claude
- **Детали**: проверить реальные значения в колонках Paid/Cancel HTML-таблицы, обновить маппинг в `rows_to_records`.

---

## NEXT (до 10)

### A. Раздел маркетинга (`11_MARKETING.md`)
- Аватар клиента (primary/secondary)
- Каналы (что работает, что тестируем, что отвергли)
- Позиционные месседжи (что говорим, что НЕ говорим)
- Контент-стратегия
- **Effort**: 2-4 ч совместной работы Володимира и ИИ
- **Блокер**: приоритизация по текущим целям квартала

### B. Расширить `probe_service_prices.py` → добавить бар/снеки как отдельную категорию
- Сейчас бар и магазин смешаны в `shop_bar`. Разделить по Matchpoint-категориям.

### C. Опциональный ETL для saldo и bono движений
- Добавить если activity_bucket перестанет покрывать кейсы.
- Сейчас не нужен.

### D. Dashboards KPI vs target
- Виджет на главной: текущая выручка/день vs 80k, MRR vs target, заполняемость vs цель.
- Зависит от: пункт 3 в NOW (числа целей).

### E. Воронка корт → клиент → повтор
- Блокер: пункт 2 в NOW (bookings.customer_id).

### F. Tournament analytics: заполнить реальной логикой
- Сейчас страница есть, но содержание неясно.

### G. Скрипт контроля качества ETL
- После каждого run проверять: нет garbage-строк в client_transactions, customer_id полнота, distinct buckets, etc.
- Fails → письмо/notify.

### J. Наполнить «пустые» страницы контентом (маркетинг / персонал / турниры / ивенты)
- **Контекст** (2026-04-24): пользователь указал что есть пустые разделы блокирующие работу.
- **Разбивка на 4 независимых подзадачи**:
  - **J1. Маркетинг (`11_MARKETING.md` + страница)**: аватар клиента, каналы, месседжинг, контент-стратегия, UTM-разметка. Зависит от: brainstorm с Володимиром ~2ч.
  - **J2. Персонал (страница Team/HR)**: расписание, KPI тренеров, checklist'ы админов, compensation tracking. Сейчас заглушки `admin-*.html`, `coach-*.html`, `manager-*.html` (15 пустых файлов по 3KB).
  - **J3. Турниры analytics** (пункт F из backlog): реальные метрики — fill rate, ROI, участники, победители, retention после турнира.
  - **J4. Ивенты/спец.мероприятия**: camps, intensive, корпоративы — tracking + воронка + ROI.
- **Приоритет**: решить в каком порядке наполнять. Персонал скорее всего первое (связано с coach/admin роли → мотивация, ретеншн команды).
- **Effort**: каждая подзадача — 2-4ч совместной работы.

### K. Тесты + CI/CD
- **Контекст** (2026-04-24): написали первую версию `etl/test_build_cache.py` (64 теста), сразу нашли 1 баг (Top-up категория). См. `docs/17_TESTING.md`.
- **Что ещё покрыть** (в 17_TESTING.md таблица TODO из 8 пунктов):
  - compute_opex_by_month_cat, compute_top_clients_revenue, compute_clients_enriched,
    merge_manual_entries, compute_occupancy_planfact, compute_member_churn,
    sync_bookings_matchpoint (parser), sync_cancellations_matchpoint (parser).
- **CI/CD setup**:
  - GitHub Actions `.github/workflows/tests.yml` — pytest на PR.
  - Pre-commit hook — блокирует коммит если tests fail.
  - pytest-cov для coverage metrics.
- **Приоритет**: средний. Тесты растут органично — по 1-2 за code review раз в 2 мес.

### I. Инкрементальный ETL — frozen-month caching (8 мин → 2-3 мин)
- **Контекст**: сейчас каждый cron пересчитывает ВСЁ с нуля. Исторические месяцы (Сент-2025 … прошлый месяц) **не меняются** но мы их пересчитываем каждую ночь. 80% времени build_cache + 75% scraping bookings тратится на frozen данные.
- **3 параллельных фикса** (можно делать независимо):
  - **A. Racket.ID раз в неделю** (~2 мин реализации). Новая Task Scheduler запись раз в 3 дня. Экономия: 110 с/день. Риск: нулевой.
  - **B. Инкрементальный `build_cache`** (~15-20 мин). 2 слоя: `cache_frozen.json` (месяцы ≤ current-2, rebuild 1-го числа) + hot rebuild текущий/прошлый каждый cron. Экономия: 95 с. Риск: backfill-инвалидация (решается кнопкой `--rebuild-frozen` + auto-rebuild если файл >30 дней).
  - **C. Инкрементальный `sync_bookings_matchpoint`** (~20-25 мин). Ежедневно окно `[-7, +14]`, воскресенье ночью full `[-90, +60]`. Экономия: 110 с/день. Риск: правки старше 7 дней подхватятся только к воскресенью.
- **Общая экономия**: 495 с (8.3 мин) → ~150 с (2.5 мин) = **−70% времени**.
- **Effort**: ~45 мин суммарно (с Claude Code).
- **Приоритет**: средний — cron и так работает, это оптимизация. Но позволит уменьшить окно «юзер ждёт утром пока обновится».

### H. Перевести ETL на GitHub Actions (надёжность 100%, не зависит от компа)
- **Контекст**: сейчас cron крутится через Windows Task Scheduler на ноутбуке Володимира. Работает только если комп включён (или спит с WakeToRun). Если выключил на ночь — задача не запустится. 22.04.2026 настроили `WakeToRun + StartWhenAvailable` как временное решение, но надёжность всё равно не 100%.
- **Решение**: перенести ETL в GitHub Actions. Cron запускается в датацентре GitHub, комп не нужен. Бесплатно (до 2000 мин/мес, хватит с запасом). Cron `0 0 * * *` (00:00 UTC = 03:00 Turkey).
- **Локально уже готово** (2026-04-22, не запушено — отложено пользователем):
  - Папка `/c/Users/volod/v7padel-etl/` с полной структурой.
  - `etl/` — 18 production-скриптов скопированы (sync_*, build_cache, scrape_occupancy, etc.).
  - `site_scripts/` — racketid_extract + cross_match.
  - `.github/workflows/etl.yml` — workflow: checkout обоих репо, python 3.12, secrets → sa.json/matchpoint_creds.json, запуск run_all_etl, commit+push обновлений в публичный репо, upload логов как artifacts.
  - `requirements.txt`, `.gitignore` (защищает sa.json), `README.md`.
  - `git init` + initial commit уже сделан локально.
- **Что остаётся (действия пользователя ~10 мин)**:
  1. Создать приватный репо `omalkut-prog/v7padel-etl` через GitHub UI.
  2. Создать Personal Access Token (fine-grained, 1 год) с правом Contents: Read&Write для `omalkut-prog/v7padel` (публичного).
  3. Добавить 3 Secrets в приватный репо: `SA_JSON` (содержимое etl/sa.json), `MP_CREDS` (etl/matchpoint_creds.json), `PUBLIC_REPO_PAT` (токен из шага 2).
  4. Мне: `git remote add origin` + push → запуск workflow manually для теста.
- **После успеха 2-3 циклов**: отключить локальный Task Scheduler `V7Padel_ETL_Daily`.
- **Приоритет**: не срочный — Task Scheduler с wake-таймером на ноут пока работает. Когда пользователь решит закрыть ноут на неделю — активировать.
- **Effort**: 30 мин настройки + тестовый прогон после того как пользователь сделает 3 шага в UI.

---

## LATER

- **[REVIEW 2026-04-18 · P0] Login.html — заменить hardcoded пароли на нормальную auth**. Сейчас в `login.html` JS-объект `PASSWORDS` со всеми паролями (`V7admin2026`, `V7manager2026`, `V7coach2026`, `V7clubadmin2026`) виден в DevTools любому. Володимир (2026-04-18): пока никому доступы не раздаём — отложено. Когда придёт время раздавать команде — реализовать OAuth Google (рекомендация: ~3-4ч, у всех в команде есть Google, whitelist email-ов в коде). Альтернативы — Supabase password-based (~5-6ч) или просто менее очевидные пароли (минимум, риск остаётся).
- **[REVIEW 2026-04-18 · P1] Решение по `manager-*.html` страницам** (4 заглушки ~3KB). Нужна ли вообще роль manager? Если нет — удалить 4 HTML + nav-ссылки. Если да — приоритизировать наполнение (2-6ч работы). Impact: низкий · Effort: зависит от решения.
- **[REVIEW 2026-04-18 · P1] `scrape_debts.py` в cron или removal**. Скрипт для debts/balance_log существует, не вызывается. Проверить используются ли `debts` / `balance_log` табы на сайте. Если да — добавить в run_all_etl (10 мин). Если нет — пометить как ad-hoc в docstring.
- **[REVIEW 2026-04-18 · P1] Рефакторинг `revenue.html`** (179KB, 3500 строк inline JS). Вынести общие helpers в `revenue-helpers.js`. Дубли между табами (income/goods/margins/utilization). Effort: 2-3ч. Impact: mobile performance.
- **[REVIEW 2026-04-18 · P1] Проверить `intensive.html`** (2 МB!). Что внутри, почему такой большой. Возможно embedded base64 или старая версия. Effort: 30 мин.
- **Snapshot-based tracking для отмен → cid**. Сейчас ТОП-20 клиентов по отменам невозможен: Matchpoint удаляет связь `booking_id → customer_id` при отмене, tooltip/FichaReserva не работают для cancelled. Эвристика парсинга `booking_text` дала только ~28% покрытия → метрика снята с сайта как не репрезентативная (2026-04-17). Решение: расширить `sync_bookings_matchpoint` чтобы при исчезновении booking_id из ObtenerCuadro — помечать его `status=cancelled` в табе `bookings` (не удалять), сохраняя `customer_ids`. Тогда для новых отмен будет 100% покрытие. История не восстановится — только с момента внедрения. Функция `compute_cancel_top_clients` сохранена в `build_cache.py`, но не вызывается. Impact: средний · Effort: 2-3ч · Owner: Claude
- Telegram/WhatsApp bot для recall (отправка по одной кнопке)
- AI-предсказание churn risk (фича по activity_bucket + сегмент + частота визитов)
- Автоматическая классификация description → service_type в транзакциях
- Интеграция с Google Calendar для тренерских слотов
- Push-уведомления клиентам из приложения (нужно API Matchpoint)
- Fraud-детект: duplicate bookings, abnormal cancels
- Мобильный UI (сейчас desktop-first)
- Экспорт в CSV/Excel из всех страниц (сейчас только в recall)
- Фильтры в clients.html по bucket + сегмент + visits
- Dashboard для тренера: его ученики, их прогресс, следующие сессии

---

## PARKING LOT (идеи без решения делать)

- Программа рефералов (но идёт против «никаких скидок» → надо продумать формат: ap подарок, а не скидка?)
- NFC-карточки вместо QR для входа клиентов
- Собственное приложение V7 (Matchpoint уже даёт, но не наше)
- Мерч-магазин онлайн
- Интеграция с Racket.ID для турниров (есть, но мёртво)

---

## Done / Archive (что сделано — для истории)

### 2026-04-16
- ✅ **Топ клиентов по выручке** — `clients.html` Block 2, фильтры по периоду/сегментам (`top_clients_revenue`, 786 строк)
- ✅ **sync_memberships_matchpoint.py** интегрирован в `run_all_etl.py` (шаг 11, перед Racket.ID) → пишет в таблицу `memberships` v7padel_db
- ✅ **build_cache**: считает formal (status=Active) и paid (paid_until>=today) варианты отдельно — см. ADR-010
- ✅ **club-members.html** — новая страница: VIP/Club фильтры, bucket (active/expiring/expired), поиск, сортировка, CSV, контакты (тел/WA/TG/email), ДР
- ✅ **Lite refresh button** в сайдбаре — `V7.clearCache()` + reload (данные на проде обновляются 1×/день cron-ом)
- ✅ **Task Scheduler**: `23:50 + 06:00` → один триггер `07:00` ежедневно
- ✅ **`clients_active_30d`** в `build_cache` + `dashboard.html` — уникальные клиенты с ≥1 бронью за 30д (отличается от `bookings_30d`)
- ✅ **revenue.html**: подпись «Средний чек клуба» (выручка/тр, продажи/тр), чтобы отличать от ср.чека клиента
- ✅ **revenue.html**: тоггл **Календарь ↔ Rolling** на кнопках 1М/3М/6М/Всё (календарный период vs last N·30 days)
- ✅ **revenue.html refactor**: DRY для period handlers — вынесена общая `_rerenderAllAfterPeriodChange()`, ранний return если клик по уже активной кнопке
- ✅ **Авто-генератор `04_CURRENT_STATE.md`** (`etl/generate_state_doc.py`, интегрирован в `run_all_etl.py`)

### 2026-04-14/15
- ✅ Миграция `last_tx` → `activity_bucket` (2026-04-14) — см. `09_DECISIONS.md` #002
- ✅ Фикс garbage pagination в `sync_client_transactions.py` (регекс `^[A-Z]\d{2}-\d+$`) — см. `07_ANTI_PATTERNS.md`
- ✅ Страница `recall.html` для обзвона `31_90d`/`old`
- ✅ Реальные цены из транзакций → `10_PRICES_AND_HOURS.md`
- ✅ Реструктуризация базы знаний в `docs/` (2026-04-15)
