# 19 · Полный аудит — что не сделано (2026-04-30)

> **Контекст**: запрос Володимира — увидеть **всё** что не сделано, прежде чем выбирать приоритеты для AI-сетевой модели.
> **Метод**: систематический проход по 17 категориям. ~150 пунктов.
> **Цель**: видение полной картины пробелов. После этого пересматриваем backlog.

## Условные обозначения

- 🔴 **P0** — критично, блокирует/угрожает
- 🟠 **P1** — серьёзно, делать в этом квартале
- 🟡 **P2** — важно, в этом полугодии
- ⚪ **P3** — nice-to-have, когда будет время

---

## A · Безопасность и юридическое

| # | Пункт | Приоритет |
|---|---|---|
| A.1 | `login.html` хардкод паролей в JS — видны в DevTools | 🔴 |
| A.2 | Google Sheets публичны (anyone with link → viewer) — любой с URL читает все данные | 🔴 |
| A.3 | `sa.json` (service account) — нет бэкапа в защищённом хранилище. Потеряется → потеря доступа ко всему | 🔴 |
| A.4 | `matchpoint_creds.json` — то же самое | 🔴 |
| A.5 | Нет 2FA на Google аккаунте (источник всех данных) | 🔴 |
| A.6 | Нет 2FA на GitHub (где код + потенциально secrets) | 🔴 |
| A.7 | Нет 2FA на Matchpoint аккаунте | 🟠 |
| A.8 | KVKK compliance (Турецкий аналог GDPR) — не оформлено. Бизнес с клиентскими данными ОБЯЗАН | 🔴 |
| A.9 | Privacy Policy на сайте — нет | 🟠 |
| A.10 | Terms of Service / публичная оферта на клубные карты — есть? | 🟠 |
| A.11 | Camp / Tournament refund policy — задокументирована? | 🟡 |
| A.12 | Нет audit log: кто-когда-что менял в Sheets | 🟡 |
| A.13 | Customer данные (телефоны, email, paid_until) — без encryption at rest | 🟡 |
| A.14 | Контракты с тренерами стандартизированы? Шаблон есть? | 🟡 |
| A.15 | Insurance клуба (бизнес-страховка, ответственность за клиентов) — оформлена? | 🟠 |
| A.16 | Insurance тренеров (medical liability если клиент травмировался) | 🟠 |
| A.17 | KVKK consent при регистрации клиента — собирается? | 🔴 |
| A.18 | Право клиента на удаление данных (KVKK Article 7) — процесс есть? | 🟠 |

---

## B · Foundation (Backend, Database, Auth)

| # | Пункт | Приоритет |
|---|---|---|
| B.1 | Backend API отсутствует. Все клиенты читают Google Sheets напрямую | 🔴 |
| B.2 | Нет proper БД (Postgres). Sheets как DB — упрётся в лимиты на 2-3 клубах | 🔴 |
| B.3 | Нет multi-tenant архитектуры. `club_id` нигде не существует | 🔴 (блокер для 2-го клуба) |
| B.4 | Нет migration tool (Alembic / sqlx) для эволюции схемы | 🟠 |
| B.5 | Нет staging environment. Все эксперименты на проде | 🟠 |
| B.6 | Нет schema validation на input (любая ерунда в Sheets ломает ETL) | 🟠 |
| B.7 | Нет API documentation (OpenAPI/Swagger) — будет когда появится backend | 🟡 |
| B.8 | Нет rate-limiting на запросах к Matchpoint (рискуем bann) | 🟠 |
| B.9 | Нет proper auth (только хардкод). Roles/permissions матрица не реализована | 🔴 |
| B.10 | Service-to-service auth (когда AI-агенты будут читать данные) — нет | 🟠 |

---

## C · Disaster Recovery & Monitoring

| # | Пункт | Приоритет |
|---|---|---|
| C.1 | Что если Google удалит spreadsheet? (был кейс в индустрии) — нет backup | 🔴 |
| C.2 | Что если Matchpoint забанит аккаунт? — нет fallback | 🟠 |
| C.3 | Что если ноут с ETL украдут? — `sa.json` потерян | 🔴 |
| C.4 | Регулярные backups: Sheets → отдельное хранилище | 🟠 |
| C.5 | Нет uptime monitoring (UptimeRobot или аналог) | 🟠 |
| C.6 | Нет error tracking (Sentry для frontend + backend) | 🟠 |
| C.7 | Нет alerts когда ETL упал (только посмотреть логи руками) | 🟠 |
| C.8 | Нет alerts когда Matchpoint поменял HTML формат (так уже было) | 🟠 |
| C.9 | Нет SLA / SLI определений (что считаем downtime?) | 🟡 |
| C.10 | Runbook «что делать если..» — частично, нужно расширить | 🟡 |
| C.11 | Тест disaster recovery — никогда не делали | 🟡 |

---

## D · AI Layer (8 агентов из оргструктуры)

| # | Агент | Что делает | Приоритет |
|---|---|---|---|
| D.1 | **Marketing Agent** | Контент, посты, captions из brand-guidelines | 🟡 |
| D.2 | **Sales / Outreach Agent** | Холодные касания, корп. продажи, follow-up | 🟠 (закрывает дыру Sales/CS Lead) |
| D.3 | **Customer Support Agent** | 24/7 WhatsApp/Telegram чат с клиентами | 🟠 |
| D.4 | **Retention / CRM Agent** | At-risk auto-recall, апсейл членства | 🟠 (ROI самый быстрый) |
| D.5 | **Analytics Agent** | Дашборды, ETL, аналитика — это **Claude (я)** | ✅ работает, но без формализации SOP |
| D.6 | **Coach-Ops Assistant** | Расписание, конфликты, списки клиентов | 🟡 |
| D.7 | **Brand / Design Agent** | Креативы, баннеры, видео-сториз | 🟡 |
| D.8 | **Finance Ops Agent** | Auto-сверка PnL, fixed_opex, аномалии | 🟡 |
| D.9 | **AI Coordinator / Orchestrator** | Master-агент распределяет задачи между агентами | 🟡 |
| D.10 | **AI cost tracking** — сколько каждый агент ест токенов/$ | 🟡 |
| D.11 | **AI fallback policy** — если OpenAI упал, какой план B | 🟡 |
| D.12 | **AI prompt versioning** — изменения промптов трекать как код | 🟡 |
| D.13 | **Brand guidelines в машиночитаемом виде** для всех AI-агентов | 🟠 |
| D.14 | **AI-driven content moderation** перед отправкой клиентам (human-in-the-loop) | 🟠 |

---

## E · Multi-club readiness (что нужно ДО 2-го клуба)

| # | Пункт | Приоритет |
|---|---|---|
| E.1 | `club_id` во всех таблицах БД (миграция) | 🔴 |
| E.2 | Row-level security в Postgres (Manager А1 видит только А1) | 🔴 |
| E.3 | Inter-company billing (если CFO работает на A1+A2 — как делить ЗП) | 🟠 |
| E.4 | Currency handling (TRY vs UAH vs USD когда Харьков откроется) | 🟠 |
| E.5 | Onboarding playbook для нового клуба (как открыть А2 за 30 дней) | 🟠 |
| E.6 | Шаблон команды (роли, штатное, ЗП) | 🟠 |
| E.7 | Шаблон контрактов с поставщиками (мячи, сетки, ракетки) | 🟡 |
| E.8 | Шаблон контракта с тренером | 🟠 |
| E.9 | Шаблон контракта с админом | 🟠 |
| E.10 | Standard chart of accounts (структура PnL одинаковая для всех клубов) | 🟠 |
| E.11 | Reporting consolidation (Group P&L = sum клубов с FX-нормализацией в USD) | 🟠 |
| E.12 | Network dashboard (CEO видит все клубы одновременно) | 🟡 |
| E.13 | Cross-club сравнения (КПИ Анталья 1 vs 2 vs Харьков) | 🟡 |
| E.14 | Permissions matrix (CEO/CFO/Manager/Coach/Admin × club) | 🟠 |

---

## F · Sales / CS / Retention процессы

| # | Пункт | Приоритет |
|---|---|---|
| F.1 | Sales / CS Lead = пустая роль (план в оргструктуре) | 🟠 |
| F.2 | **Top 1% защита**: 60 клиентов = 48% выручки → нет owner | 🔴 |
| F.3 | Win-back уволенных клиентов (>90 дней неактивности) — ad-hoc | 🟠 |
| F.4 | Корпоративные продажи (компании, корп. ивенты) — нет процесса | 🟠 |
| F.5 | LTV / CAC отслеживание формальное | 🟠 |
| F.6 | Funnel: visit → first booking → return → member — не построен | 🟠 |
| F.7 | Cohort retention 12 мес — не считаем | 🟡 |
| F.8 | Referral program (без скидок — как? подарок?) — нет | 🟡 |
| F.9 | Email marketing — нет (Mailchimp / SendGrid setup) | 🟡 |
| F.10 | Newsletter «V7 Weekly» — нет | 🟡 |
| F.11 | Loyalty program (помимо членства) — нет | 🟡 |
| F.12 | Reviews / testimonials — не собраны | 🟡 |
| F.13 | Gift cards / подарочные сертификаты | 🟡 |

---

## G · Customer-facing продукт

| # | Пункт | Приоритет |
|---|---|---|
| G.1 | **Публичный сайт V7 Padel** (отдельно от внутреннего портала) — нет | 🟠 |
| G.2 | SEO нулевой (нет meta tags, sitemap.xml, robots.txt, schema.org) | 🟠 |
| G.3 | Онлайн-бронирование через бренд V7 (не Matchpoint) | 🟡 |
| G.4 | Customer portal: история, бронирования, оплаты | 🟡 |
| G.5 | Фото клуба, тренеров, мероприятий — нет library | 🟠 |
| G.6 | Видео-туры, рекламные ролики — нет library | 🟠 |
| G.7 | FAQ страница — нет | 🟠 |
| G.8 | Contact / Карта / Часы работы — есть на каком сайте? | 🟠 |
| G.9 | Multilingual (TR/EN/RU/UK) — нет | 🟡 |
| G.10 | A/B testing инфра — нет | 🟡 |
| G.11 | PWA / installable app | ⚪ |

---

## H · Mobile & UX

| # | Пункт | Приоритет |
|---|---|---|
| H.1 | Dashboard на mobile — частично рабочий, нужен полный pass | 🟠 |
| H.2 | Revenue.html на mobile — частично | 🟠 |
| H.3 | Clients.html на mobile — частично | 🟠 |
| H.4 | Recall.html — починили (cite earlier review) | ✅ |
| H.5 | 15 ролевых страниц (admin/coach/manager × kpi/tasks/etc) — почти все mobile-broken | 🟡 |
| H.6 | Touch targets <44px (Apple HIG) — местами | 🟡 |
| H.7 | Offline mode (PWA) — нет | ⚪ |

---

## I · Product analytics

| # | Пункт | Приоритет |
|---|---|---|
| I.1 | Cohort retention curves (12 мес) | 🟠 |
| I.2 | LTV / CAC tracking | 🟠 |
| I.3 | Conversion funnel (visit → booking → return → member) | 🟠 |
| I.4 | Churn prediction model (по activity_bucket + segment) | 🟡 |
| I.5 | Court utilization heatmap (час × день недели) — есть на /revenue, не углублённый | ✅ есть |
| I.6 | Tournament ROI tracking (cost vs revenue per event) | 🟠 |
| I.7 | Camp ROI + customer LTV after camp | 🟠 |
| I.8 | Coach performance dashboard (выручка с тренировок коуча, retention учеников) | 🟠 |
| I.9 | Trainer compensation / bonus tracking | 🟡 |
| I.10 | Member churn predictor (за 7-14 дней до окончания card) | 🟡 |
| I.11 | Customer lifecycle stages (Лид → Trial → Active → Champion → At Risk → Churned) | 🟠 |
| I.12 | NPS tracking (Net Promoter Score) — collection process | 🟡 |

---

## J · Brand / Content

| # | Пункт | Приоритет |
|---|---|---|
| J.1 | Brand book документирован (logo, цвета, fonts, voice) — нет | 🟠 |
| J.2 | Tone of voice (RU/TR/EN различия) | 🟠 |
| J.3 | Visual identity guidelines | 🟠 |
| J.4 | Photo / video library организован | 🟠 |
| J.5 | Standard templates: посты IG/FB, сториз, видео | 🟠 |
| J.6 | Email templates (welcome, recall, churn, ивент-приглашение) | 🟠 |
| J.7 | WhatsApp business templates (M1 Retention использует) — нужны Meta-approved | 🔴 (блокер для AI) |
| J.8 | Press kit (для PR/media) | 🟡 |

---

## K · Tests / Code Quality

| # | Пункт | Приоритет |
|---|---|---|
| K.1 | pytest для `build_cache.py` — 64 теста ✅ | ✅ |
| K.2 | pytest для `etl.py` (Sheets → DB) — нет | 🟠 |
| K.3 | pytest для `sync_*_matchpoint.py` (8 скриптов) — нет | 🟠 |
| K.4 | pytest для `merge_manual_entries` (dedup) — критично | 🔴 |
| K.5 | pytest для `compute_top_clients_revenue` | 🟠 |
| K.6 | pytest для `compute_clients_enriched` | 🟠 |
| K.7 | pytest для `compute_occupancy_planfact` | 🟠 |
| K.8 | pytest для `compute_member_churn` | 🟠 |
| K.9 | pytest для `racketid_extract` (Firestore) | 🟡 |
| K.10 | Frontend тесты (vitest/jest) для data.js helpers | 🟠 |
| K.11 | E2E тесты (Playwright) — критичные user journey | 🟡 |
| K.12 | Load testing (что если 100 одновременных юзеров) | 🟡 |
| K.13 | Pre-commit hooks (запускают pytest перед коммитом) | 🟠 |
| K.14 | CI/CD GitHub Actions — pytest + lint на PR | 🟠 |
| K.15 | Coverage report (pytest-cov) | 🟡 |

---

## L · Tooling / DevX

| # | Пункт | Приоритет |
|---|---|---|
| L.1 | Linter Python (ruff) — не настроен | 🟠 |
| L.2 | Formatter Python (black) — не настроен | 🟡 |
| L.3 | Linter JS (eslint) — не настроен | 🟠 |
| L.4 | Formatter JS (prettier) — не настроен | 🟡 |
| L.5 | Type hints Python (mypy) — частично | 🟡 |
| L.6 | Type hints для всех `compute_*` функций | 🟡 |
| L.7 | Docstrings для всех public функций | 🟡 |
| L.8 | EditorConfig для IDE consistency | ⚪ |
| L.9 | `.env` файл для local dev (вместо `sa.json` в репо) | 🟠 |
| L.10 | Docker setup для local dev | 🟡 |
| L.11 | Makefile / npm scripts с common-task'ами | 🟡 |

---

## M · Code Debt

| # | Пункт | Приоритет |
|---|---|---|
| M.1 | `revenue.html` — 4600+ строк, 179KB. Разбить на helpers | 🟠 |
| M.2 | `intensive.html` — 2МБ. Что внутри? Вероятно embedded base64 | 🟠 |
| M.3 | 15 ролевых HTML заглушек (admin/coach/manager × X) | 🟡 |
| M.4 | Inline JS на каждой странице — выносить в модули | 🟡 |
| M.5 | Hardcoded constants (SHEET_ID, CACHE_ID, NEW_PNL_SHEET_ID) — в config | 🟠 |
| M.6 | 508 упоминаний "V7 Padel" в 72 файлах — не template-friendly | 🟡 |
| M.7 | `transaction_id` hash collisions (525 дубликатов нашли в audit) | 🟡 |
| M.8 | 3 layer dedup (sync_topup + merge_manual_entries + audit) — упростить | 🟡 |
| M.9 | Чистка orphan cache tabs (regular cleanup) | ⚪ |
| M.10 | `csv_to_sheets.py` — дублирует логику с прямыми write | 🟡 |
| M.11 | `build_cache.py` 3300 строк — разбить на модули | 🟡 |

---

## N · Documentation gaps

| # | Пункт | Приоритет |
|---|---|---|
| N.1 | `00_NORTH_STAR.md` — пустые блоки целей Q3, KPI чисел | 🟠 |
| N.2 | `11_MARKETING.md` — пустой | 🟠 |
| N.3 | Coach onboarding playbook | 🟠 |
| N.4 | Admin onboarding playbook | 🟠 |
| N.5 | Customer support FAQ для админов (как отвечать на типовые) | 🟠 |
| N.6 | Tax strategy doc (TR + AE Holding interplay) | 🟠 |
| N.7 | Brand book doc | 🟠 |
| N.8 | Disaster recovery runbook (extended) | 🟡 |
| N.9 | API doc (когда появится backend) | 🟠 |
| N.10 | AI agent prompt docs (что каждый делает, где промпт) | 🟡 |

---

## O · HR / People processes

| # | Пункт | Приоритет |
|---|---|---|
| O.1 | Onboarding playbook нового сотрудника (1-day, 1-week, 30-day) | 🟠 |
| O.2 | Performance review process (раз в квартал?) | 🟡 |
| O.3 | Compensation framework (что от чего зависит) | 🟡 |
| O.4 | Career ladder (Coach → Head Coach → Coach Coordinator) | 🟡 |
| O.5 | Skills matrix для каждой роли | 🟡 |
| O.6 | Knowledge transfer protocol (когда человек уходит) | 🟠 |
| O.7 | Employee handbook (правила, дресс-код, отпуск) | 🟡 |
| O.8 | Time tracking (для тренеров — сколько часов тренировок vs ЗП) | 🟠 |
| O.9 | Tip pooling protocol (если есть чаевые) | 🟡 |

---

## P · Financial sophistication

| # | Пункт | Приоритет |
|---|---|---|
| P.1 | Service liability tracking (см. ADR — отказались, но **записать sticky note** обязательство) | 🟠 |
| P.2 | Cash buffer rule **2× месячный OPEX** — формально не закреплено | 🟠 |
| P.3 | FX hedging strategy (TRY → USD как часто, при каком курсе) | 🟠 |
| P.4 | Inter-company transfer pricing (Group → Турция → Клуб) | 🟡 |
| P.5 | Budgeting / forecasting model (12-мес roll-forward) | 🟠 |
| P.6 | Scenario planning (что если -30% выручки 3 мес подряд) | 🟡 |
| P.7 | Capex planning (когда 5-й корт, 2-й клуб — модель) | 🟠 |
| P.8 | Tax optimization Dubai Holding (когда AE взлетит) | 🟡 |
| P.9 | Investor pitch deck (если когда-нибудь) | ⚪ |
| P.10 | Cap table tracking (если будет несколько founders) | ⚪ |

---

## Q · Tactical bugs / cleanups (мелкое но накопилось)

| # | Пункт | Приоритет |
|---|---|---|
| Q.1 | `bookings` содержит status=cancelled (audit warning) — переместить в cancellations | 🟡 |
| Q.2 | Hours bookings_active > occupancy_daily расхождение (audit warning) | 🟡 |
| Q.3 | `scrape_debts.py` в cron или удалить | 🟡 |
| Q.4 | Решение по `manager-*.html` — 4 заглушки наполнить или удалить | 🟡 |
| Q.5 | Snapshot tracking отмен → cid (для ТОП клиентов по отменам) | 🟡 |
| Q.6 | Редизайн навигации (15+ пунктов в сайдбаре, устарело) | 🟡 |
| Q.7 | Голландский язык поддержать на /may-goal? (анекдот для будущего, не сейчас) | ⚪ |
| Q.8 | Auto-классификация description → service_type | ⚪ |
| Q.9 | Push-уведомления клиентам (через Matchpoint API если откроется) | ⚪ |
| Q.10 | Fraud-detect (дубль брони, abnormal cancels) | 🟡 |
| Q.11 | Exports CSV/Excel со всех страниц | ⚪ |
| Q.12 | Filters в clients.html (bucket × segment × visits) | ⚪ |
| Q.13 | Dashboard для тренера (его ученики, прогресс, сессии) | 🟡 |
| Q.14 | Рефакторинг inline-JS в `revenue.html` | 🟡 |
| Q.15 | Telegram bot для recall (альтернатива WhatsApp) | 🟡 |

---

## Сводная статистика

**Всего пунктов**: ~150

| Приоритет | Кол-во | % |
|---|---:|---:|
| 🔴 P0 (критично) | 14 | 9% |
| 🟠 P1 (квартал) | 70 | 47% |
| 🟡 P2 (полугодие) | 55 | 37% |
| ⚪ P3 (когда-то) | 11 | 7% |

### Критические (P0) — этим заниматься не позже мая

A.1, A.2, A.3, A.4, A.5, A.6, A.8, A.17 — **8 из 14 — security**.
B.1, B.3, B.9 — backend foundation.
C.1, C.3 — disaster recovery.
F.2 — Top 1% защита.
J.7 — WhatsApp templates approval (блокирует Retention Agent).

### Если бы я был на твоём месте — топ-3 куда вложить июнь

1. **Security pass** (~3 дня): закрыть A.1-A.6, A.8, A.17. Это нельзя дальше откладывать.
2. **Backend Foundation** (5-7 дней): B.1, B.3, B.9 — открывает дверь к AI-агентам и 2-му клубу.
3. **AI Retention Agent** (3 дня) + **WhatsApp templates approval** (J.7) — quick win + база для остальных AI.

После этого — на остальные 8 AI-агентов система готова.

---

## Что делать с этим документом

1. **Сегодня** прочесть в полном объёме, отметить «согласен / не согласен / не понял».
2. **На уикенде** выбрать 5 пунктов в `NOW` для следующих 4 недель.
3. **Раз в месяц** проходим по нему, отмечаем что закрыто, что переоценили.
4. Этот файл живёт в `site/docs/19_FULL_AUDIT.md` — обновляется при каждой большой работе.

## Связанные документы

- [00_NORTH_STAR.md](00_NORTH_STAR.md) — стратегия (нужно заполнить)
- [05_BACKLOG.md](05_BACKLOG.md) — приоритизированный list для работы
- [09_DECISIONS.md](09_DECISIONS.md) — ADR-лог
- [14_CODE_REVIEW.md](14_CODE_REVIEW.md) — bi-monthly review
