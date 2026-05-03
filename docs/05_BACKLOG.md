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

### N1.6. Lead Funnel + CAC tracking (КРИТИЧНО) — 4 часа

> Володимир: «не вижу замеров почем лидов получаем, сколько они стоят, сколько приносят, разработка воронки и как её отслеживать — а это наверное одно из самых главных».

**Принцип**: один CAC и одно ARPU **не существует** — у каждого канала / сегмента своя экономика. Турист CAC=2000₺/LTV=5000 ≠ Локал-VIP CAC=5000/LTV=200К.

**Сегменты для tracking** (минимум):
1. **Туристы EU/RU** (Instagram + Booking partnerships) — короткий цикл, низкий LTV, высокий объём
2. **Турниры/кэмпы** (rating-driven) — выручка-под-событие, CAC = % от tournament fee
3. **VIP / Inner Circle** (referrals + личный контакт) — длинный цикл, высочайший LTV
4. **Новички / Open Games / бесплатные тренировки** (top-of-funnel) — большой объём, низкий ROI на 1-й бронь, но через 14d retention превращаются в активных
5. **Дети / family** (родители платят) — отдельная воронка, разные точки входа (школы, детские мероприятия)

**Что мерить (per канал × сегмент)**:
- **Lead cost** (CPL) — сколько потратили на маркетинг / число лидов из источника
- **Conversion rate** — лидов → платящих клиентов (по segment)
- **Time to first booking** — сколько от lead до первой брони
- **14d retention** для каждой когорты (см. /cohort.html)
- **LTV proxy** — выручка от cohort за 90/180 дней
- **CAC payback period** — когда LTV покрыл CAC

**Реализация (поэтапно)**:
- **Phase 1** (1 час): UTM-структура для всех ссылок (utm_source/medium/campaign/content). Spec под Эрдема.
- **Phase 2** (1 час): добавить `source` поле в Matchpoint customer (manual at registration). Источник варианты: Instagram_Ads, Instagram_Organic, Tournament, Referral_VIP, Tourist_Booking, Walk-in, Other.
- **Phase 3** (1.5 часа): новая страница `/funnel.html`: воронка по сегментам, CPL, CAC, payback period. Берёт из customers.source + ad_spend.json + cohort retention.
- **Phase 4** (30 мин): автоматизация — webhook от Instagram Lead Form / WhatsApp на наш backend → автозаписать source.

**Зависит от**: Backend Foundation (NOW.5) для phase 4. Phase 1-3 можно сделать без backend.

**Эффект**: понимание что 50К/мес Ads окупается через 30 дней по туристам и 90 дней по локалам, а на детей вообще не работает (например). Перераспределяешь бюджет осознанно, не «по интуиции».

### N1.7. Instagram Analytics dashboard — 1.5 часа

> Володимир: «не вижу аналитику по инстаграм».

Подписчики 2200 → 12000 — это **outcome**, не leading indicator.

**Что мерить (leading)**:
- Reach (охват) per post + story
- Engagement rate (likes+comments+saves / followers)
- **Save rate** — главный leading indicator (saves = намерение вернуться)
- Story completion rate (сколько досмотрели до конца)
- **Profile clicks → website clicks → bookings** (полная воронка)
- Follower growth (signed: gained, lost, net)
- **Sentiment** комментариев (позитив/нейтрал/негатив)

**Реализация**:
- API: Meta Graph API (Instagram Business Account) — 30 мин setup
- Скрипт `etl/sync_instagram.py` — daily snapshot reach/engagement/saves в `instagram_metrics` tab
- Страница `/social.html` — dashboards: тренды по неделям/месяцам, топ-5 postов по save rate, content type breakdown (reels/posts/stories)
- Cohort tracking: «follower acquired in week N → bookings within 30 days» — связь с lead funnel

**Owner**: Эрдем (доступ к IG Business аккаунту), Claude (код + автоматизация).

### N1.8. Мерч-стратегия: Stickers + Bottle (Two-tier) — 8 часов

> Володимир: «особенно про стикеры и для воды чашки... интересно в бэклог».

**Концепция**: Two-tier мерч.
- **Core** (постоянный, массовый, узнаваемость) — стикеры core-collection 4 дизайна 2000 шт, обычные бренд-бутылки 150 шт
- **Limited** (drop-формат, нумерация, discontinued forever, ценность) — Limited Series 01 5 дизайнов по 100 шт, Founder Series Limited bottles 100 нумерованных для первых 100 active members

**Stickers** (низкая цена, высокий objem):
- Core: V7 logo · Padel-as-lifestyle · Hop-corte · Member badge — 4 дизайна × 500 шт = 2000 шт ($150-200)
- Limited Series 01: 5 дизайнов × 100 шт = 500 шт, нумерация 01/100, ARTIST collab. Drop-формат: «Series 01 — Forever Discontinued»
- **Distribution**: free со всеми бронированиями членов, продажа в Pro Shop, give-away на турнирах

**Bottle** (среднеценный, premium-feel):
- Core: V7 branded steel bottle 750ml — 150 шт, ~150₺ себестоимость, продажа 350₺
- **Founder Series Limited**: 100 нумерованных бутылок, разной краской (gradient blue→teal), для первых 100 active members. **Раздача**: при регистрации в Inner Circle / при достижении milestone (50-я бронь). Ценность через scarcity + признание.

**Брендинг**:
- Дизайн-система $1500-3000 разово (1-2 недели)
- Photoshoot мерча для сайта/Instagram (1 день, $500-800)

**Tracking** (важно):
- Sales velocity (продажи в неделю)
- Free vs paid distribution ratio
- Repeat buyers (кто купил 2+ раза = brand affinity)
- Instagram tags / UGC от мерча

**Owner**: Макс (CMO) — ведёт production + photoshoot. Эрдем — поддерживающий контент. Володимир — финальные approvals на дизайн.

### N1.9. NPS Quarterly Member Survey — 1 час setup + 30 мин/квартал

**Зачем**: единственный leading indicator который ловит «продукт ломается» ДО того как клиенты уйдут. Бенчмарк David Lloyd: NPS >60 = премиум, 40-60 = OK, <40 = продукт сломан.

**Что измеряем**:
1. **Client NPS**: «Насколько вероятно что вы порекомендуете V7 другу/коллеге? 0-10»
2. **Coach NPS** (отдельно — тренеры держат 15-20% выручки): то же среди тренеров
3. **Open question**: «Что мы должны улучшить в первую очередь?»

**Реализация**:
- Google Forms / Typeform → результаты в Google Sheet → ETL → cache → /clients NPS блок
- Quarterly cycle: рассылаем 1 числа квартала (январь/апрель/июль/октябрь)
- WhatsApp + Email + опрос на ресепшне (offline)
- Public ответ через 30 дней («слышим тебя, делаем X, Y, Z»)

### N1.x. Карточка клиента — расширения (5 итераций)

Базовая карточка уже есть на /clients (контакты, membership, паттерн игр, last 10 бронирований). Добавить пошагово:

- **N1.1** Финансовый блок (1 час, **низкая** сложность). Из top_clients_revenue: текущий баланс из client_balances, общая выручка all/30d/90d, средний чек, последняя транзакция. Эффект: контекст «он платит много или нет».
- **N1.2** Долг/профицит + статус (1 час, **низкая**). Подтянуть real_debt и balance из debts/client_balances. Status: «в работе» / «urgent». Эффект: сразу понятно что можно закрыть.
- **N1.3** Recall статус (3 часа, **средняя**). Когда last contact, был ли ответ. Нужна новая таблица `contact_log`. Без этого Retention Agent (N2) работать вслепую.
- **N1.4** Action кнопки (4 часа, **средняя**). WhatsApp с pre-filled template, «Назначить встречу» (Google Calendar invite), «Закрыть долг» (deep link в MP). Зависит от WhatsApp templates approved (NOW.4).
- **N1.5** PCRM-поля (6 часов, **высокая**). Психо-профиль, заметки, история взаимодействий — как в личном PCRM проекте. Нужна таблица `client_notes` + UI для добавления заметок. Полноценный CRM в портале.

Логичный порядок: N1.1 → N1.2 → N1.4 → N1.3 → N1.5.

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
