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
**Long-format log всех тикетов за 120 дней.** Источник: `ListadoTickets_Venta`.
Поля: `ticket_num`, `date`, `pay_date`, `pay_method`, `customer_id`, `client_name`, `description`, `total`, `vat`, `is_paid`, `is_cancel`, `scraped_at`.

⚠️ **Известные проблемы**:
- `is_paid` всегда 0 — парсинг колонки Paid сломан. В `07_ANTI_PATTERNS.md`.
- `is_cancel` всегда 0 — то же.
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
Все бронирования кортов. ⚠️ `customer_id` пустой для ~XX% — известный баг (см. `07_ANTI_PATTERNS.md`).

### occupancy_daily
Агрегат загрузки по дням. Источник: `/Reservas/CuadroReservasNuevo.aspx/ObtenerEstadisticasOcupacion` (JSON PageMethod). 6 категорий API → 3 категории dashboard (см. `02_MATCHPOINT_API.md`).

### debts
Задолженности клиентов. Скрейпится `scrape_debts.py`.

## Таблицы в v7padel_cache

### top_clients_revenue
Агрегат для `clients.html`. Обновляется `build_cache.py` после всех sync-скриптов. Содержит всё что нужно странице (segment, activity_bucket, suggested contact, last visit category).

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

Windows Task Scheduler, 06:00 ежедневно:
- `etl/install_task.ps1` — основной sync клиентов
- `etl/install_enrich_task.ps1` — обогащение
- `etl/install_matchpoint_task.ps1` — matchpoint
- `etl/create_cache_task.bat` — финальный build_cache

Порядок внутри `run_all_etl.py`: customers → revenue → visits → categories → transactions → cache.

## Что не является частью этой архитектуры

- Нет бекенда/API. Всё через Sheets как БД + GVIZ.
- Нет полноценного DuckDB/Postgres — есть упоминание «DuckDB-style tabs» в старых доках, это метафора, не реальный DuckDB.
- Нет аутентификации на стороне сервера — `sessionStorage.v7role` в браузере.
