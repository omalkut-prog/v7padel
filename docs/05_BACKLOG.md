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

### N1.13. Data Quality + Dead Souls audit (4 часа)

> Володимир: «много где просто 111111, это фейк ты думаю умеешь такие определять. С ними мы работать не сможем.»

**Что**: страница `/data-quality.html` + endpoint `/api/data-quality/contacts` для аудита базы клиентов.

**Что показывает**:
- Total clients vs Reachable (есть валидный email или phone)
- Dead souls list (нет ни одного канала) — на удаление через админа
- Fake/duplicate contacts (1111111, test@test.com, повторяющиеся цифры) — для очистки
- Активные клиенты с fake контактами → срочно опрос менеджеру при следующей встрече

**Cleanup actions**:
- Bulk delete dead souls (после approve Володимира)
- Highlight в /clients: клиенты с fake контактами → красная пометка «нужны контакты»
- Admin при booking видит warning «у клиента нет валидного контакта»

**Текущие цифры** (на 2026-05-04):
- Всего: 1353
- С обоими контактами: 833 (62%)
- С одним: 496 (37%)
- Dead souls: 24 (2%)
- Fake email: 500 (37%) — много
- Fake phone: 44 (3%)

### N1.14. Postgres ETL pipeline + data attribution (Backend Phase 2)

> Внешний AI совет (одобрено): без правильной attribution Marketing-агент = галлюцинации.

**Что**: Postgres БД (Supabase или Railway) **дополняет** Sheets, не заменяет:
- Sheets остаётся для existing flows (фронт + админы)
- Postgres — для аналитики, joins, attribution

**Schema**:
- `events` — booking, cancel, no-show, signup, message, payment (cid, type, ts, channel, source)
- `attribution` — lead_id → first_visit_id → second_visit_id (с UTM tags)
- `ad_spend` — расходы по каналам (Meta, Google, IG, Tournament sponsorships)
- `agent_state` — context для Phase 1+ агентов

**ETL изменения**:
- `etl.py` параллельно пишет в Sheets и Postgres
- Sheets как fallback (если Postgres упал — фронт работает)

**Эффект**: можно строить SQL дашборды, joins, время-серия аналитика в реальном времени.

**Effort**: 1-2 дня с AI tooling (раньше я говорил 2-3 недели — это была ошибка по старым меркам).

### N1.15. Marketing Funnel — UTM tracking + advisor v0 (3-4 часа)

**Что делать СЕЙЧАС** (до полной attribution):

**Phase A — UTM-tagging spec для Erdem** (1 час):
- UTM на всех ссылках в IG bio, постах, Ads
- Schema: utm_source/medium/campaign/content
- Lead form поле «откуда узнали о V7?» (turistic / friend / IG / Google / tournament / other)
- Все capture'ы → leads_inbox через webhook

**Phase B — Source поле в customers** (30 мин):
- Новое поле `source` в Matchpoint customer (manually на ресепшне сейчас)
- ETL пишет в customers.source
- Dashboard /funnel.html показывает breakdown by source

**Phase C — Marketing Advisor agent** (2 часа):
- НЕ automation, а **рекомендации куда смотреть**
- Пример output: «Tourist канал CAC 1500 ₺, средний tourist 1 booking → LTV ≤3000 ₺. Подозрительно. Проверь.»
- Запускается раз в неделю, отчёт в Telegram Володимиру
- На ограниченных данных — даёт directional insights, не precise numbers

### N1.16. Pre-launch testing playbook для нового клуба (LATER)

> Внешний AI совет: тестируй спрос ДО подписи лиза.

**Что**: documented playbook как тестировать спрос на новой локации до инвестиции:
1. Лендинг с локацией (3 часа)
2. Meta Ads / Google Ads с фокусом на гео (1 час setup + budget)
3. Обещание «открываем X числа» с запиской интереса (email capture)
4. 2 недели тестирования
5. Метрики: CPL, ratio просмотров → email captures, opening rate writeup
6. Решение: подписывать лиз / искать другую локацию / отложить

**Effort**: 2 недели real-time + 4 часа моей работы на playbook + landing template.

**Trigger**: когда Володимир рассматривает 2-й клуб.

### N1.12. Agent Control Center (`/agents.html`) — управление AI агентами (3-4 дня)

> Володимир: «failure mode для AI это вообще гениально нужно в отдельную страницу, общение агентов, где мы будем задавать настройки и улучшать алгоритмы! фантастика».

**Что это**: единая консоль управления всеми AI агентами V7. Не «один agent в /client.html», а **observability + settings + tuning** для всей agent layer.

**Разделы страницы**:

#### 1. Live Activity (главный экран)
- Все active conversations (клиент пишет → AI обрабатывает → менеджер approves)
- Pending approvals (drafts ожидают менеджера)
- Today metrics: # interactions, % auto-handled, avg manager response time, escalation rate
- Live feed: «10:32 — клиент Anna spr про слот, AI draft → Pars approved → sent (12s)»

#### 2. Escalation Inbox
- Все Level 2-3 escalations (sorted by priority + SLA timer)
- Click → full context (history, notes, tags, last_visit) + draft response
- Buttons: «I handle» / «Forward to other manager» / «Need founder»

#### 3. Agent Settings
- **Prompts** — редактируемые prompt templates per use case (с git history)
- **Confidence thresholds** — slider Level 0/1/2 (по умолчанию 0.9/0.6/0.3)
- **Languages** — переключение TR/EN/RU/UA/ES per agent
- **Channels** — какие каналы активны (WhatsApp / Telegram / IG / Internal portal)
- **Working hours** — когда AI auto-replies, когда waits manager
- **Personas** — какому менеджеру AI «приписывает» ответ (Pars / Olha / Nastya)

#### 4. Use Case Library
- Список scenarios что AI обрабатывает: booking question, schedule, price, refund, complaint, etc
- Per scenario: success rate, avg confidence, # escalations
- Click → drill-down examples + tune

#### 5. Learning Loop
- Weekly review queue: cases где AI ошибся
- Manual feedback: «AI должен был ответить так» → добавляется в few-shot examples
- A/B testing prompts (новый vs старый, какой работает лучше)

#### 6. KPI Dashboard
- Escalation rate < 5% (target)
- Time-to-human < 5 мин Level 2
- Recovery rate > 80%
- Per-channel performance
- Per-language performance
- Customer satisfaction (post-conversation 1-5 rating)

**Tech**:
- `/agents.html` страница в frontend
- Backend endpoints `/api/agents/*` для CRUD на settings
- Postgres таблицы: `agent_conversations`, `agent_escalations`, `agent_prompts` (versioned), `agent_metrics`
- Real-time updates через WebSockets или polling

**Effort**: 3-4 дня после Phase 1 admin agent готов.

**Trigger**: когда Phase 1 + Phase 2 (survey) запущены и накопились ≥ 100 interactions.

### N1.11. AI Admin Agent (Phase 1) — natural language search для админа (1-2 дня)

> Володимир: «дай мне игроков на турнир американо новичков пятница 20:00, дай ДР в ближайшую неделю, дай аналитику VIP/Club...»

**Главное конкурентное преимущество**: ни один padel-клуб в Турции (и почти никто в мире) не имеет admin-агента который понимает natural language и даёт actionable lists.

**Что делает Phase 1**:
- Admin/Володимир пишет в окне: «найди игроков на американо в пятницу 20:00 для новичков»
- Backend endpoint `POST /api/agent/query` отправляет в Claude API с structured context (наша БД)
- Возвращает: список клиентов + telephony + last_visit + любимый партнёр + draft messages на их языке (TR/EN/RU/UA)
- Admin ревьюит, корректирует, отправляет (Phase 1 НЕ автоматизирует отправку)

**Use cases (10 базовых)**:
1. Игроки для турнира (filter by level, time pattern, segment)
2. ДР в ближайшие 7-14 дней + suggestion
3. VIP/Club analytics (уровень, пол, время, ДР, last contact)
4. Cold/slow клиенты (>14 дней не были)
5. Кому давно не делали touch (>30д без contact_log)
6. Кандидаты в Inner Circle (top по выручке + active)
7. Recall candidates (bucket 31_90d)
8. Members истекают через 14 дней
9. Клиенты-новички которые перестали (14d retention отвал)
10. Кросс-фильтры (например «турки + advanced + играли в субботу»)

**Multilingual drafts**: agent пишет приглашения на языке клиента (поле `language` в customers + автоопределение по тексту прошлых сообщений).

**Tech**:
- Backend `/api/agent/query` endpoint
- Claude API с structured prompt (~5 KB context per query)
- UI в `/client.html` + новая консоль `/agent.html` (главный терминал админа)
- Cost ~$10/мес на 1000 запросов

**Зависит от**: backend (есть), customers/bookings/transactions (есть).

**НЕ зависит от**: WhatsApp templates (Phase 1 не отправляет, только показывает drafts), AI auto-notes (это другой level).

**Risk**: минимальный — клиент НЕ взаимодействует с AI напрямую. Только админ.

**Trigger для запуска**: после того как Володимир скажет ОК на Phase 1 (предложение принято).

### N1.10. AI Auto-Notes — заметки на основе истории игр (3-4 часа)

> Володимир: «мне нужно чтоб ии заметки делал исходя из того что уже отыграл, те из истории».

**Идея**: вместо того чтобы Володимир/менеджер вручную писал «играет по утрам», AI анализирует историю и **сам генерит заметки-инсайты** в карточке клиента:

```
🤖 Авто-инсайт (обновлено 2026-05-04):
• Играет регулярно — 8 визитов за 30 дней (ср. 2 в неделю)
• Любит утро (Пн, Ср) — 70% игр до 12:00
• Стандартный партнёр: Андрей Петров (cid=42, 12 совместных игр за 90д)
• Любимый корт: P2 (60% бронирований)
• Покупает энергетики Monster ~2× в неделю
• Тренировки: 4 за 30д с коучем Марией (Beginner → Intermediate progress)
• Last contact 12д назад — пора touch
```

**Реализация (2 варианта)**:

**Вариант A — Rule-based (быстрый, без AI)** — 1.5 часа:
- Backend endpoint `GET /api/client/{cid}/insights`
- Анализ из bookings/transactions: топ-партнёр, любимые часы, средний интервал между играми, тренды
- Шаблонные строки на основе threshold'ов
- Минусы: жёсткие шаблоны, не адаптивно

**Вариант B — Claude AI (умный, адаптивный)** — 3-4 часа:
- Backend endpoint `GET /api/client/{cid}/insights?ai=true`
- Собирает structured data → отправляет в Claude API с prompt'ом
- Claude генерит 3-5 человеческих заметок-инсайтов
- Кэшируется в SQLite (refresh раз в день)
- Cost: ~$0.001 на клиента × 1350 = ~$1.5/мес для всех
- Плюсы: адаптивно, может ловить тонкости (например «возможно скоро подтянется к VIP — 95% активности и растёт»)

**Рекомендация**: начать с **A** (быстро + видно ценность), потом мигрировать на **B** если Володимир захочет нюансов.

**Где показывать**:
- На `/client.html?cid=N` в блоке «Заметки» — секция «🤖 AI-анализ» НАД ручными заметками
- Auto-refresh раз в день (cron)
- Можно «save as note» если AI сделал особенно хороший инсайт

**Зависит от**:
- Backend `/api/client/{cid}` endpoint (уже есть)
- bookings.customer_id (для партнёров) — может потребоваться доработка ETL
- top_clients_revenue (категории покупок) — уже есть

**Trigger для запуска**: после того как накопится ≥30 заметок руками от Володимира — увидим какие паттерны люди реально пишут, AI обучим на этих стилях.

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

### Backend → свой сервер (миграция с Railway)

- **Сейчас**: backend на Railway $5/мес (https://backend-production-7989f.up.railway.app)
- **Цель**: VPS в Турции (или у программиста Володимира) для KVKK compliance + полного контроля
- **План**:
  1. Программист даёт SSH доступ к VPS (или поднимаем свой Hetzner/DigitalOcean)
  2. Ставим Docker + nginx + Let's Encrypt SSL (30 мин)
  3. Pull `ghcr.io/volodimirrykov-lang/v7padel-backend:latest` (тот же образ что Railway)
  4. Domain `api.v7padel.club` → server IP
  5. Backup стратегия (rsync / Borg)
  6. Cutover: переключаем frontend, отключаем Railway
- **Effort**: 30-60 мин когда есть VPS
- **Когда**: после того как backend стабильно работает 1-2 недели на Railway, добавлены notes/tags/CRM v0
- **Trigger**: открытие 2-го клуба ИЛИ запрос KVKK compliance ИЛИ Railway проблемы
- **Преимущества**: полный контроль, дешевле в долгосроке, data residency, privacy
- **Минусы**: sysadmin support нужен, бэкапы сами, диагностика самим


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
