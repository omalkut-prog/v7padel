# 05 — Backlog

*Last updated: 2026-04-30*
*Пересматривается: воскресенье 18:00 (Володимир + ИИ)*

## Контекст: AI-driven сетевая модель

С 2026-04-30 backlog перестроен под org-structure из `v7_org_structure.html`:

- **3-уровневая модель**: CEO → V7 Group (global УК) → V7 Турция (региональная УК) → Клубы
- **AI Layer** = 8 cross-cutting агентов которые масштабируются на всю сеть
- **Стратегический фокус**: «допилить 1 клуб» → «построить инфраструктуру под сеть»
- **Ключевое решение** (2026-04-30): CRM строим в нашем портале (не Matchpoint, не HubSpot). Cross-club unified base — наша БД.

## Связанные документы (читать перед стартом)

- **[20_ACCESS_LIST.md](20_ACCESS_LIST.md)** — какие доступы нужны Claude (без IT-лексики)
- **[21_SITE_SPEC_FOR_MAX.md](21_SITE_SPEC_FOR_MAX.md)** — детальная спека сайта для Макса (80 мин работы)
- **[19_FULL_AUDIT.md](19_FULL_AUDIT.md)** — полный аудит несделанного (150 пунктов)

## Правила

- **Max 5 в `NOW`**. Шестой пункт не попадает пока пятый не закрыт.
- Каждый пункт: **Impact · Effort · Owner**. Без этого — не в `NOW`.
- Оценки времени **с Claude Code** — реальные, не «человеко-дни» 2022 года.

---

## NOW (5 max) — закрыть в первые **3-4 часа** работы

### 1. Security minimum (15 мин)

- **Импакт**: критический. Сейчас `sa.json` лежит только на ноуте Володимира → потеря = доступ ко всем данным V7 потерян.
- **Effort**: **15 мин Claude** (когда Володимир даст Drive-папку)
- **Что делается**:
  1. Бэкап `sa.json` + `matchpoke_creds.json` в защищённый Drive
  2. Удалить хардкод-пароли из `login.html` (P0 из аудита A.1) — заменить на временную более сложную схему до полного OAuth
  3. Отключить public доступ к Google Sheets — оставить только для service-account
- **Owner**: Claude
- **Зависимости**: Володимир дать Drive-папку URL

### 2. Top 1% защита (20 мин)

- **Импакт**: 60 клиентов = 48% выручки. Один уход = −9-15k₺/мес. Сохранение 1 = окупает любую другую задачу.
- **Effort**: **20 мин Claude**
- **Что делается**: в `clients.html` → новый блок «Top 60 — статус активности». Список с alerts: 🔴 «остыл» (>14 дней без визита), 🟡 «снижение частоты» (визитов в этом месяце меньше среднего × 0.5), 🟢 «активен». Кликабельный → WhatsApp → Настя-VIP звонит.
- **Owner**: Claude
- **Cross-link**: F.2 из аудита

### 3. Сайт — SEO + Tracking + Schema через Макса (80 мин Макса)

- **Импакт**: 30-50% больше органического трафика за 2-3 мес. Полная атрибуция рекламы Эрдема.
- **Effort**: **80 мин Макса** (детальная спека готова: [21_SITE_SPEC_FOR_MAX.md](21_SITE_SPEC_FOR_MAX.md))
- **Что в спеке**:
  - 7 задач: meta descriptions, OG image, tracking (GA4 + Meta + TikTok), Schema.org, hreflang, cookie banner, email capture
- **Owner**: Макс (developer) + Эрдем (Pixel ID, GA ID)
- **Альтернатива**: Володимир даст мне Webflow Designer access → я делаю сам за 1 час
- **Cross-link**: G.1, G.2 из аудита

### 4. WhatsApp Business templates submit (15 мин + 1-2 нед Meta)

- **Импакт**: разблокирует Retention Agent. Без approved templates — никаких массовых сообщений.
- **Effort**: **15 мин Claude** (тексты 5 шаблонов на 4 языках) + **1-2 недели** Meta approval
- **Что делается**:
  1. Тексты 5 templates: welcome, recall (>14 days), recall (>30 days), card_expiring, card_expired_winback
  2. На 4 языках (EN/RU/TR/UA) — 20 templates total
  3. Эрдем сабмитит в Meta Business Manager
- **Owner**: Claude (тексты) + Эрдем (submit)

### 5. Backend Foundation v0 (3 часа)

- **Импакт**: enabler для CRM v0 + multi-tenant + AI агентов. Текущую инфру выдержит до открытия А2, но **CRM в нашем портале** требует backend для multi-user concurrent edit (Sheets имеет race conditions).
- **Effort**: **3 часа Claude**
- **Стек**:
  - **Hosting**: Fly.io ($5/мес)
  - **DB**: Supabase Postgres ($25/мес или free tier для старта)
  - **API**: FastAPI Python (быстрее писать, легко интегрировать с существующим ETL)
  - **Auth**: Google OAuth (заменит хардкод passwords из login.html)
  - **Multi-tenant ready**: `club_id` во всех таблицах с самого начала
- **Деплой**:
  1. Schema (customers, communications, notes, tags) — `club_id` mandatory
  2. Миграция текущих customers из Sheets → Postgres (one-time + 2 нед параллельной работы для сверки)
  3. API endpoints: `GET /customers`, `POST /customers/{id}/notes`, etc.
  4. JWT с `club_id` claim — RLS в Postgres
- **Owner**: Claude

---

## NEXT (10 max) — следующие 1-2 недели после закрытия NOW

### N1. CRM v0 в портале (3 часа)

- **Импакт**: убирает зависимость от Matchpoint UI для daily customer ops. Cross-club master record. Источник правды для AI-агентов.
- **Effort**: 3 часа Claude (после Backend Foundation)
- **Что делается**:
  - Customer card в `clients.html` → клик по строке → детальная карточка
  - Поля: notes (text append-only с timestamp + author), tags (free-form), follow_up_date, source, stage
  - Edit через POST API → Postgres
  - Filters: by stage / segment / tag / source / follow_up_due / last_visit_days / club
  - Bulk actions: mark «called», export selected, send WhatsApp template
- **Cross-link**: D.4 (Retention Agent) использует это API

### N2. Retention Agent v0.1 (1.5 часа)

- **Импакт**: auto-recall 50-100 клиентов/мес. Восстановление 5-15.
- **Effort**: 1.5 часа Claude (после WhatsApp approval + CRM v0)
- **MVP**:
  - Скрипт читает из CRM API: at_risk segment + follow_up_due
  - Отправляет approved WhatsApp templates через Meta Cloud API
  - Логирует communications в CRM
  - Cron: вторник 14:00 (Анталья)
  - Human-in-the-loop первые 2 недели: все сообщения approval Насты-VIP

### N3. YouTube канал реанимация (плановая работа SMM + AI)

- **Контекст**: канал https://www.youtube.com/channel/UCzz_UDNDMt2b8r18LiPpU7A — заброшен.
- **Что делать**:
  1. **Эрдем** (SMM) — настроить YouTube Studio, обновить description / banner / channel art
  2. **Контент-план** — 4 формата: highlights турниров (1/нед), tutorial видео (1/мес), интервью с тренером/чемпионом (1/мес), behind-the-scenes Camp (когда проводим)
  3. **AI Marketing Agent** (M3 в roadmap) — генерит scripts, captions, descriptions, тэги
  4. **AI Brand Agent** (M5) — thumbnails в Figma + auto-edit видео
- **Сейчас**: ничего — пока не сделаны Marketing/Brand агенты, реанимация = ручная работа
- **Реальный запуск**: после M3 + M5 (квартал Q3)
- **Owner**: Эрдем (контент) + Claude (AI agents)
- **Cross-link**: D.1, D.7

### N4. TikTok @v7padel_antalya реанимация

- **Контекст**: тот же что YouTube — аккаунт есть, заброшен.
- **Что делать**: то же что YouTube + специфика TikTok (вертикальные шорты 30-60с, тренды-челленджы).
- **Параллельный канал** для Эрдема — TikTok organic + Pixel установлен (см. NOW #3 → задача 3 в спеке для Макса)
- **Owner**: Эрдем + AI Marketing Agent (M3)

### N5. Email Marketing (Brevo) — auto-welcome + monthly newsletter

- **Контекст**: после установки Email capture на сайте (NOW #3 → задача 7 в спеке) — будут подписчики.
- **Что делать**:
  - Welcome email (мгновенно после подписки) — 4 языка
  - Monthly «V7 News»: что было, турниры предстоящие, специальные Camp/Intensive предложения
  - Re-engagement (для не открывающих 60 дней)
- **Effort**: 2 часа Claude + Эрдем (визуал)
- **Когда**: после Email capture на сайте

### N6. Coach Performance Dashboard (30 мин)

- **Импакт**: visibility кто из тренеров тянет / отстаёт. Данные для бонусов / coaching.
- **Effort**: 30 мин Claude
- **Что**: на /clients → раздел Тренеры → таблица: имя · % загрузки слотов · выручка с тренировок · retention учеников 60d · средний чек.
- **Cross-link**: I.8 из аудита

### N7. ETL на GitHub Actions (30 мин)

- **Импакт**: 100% uptime cron, не зависит от ноута Володимира.
- **Effort**: 30 мин (всё уже подготовлено локально)
- **Шаги**: создать приватный репо `omalkut-prog/v7padel-etl`, добавить 3 secrets, push, запустить workflow
- **Owner**: Claude + Володимир (создать репо в GitHub)

### N8. Mobile UI fix dashboard + revenue + clients (30 мин)

- **Импакт**: 90% команды смотрит с телефона. Сейчас частично broken на mobile.
- **Effort**: 30 мин Claude

### N9. Тесты для критических ETL функций (1.5 часа)

- **Что покрыть**:
  - `merge_manual_entries` (dedup) — критично, см. ADR-015
  - `compute_top_clients_revenue`
  - `compute_clients_enriched`
  - `compute_member_churn`
- **Cross-link**: K.4 из аудита

### N10. KVKK compliance (1 час Claude + 1 нед юриста)

- **Импакт**: юридический риск. Турция требует для всех бизнесов с клиентскими данными.
- **Effort**: 1 час Claude (документы шаблон) + 1 неделя Ваня (legal review + signatures)
- **Что**: Privacy Policy, KVKK Consent при регистрации, право на удаление, audit log

---

## NEXT (продолжение) — после M1 (Retention Agent работает)

### M2-M8. Остальные 7 AI Agents (после CRM v0)

| ID | Агент | Что делает | Effort |
|---|---|---|---|
| M2 | Customer Support | 24/7 WhatsApp/Telegram бот: бронирования, FAQ | 1.5 часа |
| M3 | Marketing Agent | Контент, посты для IG/FB/TikTok/YouTube | 1 час |
| M4 | Sales / Outreach | Холодные касания корп клиентам | 1 час |
| M5 | Brand / Design | Креативы баннеры через AI gen | 1 час |
| M6 | Coach-Ops | Расписание тренеров, конфликты | 1 час |
| M7 | Finance Ops | Auto-сверка PnL, fixed_opex, аномалии | 1 час |
| M8 | AI Coordinator | Master-агент распределяет задачи | 2 часа |

**Архитектура**: каждый агент — Python service на Fly.io, читает/пишет через Backend API.

### N11. 2-й клуб А2 — операционная подготовка

- Поиск площадки (Володимир)
- Шаблон команды (копируем с А1)
- Onboarding playbook через `docs/`
- **Когда**: триггер — подписан договор аренды

### N12. Network Dashboard (Group view)

- CEO видит все клубы одновременно
- Cross-club KPI сравнения
- **Когда**: после открытия А2

### N13. Tournament + Camp ROI tracking

- Метрики на event: cost vs revenue, fill rate, LTV участников после
- **Effort**: 1 час Claude

### N14. Cohort retention curves

- Из когорты Apr-2026 — сколько играет в May, Jun, ...
- 12-month retention view
- **Effort**: 30 мин

### N15. Public website SEO content boost

- Цены страница (4 языка)
- Тренеры (имена, фото, биография на 4 языках)
- FAQ страница
- Testimonials блок
- **Effort**: 2 часа Claude (контент) + Макс (Webflow setup)

---

## LATER

- **Snapshot-tracking отмен → cid** — для ТОП-клиентов по отменам
- AI-предсказание churn risk
- Авто-классификация description → service_type
- Google Calendar интеграция (тренерские слоты)
- Push-уведомления через Matchpoint API
- CSV/Excel экспорт со всех страниц
- Filters в clients.html (bucket × segment × visits)
- Dashboard для тренера (его ученики, прогресс)
- `manager-*.html` — наполнить или удалить (4 заглушки)
- Рефакторинг `revenue.html` (179KB inline JS)
- `intensive.html` — почему 2МБ
- `scrape_debts.py` cron или удалить
- Редизайн навигации (15+ пунктов в сайдбаре)
- Telegram bot для recall (альтернатива WhatsApp)
- Dutch / другие языки (когда расширение)
- Customer portal на нашем бренде (заменит Matchpoint customer-side)
- Reviews / testimonials система сбора
- Loyalty program (помимо членства)
- Gift cards / подарочные сертификаты

---

## PARKING LOT (идеи без решения делать)

- Программа рефералов (без скидок — подарки?)
- NFC-карточки вход
- Своё приложение V7 (Matchpoint покрывает)
- Мерч онлайн (`/merch` уже есть — расширить?)
- Реанимация Racket.ID интеграции
- Investor pitch deck

---

## Done / Archive

### 2026-04-30
- ✅ **#5 (старого backlog) Fix `is_paid` / `is_cancel`** — был всегда 0, парсинг checkbox в HTML, теперь 97% paid 3% cancel реальные
- ✅ **#4 (старого backlog) brain.html → markdown reader** — single source of truth `site/docs/`, удалены legacy `V7_Padel_Brain.md` + `knowledge.html`
- ✅ **`docs/19_FULL_AUDIT.md`** — полный аудит 150 пунктов
- ✅ **`docs/20_ACCESS_LIST.md`** — список доступов для не-айтишника
- ✅ **`docs/21_SITE_SPEC_FOR_MAX.md`** — спека для Макса 80 мин

### 2026-04-25
- ✅ Memberships block переписан с нуля
- ✅ may-goal.html: 3 категории, графика, 4 языка (EN/RU/UA/TR)

### 2026-04-24
- ✅ pytest suite (64 теста)
- ✅ docs/16_CONSISTENCY_AUDIT.md
- ✅ docs/15_FINANCE_RECONCILIATION.md
- ✅ Cache buster + dashboard блоки независимые

### 2026-04-22
- ✅ docs/14_CODE_REVIEW.md
- ✅ docs/13_ACCOUNTING_RULES.md
- ✅ ADR-017, ADR-018

### 2026-04-16
- ✅ Fix `bookings.customer_id` (Phase D — `sync_bookings_matchpoint.py`)
- ✅ Топ клиентов по выручке `clients.html`
- ✅ club-members.html
- ✅ Lite refresh button
- ✅ Авто-генератор `04_CURRENT_STATE.md`

### 2026-04-14/15
- ✅ Миграция `last_tx` → `activity_bucket`
- ✅ recall.html
- ✅ docs/ структура
