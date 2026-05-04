# 25 — Backend (FastAPI)

> Создано 2026-05-04. Backend поднят за 1 рабочий день благодаря AI-tooling.

## Что это и зачем

Бэкенд — отдельный сервис, который **дополняет** существующую архитектуру (не заменяет).

**Существующая архитектура (Phase 0)** продолжает работать:
- ETL пишет в Google Sheets (raw data + cache)
- Frontend (`v7padel.space`) читает Sheets напрямую через GETs
- login.html → password hash → role в sessionStorage

**Новый backend (Phase 1)** добавляет:
- API proxy для Sheets (быстрее, кэш, не палит SA credentials)
- Хранение **новых данных** которых раньше не было: notes, tags, contact_log, leads_inbox
- Webhook endpoints (Instagram leads, формы)
- Auth с JWT (для action-кнопок и mutation API)

## Архитектура

```
┌────────────────────────────────────────────────────────────┐
│  ИСТОЧНИКИ (без изменений)                                 │
│  • 1GDRZ Income (бухгалтер вписывает руками)               │
│  • Matchpoint API (scrape)                                 │
│  • PnL spreadsheet                                         │
└──────────────────────┬─────────────────────────────────────┘
                       │ ETL (Python pipeline на ноуте, cron 23:50)
                       ↓
┌────────────────────────────────────────────────────────────┐
│  v7padel_db (Google Sheets)                                │
│  • transactions, customers, bookings, expenses, ...        │
│  • client_balances (свежий, через scrape_balances.py)      │
│  • debts, balance_log (через scrape_debts.py)              │
└──────────────────────┬─────────────────────────────────────┘
                       │ build_cache.py агрегирует
                       ↓
┌────────────────────────────────────────────────────────────┐
│  v7padel_cache (Google Sheets)                             │
│  • dashboard_kpis, monthly_series, rev_weekly_*, ...       │
│  • top_clients_revenue, occupancy_planfact, ...            │
│  • new_clients_retention (когорты)                         │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       │ Backend читает (с in-memory cache)
                       ↓
┌────────────────────────────────────────────────────────────┐
│  BACKEND (FastAPI на Railway, $5/мес)                      │
│  https://backend-production-7989f.up.railway.app           │
│                                                            │
│  ┌─ READ API ────────────────────────────────────────┐  │
│  │  GET /api/cache/{tab}  → проксирует Sheets cache    │  │
│  │  GET /api/db/{tab}     → проксирует Sheets db        │  │
│  │  GET /api/client/{cid} → готовый JSON profile         │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─ WRITE API (новые данные) ────────────────────────┐   │
│  │  POST /api/notes        → notes о клиенте           │  │
│  │  POST /api/tags         → теги клиента              │  │
│  │  POST /api/contact_log  → история контактов         │  │
│  │  POST /api/webhooks/lead → лиды из IG/форм          │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─ STORAGE: SQLite (data/v7padel.db) ───────────────┐    │
│  │  notes(cid, author, text, created_at)               │   │
│  │  tags(cid, tag, source)                             │   │
│  │  contact_log(cid, channel, result, note, ...)       │   │
│  │  leads_inbox(source, utm, contact_*, payload)       │   │
│  │  + club_id во всех (multi-tenant ready)             │   │
│  │  ❌ НЕТ PII (phone/email/имя) — только в Sheets     │   │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  AUTH: JWT 24h, password из login.html (тот же)          │
└──────────────────────┬─────────────────────────────────────┘
                       │ JSON, ~10-50 KB
                       ↓
┌────────────────────────────────────────────────────────────┐
│  FRONTEND (GitHub Pages, https://v7padel.space)            │
│  • Старые страницы продолжают читать Sheets напрямую       │
│  • Новые feature (CRM, leads) ходят через backend          │
│  • Postepенная миграция (НЕ ломаем старое)                 │
└────────────────────────────────────────────────────────────┘
```

## Стек

| Компонент | Технология | Почему |
|-----------|-----------|--------|
| Web framework | FastAPI 0.115 | Auto-docs, validation, modern, AI-friendly |
| ORM | SQLAlchemy 2.0 | Industry standard, type-safe |
| Storage | SQLite | На 1350 клиентов и логи — достаточно. Postgres когда упрёмся |
| Auth | JWT (python-jose) + simple password | Минимум, до Google OAuth Phase 2 |
| Sheets | gspread + service-account | Тот же стек что в ETL |
| Hosting | Railway Hobby ($5/мес) | Single-click deploy, auto-SSL, env vars management |
| CI | GitHub Actions → ghcr.io | Бесплатно, авто-build на push |

## Ключевые принципы

### 1. Sheets — источник правды для ETL data
Backend **не дублирует** transactions/bookings в свою БД. Читает из Sheets с кэшем 10 минут. Если backend упадёт — frontend читает Sheets напрямую как раньше.

### 2. Backend владеет ТОЛЬКО новыми данными
notes, tags, contact_log, leads_inbox — это всё, что **не существовало до backend'а**. Никаких миграций, никаких race conditions.

### 3. PII не покидает Sheets (KVKK)
SQLite хранит только `cid` (число) + non-PII (текст заметки, тег, тип канала). Phone/email/имя — в Sheets под Google Workspace compliance.

### 4. Multi-tenant с первого дня
Все write-таблицы имеют `club_id` (default `antalya`). Когда откроется 2-й клуб — добавляется флаг, миграции не нужно.

### 5. Idempotent ETL → Backend (не наоборот)
ETL писал в Sheets, теперь и в Sheets и backend синхронизирует автоматически. Backend никогда не пишет в Sheets — это запрещено.

## Endpoints

### Auth
- `POST /api/auth/login` — `{password}` → `{token, role}`
- `GET /api/auth/me` — кто я (требует JWT)

### Read (proxy для Sheets)
- `GET /api/cache/{tab}` — читает таб из v7padel_cache (агрегаты)
- `GET /api/db/{tab}` — читает таб из v7padel_db (raw)
- `POST /api/cache/clear` — сброс in-memory кэша (admin)

### Client profile
- `GET /api/client/{cid}` — полный JSON: identity + finance + crm

### CRM (write)
- `POST /api/notes` — `{cid, text}` → создать заметку
- `GET /api/notes/{cid}` — список заметок клиента
- `DELETE /api/notes/{note_id}` — удалить
- `POST /api/tags` — `{cid, tag}`
- `DELETE /api/tags/{tag_id}`
- `POST /api/contact_log` — `{cid, channel, direction, result, note}`

### Webhooks (open, без auth)
- `POST /api/webhooks/lead` — capture лида (IG, форма, Telegram)
- `GET /api/leads?processed=0` — admin inbox

## Repo и deploy

| Что | Где |
|-----|-----|
| Backend код | https://github.com/volodimirrykov-lang/v7padel-backend |
| Frontend код | https://github.com/omalkut-prog/v7padel (текущий site) |
| Docker image | `ghcr.io/volodimirrykov-lang/v7padel-backend:latest` |
| Railway URL | https://backend-production-7989f.up.railway.app |
| Railway project ID | 245adbe0-2824-4fcb-8e49-d24d50eef721 |
| Service ID | 0b5d214a-2625-4dde-ba6e-a58361c8e041 |
| API docs | https://backend-production-7989f.up.railway.app/docs |

## Pipeline

1. `git push` в `main` ветку backend repo
2. GitHub Actions триггер `.github/workflows/docker.yml`
3. Билд Docker image (~3-4 мин)
4. Push в `ghcr.io/volodimirrykov-lang/v7padel-backend:latest`
5. Railway не auto-redeploy (т.к. image source) — нужен manual `serviceInstanceRedeploy`
6. (TODO) Настроить webhook GitHub → Railway чтобы avto-redeploy

## SLA / Что предлагает Railway Hobby plan

- 99.9% uptime SLA
- $5/мес = $5 credit + pay-per-use
- Auto SSL (Let's Encrypt)
- Volume для SQLite (TODO: добавить, сейчас БД сбрасывается при redeploy)

## Backlog (что улучшить дальше)

- [ ] **Volume для SQLite** в Railway (1 GB, чтобы БД не сбрасывалась)
- [ ] **GitHub → Railway webhook** для auto-redeploy после билда
- [ ] **Google OAuth** вместо single password (Phase 2)
- [ ] **Sentry** для error tracking
- [ ] **Тесты** (pytest + httpx test client)
- [ ] **Своя VPS** (Phase 3 — see backlog `Backend → свой сервер`)

## Безопасность

- ✅ JWT 24h expire
- ✅ CORS с whitelist (`https://v7padel.space`)
- ✅ Service Account credentials через env var (не в репо)
- ✅ Image public (нет секретов в коде)
- ✅ HTTPS by default (Railway)
- ⚠️ Single password (план: Google OAuth)
- ⚠️ Нет rate limiting (план: Cloudflare protection в Phase 2)
- ⚠️ Volume не настроен — БД на ephemeral disk (планируется fix)

## Что мы НЕ делаем (anti-patterns)

- ❌ НЕ дублируем ETL data в backend SQLite (только notes/tags — новое)
- ❌ НЕ пишем из backend в Google Sheets (sheets read-only из backend)
- ❌ НЕ кладём PII в SQLite (KVKK)
- ❌ НЕ делаем backend single point of failure (frontend имеет fallback на прямые Sheets reads)
- ❌ НЕ ставим тяжёлые зависимости (нужно держать <100 МБ image)
