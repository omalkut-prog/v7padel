# 01 — Architecture

*Last updated: 2026-04-15*

## Стек в одну строку

GitHub Pages (custom domain `v7padel.space`) + static HTML/JS + Google Sheets (БД) + Python ETL (BeautifulSoup + gspread) + Matchpoint scraping (ASP.NET WebForms).

## Data flow

```
Matchpoint (SaaS CRM)                Google Sheets
  └─ ASP.NET WebForms                  ├─ v7padel_db          ← сырые таблицы
      ↓ scrape (Python+BS4)            │    ├─ customers
      ↓                                │    ├─ client_transactions
etl/ (Windows Task Scheduler, 06:00)   │    ├─ client_revenue
  ├─ sync_customers_matchpoint.py  ───►│    ├─ client_visits
  ├─ sync_client_transactions.py   ───►│    ├─ client_categories
  ├─ sync_client_revenue.py        ───►│    ├─ bookings
  ├─ sync_client_visits.py         ───►│    ├─ occupancy_daily
  ├─ sync_client_categories.py     ───►│    └─ …
  ├─ scrape_occupancy.py           ───►│
  ├─ scrape_debts.py               ───►│
  └─ build_cache.py ◄── читает ──┐     └─ v7padel_cache       ← агрегаты для UI
                                 │          └─ top_clients_revenue
                                 └─ пишет ─┘

Google Sheets ──(GVIZ CSV API, public-read)──► site/ (static HTML)
                                                 └─ GitHub Pages → v7padel.space
```

## Google Sheets репозитории

| Spreadsheet | ID | Роль |
|---|---|---|
| **v7padel_db** | `1BfRgbVldM6sZUbNxSo77sS5XTaqf9-TKLnoce1jq1UY` | Сырые таблицы, пишут ETL |
| **v7padel_cache** | `1zQAnH-FUlShzWjsy24UWg7Ru2qempWW7Q8GqwFeQES0` | Агрегаты для UI |
| **PnL** | (см. `etl/inspect_pnl.py`) | Финансовая отчётность, аренда 380 490 ₺/мес в 04.41 |

Service account: `etl/sa.json` (`v7padel-etl-sa@v7padel-etl.iam.gserviceaccount.com`).

## Таблицы в v7padel_db

### customers
Основной справочник клиентов. Синкается из Matchpoint `ListadoClientes`.
Поля: `customer_id`, `name`, `phone`, `email`, `created_at`, …

### client_transactions
**Long-format log всех тикетов за 120 дней.** Источники: `ListadoTickets_Venta` (charges) + `ListadoAbonos_Venta` (credit notes, сторно).
Поля: `ticket_num`, `date`, `pay_date`, `pay_method`, `customer_id`, `client_name`, `description`, `total`, `vat`, `is_paid`, `is_cancel`, `is_credit_note`, `scraped_at`.

- `is_credit_note=1` → сторно-запись из Abonos, `total` **отрицательный** (в Matchpoint-листинге total показан положительным, парсер инвертирует знак). SUM(total) по клиенту = нетто.
- `description` credit note ссылается на исходный charge: `Credit note A26-03796 - ...` (префикс A=Venta серия, AF=facturas).

⚠️ **Известные проблемы**:
- `is_paid` всегда 0 — парсинг колонки Paid сломан. В `07_ANTI_PATTERNS.md`.
- `is_cancel` всегда 0 — то же. Признак "к тикету выпущен abono" рендерится как `<input checked disabled>`, `get_text()` = ''. Проверяется через наличие строки в Abonos-листинге, а не через эту колонку.
- Не включает saldo-движения и bono-движения (это отдельные эндпоинты).

### client_revenue
Wide-format снапшот: одна строка = один клиент × метрики на текущий момент.
Поля: `customer_id`, `name`, `amount_7d`, `amount_30d`, `amount_90d`, `amount_all`, `last_tx`, `days_since_last_tx`, `visits_30d`, `visits_90d`, `segment`, `activity_bucket`, `favorite_category`, …

**Сегменты** (см. `reference_client_segments`):
- `core` — ≥10 000 ₺/30д
- `risk` — 0 за 30д И ≥10 000 ₺/90д
- `growing` — 2–10 k₺/30д
- `occasional` — разовые

**Activity buckets** (2026-04-14, см. `09_DECISIONS.md` #002):
- `7d` 🟢 — `amount_7d > 0`
- `8_30d` 🟡 — `amount_30d > 0`
- `31_90d` 🟠 — `amount_90d > 0`
- `old` 🔴 — был когда-то, не 90+ дней
- `none` ⚪ — никогда

### client_visits
Визиты (приходы на корт) по клиенту. Окна 30д/90д.

### client_categories
Топ-категории трат (тренировки/корт/бар/абонемент) по клиенту.

### bookings
Все бронирования кортов в окне −90 / +60 дней. Синкается `sync_bookings_matchpoint.py` ежедневно из Matchpoint двумя вызовами: `CuadroReservasNuevo/ObtenerCuadro` (сетка дня) → для каждой Ocupacion вызывается `ObtenerInformacionReservaTooltip(id=BID)` чтобы вытащить `Usuarios[].IdCliente`.

Поля: `booking_id, court_id, start_ts, end_ts, duration_min, tipo, status, customer_id` (первый cid, legacy), `customer_ids` (CSV всех cid для групповых броней), `customer_names` (';'‑separated), `amount, debt, origen, reg_by, reg_ts, texto1, observaciones, price, scraped_at`.

**Покрытие cid** (проверено на 151 дне, 1509 броней):
- `reserva_individual / reserva_partida / clase_suelta`: 100%
- `reserva_actividad_abierta` (open activities): ~77% (записи до заполнения — без cid)
- `reserva_club` / `reserva_mantenimiento`: 0% (клубные ивенты/сервис — cid не привязан by design)

**Стратегия upsert**: окно −90 / +60 дней перезаписывается целиком, бронирования вне окна сохраняются в старой схеме. Это позволяет отслеживать изменения (отмены, ретайминги, добавления игроков в группу) без потери истории.

Старый fuzzy-match пайплайн (`site/scripts/fuzzy_match.py` + xlsx-дамп) заменён на этот прямой sync — больше не нужен.

### occupancy_daily
Агрегат загрузки по дням. Источник: `/Reservas/CuadroReservasNuevo.aspx/ObtenerEstadisticasOcupacion` (JSON PageMethod). 6 категорий API → 3 категории dashboard (см. `02_MATCHPOINT_API.md`).

### debts
Задолженности клиентов. Скрейпится `scrape_debts.py`.

### memberships
Club + VIP карты, 13 полей (`membership_id, holder, card_type, rate, payment, subs_date, paid_until, next_fee, status, first_fee, fee`). Rebuild из `ListadoAbonados.aspx` — `sync_memberships_matchpoint.py`. Раньше было ручным вводом (см. ADR-010).

## Таблицы в v7padel_cache

### top_clients_revenue
Агрегат для `clients.html`. Обновляется `build_cache.py` после всех sync-скриптов. Содержит всё что нужно странице (segment, activity_bucket, suggested contact, last visit category).

### club_members
Агрегат для `club-members.html`: все держатели карт + контакты (phone/email/telegram/whatsapp/birthday) + активность (amount/bookings/hours по периодам) + `bucket` (active / expiring ≤14д / expired). Сортировка: VIP → Club, внутри по статусу, потом по `amount_90d`.

### dashboard_kpis
Один ряд на все KPI дашборда. Memberships представлены двойной тройкой: `memberships_club/vip/total` (формально Active в Matchpoint) и `memberships_club_paid/vip_paid/total_paid` (`paid_until ≥ today`). Дашборд показывает paid как основное число, истёкшие — в sub-label.

## Страницы портала (`site/`)

| Страница | Роли доступа | Назначение |
|---|---|---|
| `login.html` | public | Вход по роли |
| `index.html` | admin | Dashboard admin |
| `dashboard.html` | admin | — |
| `finance.html` | admin | Финансы, PnL |
| `revenue.html` | admin | Выручка |
| `management.html` | admin | Менеджмент |
| `clients.html` | admin/manager/coach/administrator | Карточки клиентов с сегментами и bucket'ами |
| `club-members.html` | admin/manager | Владельцы Club/VIP карт: контакты, активность, сроки |
| `recall.html` | admin/manager | Список на обзвон (31_90d + old) с localStorage-статусами |
| `data.html` | admin | Данные |
| `team.html` | admin | — |
| `brain.html` | admin | **TODO**: превратить в ридер `docs/` |
| `audit.html` | admin | — |
| `staff.html` | admin | — |
| `marketing.html` | admin | — |
| `tournament-*.html` | admin/manager/coach/administrator | Турниры |
| `schedule-builder.html` | admin/manager/coach/administrator | — |
| `club-coach-calculator.html` | admin/manager/coach/administrator | Калькулятор клуб/тренер |
| `manager-dashboard.html` | admin/manager | — |
| `coach-dashboard.html` | admin/coach | — |
| `admin-dashboard.html` | admin/administrator | — |

Access control: `site/assets/auth-guard.js`. Sidebar: `site/assets/sidebar.js`.

## Деплой

- Push в `main` → GitHub Pages → `v7padel.space` (через CNAME).
- Кэш-бустер: `?v=kN` в подключениях скриптов. Увеличивать при релизе UI-фикса.
- **Нет** pages.dev — ходит через GitHub Pages напрямую на кастомный домен.

## Авто-запуск ETL

Windows Task Scheduler, **07:00 ежедневно** (к открытию клуба в 9:00 цифры свежие). Был `23:50 + 06:00` — избыточно, см. ADR-011.

Раньше крутилось несколько PS1-инсталлеров для разных шагов — сейчас одна задача `V7Padel_ETL_Daily`, запускающая `etl/run_all_etl.py` (см. `03_ETL_PLAYBOOK.md`). Старые `install_*.ps1` / `create_cache_task.bat` остались как справочный материал.

Порядок внутри `run_all_etl.py`: customers → revenue → visits → categories → transactions → topup → occupancy → debts → etl.py → sync_topup_to_transactions → memberships → build_cache → generate_state_doc.

### Lite refresh (браузер)

Кнопка **«Обновить»** в сайдбаре (`site/assets/sidebar.js`) чистит только IndexedDB текущего браузера (`V7.clearCache()` → `v7_cache`) и перезагружает страницу. БД на проде обновляет **только** cron — это даёт иллюзию «свежих» данных, но источник остаётся вчерашним (или утренним после 07:00). См. ADR-011.

## Что не является частью этой архитектуры

- Нет бекенда/API. Всё через Sheets как БД + GVIZ.
- Нет полноценного DuckDB/Postgres — есть упоминание «DuckDB-style tabs» в старых доках, это метафора, не реальный DuckDB.
- Нет аутентификации на стороне сервера — `sessionStorage.v7role` в браузере.
