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

---

## LATER

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
