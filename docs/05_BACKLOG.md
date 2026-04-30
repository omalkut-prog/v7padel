# 05 — Backlog

*Last updated: 2026-04-30*
*Пересматривается: воскресенье 18:00 (Володимир + ИИ)*

## Контекст: переход на AI-driven сетевую модель

С 2026-04-30 backlog **перестроен** под org-structure из `v7_org_structure.html`:

- **3-уровневая модель**: CEO → V7 Group (global УК) → V7 Турция (региональная УК) → Клубы
- **AI Layer** = 8 cross-cutting агентов которые масштабируются на всю сеть
- Стратегический фокус смещается с «допилить 1 клуб» на «построить инфраструктуру под сеть»
- Backend + Auth + multi-tenant **становятся блокером** для AI-агентов и 2-го клуба

## Правила

- **Max 5 в `NOW`**. Шестой пункт не попадает пока пятый не закрыт.
- Каждый пункт: **Impact on NS · Effort · Owner**. Без этого — не в `NOW`.
- `LATER` без ограничений, но кандидаты на выбрасывание при следующем ревью.
- `PARKING LOT` — идеи без решения делать.

---

## NOW (5 max) — Foundation для AI-сети

### 1. Backend + Auth — multi-tenant фундамент

- **Impact on NS**: критический. Без backend нельзя:
  - Подключить AI-агентов к данным безопасно (сейчас Sheets публичны)
  - Изолировать данные между клубами (Anталия 1 vs 2 vs Харьков)
  - Сделать proper auth (вместо хардкод-паролей в `login.html`)
- **Стек**: FastAPI + Postgres (Supabase) + Google OAuth + JWT с `club_id` claim
- **Что включает**:
  1. Postgres schema с `club_id` во всех таблицах
  2. Миграция текущих Sheets → Postgres (one-time + 2-3 нед параллельной работы для сверки)
  3. API endpoints с RLS (Row-Level Security) — каждый запрос видит только свой `club_id`
  4. Google OAuth + JWT — заменить `login.html` хардкод
  5. AI-агенты подключаются через service-account с full-network read-only
- **Effort**: 5-7 дней Claude (полный sprint) + 1 день твой (UI/UX обзоры) = 1 неделя
- **Owner**: Claude (back) + Володимир (приоритеты доменной модели)
- **Стоимость infra**: Supabase Pro $25/мес + Fly.io $5/мес = $30/мес
- **Блокирует**: M1-M8 AI агенты, 2-й клуб

### 2. AI Agent #1 — **Retention Agent** (первый production AI)

- **Impact on NS**: высокий. У нас есть at_risk + membership_candidates списки — превратить их в действия.
- **MVP**: Python скрипт на cron, читает at_risk_top + membership_candidates, отправляет:
  - **WhatsApp персонализированные сообщения** через WhatsApp Business API (Meta Cloud)
  - 1 раз в неделю (вторник 14:00) для каждого сегмента
  - Шаблоны: «Не были у нас 2 недели — можем зарезервировать корт?», «Видим вы много играете — рассмотрите Club card»
- **Без backend** работает на скриптах + Sheets (для MVP)
- **Effort**: 2 дня Claude + 1 день настроек WhatsApp Business
- **Зависимости**: WhatsApp Business аккаунт (есть у Эрдема), template approval (1-2 дня Meta)
- **Метрика успеха**: % восстановленных клиентов, retention LTV+30d
- **Owner**: Claude + Эрдем (templates approval) + Настя VIP (review messages)

### 3. ETL на GitHub Actions (надёжность 100%)

- **Контекст**: cron на ноутбуке Володимира — single point of failure. AI-агенты требуют 100% uptime данных.
- **Локально готово** (не запушено): `/c/Users/volod/v7padel-etl/` с workflow.
- **Что осталось** (10 мин действий пользователя):
  1. Создать приватный репо `omalkut-prog/v7padel-etl`
  2. Personal Access Token для cross-repo push
  3. 3 GitHub Secrets: `SA_JSON`, `MP_CREDS`, `PUBLIC_REPO_PAT`
  4. Claude: `git push` + manual workflow run для теста
- **Impact on NS**: высокий — без этого нельзя ехать на 2 недели спокойно
- **Effort**: 30 мин

### 4. Заполнить `00_NORTH_STAR.md`

- **Impact on NS**: высокий. Без чисел Q3 (после результатов мая) приоритизация — догадки.
- **Effort**: 1.5-2 ч (Володимир выписывает) + 30 мин (Claude форматирует)
- **Owner**: Володимир + Claude
- **Что заполнить**: топ-3 цели Q3 (после результатов мая), KPI цели (загрузка, MRR, retention, ATV).
- **Когда**: после 31 мая — будут точные числа потолка команды.

### 5. Fix `bookings` старые `cancelled` записи

- **Impact on NS**: низкий, но мешает audit_consistency
- Из audit warning: «bookings содержит status=cancelled — должны быть в cancellations таблице»
- **Effort**: 30 мин — single sync скрипт перевести
- **Owner**: Claude

---

## NEXT (10 max)

### M2-M8. Остальные AI Agents (после M1 + backend)

Всего 7 агентов после Retention. Каждый — отдельный pull request, ~2-3 дня работы.

| ID | Агент | Что делает | Кому помогает | Effort |
|---|---|---|---|---|
| **M2** | **Customer Support** | 24/7 WhatsApp/Telegram бот: бронирования, FAQ, расписание | Админы (разгрузка) | 3-4 дня |
| **M3** | **Marketing Agent** | Генерирует контент, посты, captions из брэнд-гайдов | CMO + Эрдем | 2-3 дня |
| **M4** | **Sales / Outreach** | Холодные касания корп. клиентам, follow-up | будущий Sales/CS Lead | 3 дня |
| **M5** | **Brand / Design** | Креативы, баннеры, видео-сториз через AI gen | CMO | 2 дня |
| **M6** | **Coach-Ops Assistant** | Расписание тренеров, списки клиентов, конфликты | Настя Одесса | 2-3 дня |
| **M7** | **Finance Ops** | Auto-сверка PnL, fixed_opex, аномалии в Sheets | CFO Саша | 3 дня |
| **M8** | **Analytics Agent (Claude)** | Уже работает (этот ассистент) — нужна формализация в SOP | CEO + CFO | 1 день |

**Архитектура**: каждый агент — Python service на Fly.io, читает данные через backend API (post Foundation #1), пишет результаты в Postgres. Coordinator pattern: master-агент распределяет задачи, специализированные исполняют.

### N1. 2-й клуб Анталья (А2) — операционная подготовка

- Поиск площадки (Володимир, не я)
- Шаблон команды копируем с А1 (Daша → Manager А2, и т.д.)
- Onboarding playbook через `docs/`
- **Когда**: после Foundation (#1 NOW) — multi-tenant ready

### N2. Харьков (UA) — план

- Автономная команда (Group делит CEO/CFO/CMO/COS)
- Отдельный SMM (UA), Lawyer + Accountant UA
- **Когда**: 6+ месяцев после А2

### N3. Раздел маркетинга (`11_MARKETING.md`)

- Аватар клиента (primary/secondary), каналы, месседжинг, контент-стратегия
- **Зависимость**: AI Marketing Agent (M3) использует это как brand-guidelines
- **Effort**: 2-4 ч совместной работы

### N4. Tournament analytics: реальная логика

- Метрики: fill rate, ROI турнира, LTV участников после, win-rate, ср. ставка
- Под Camp/Intensive analytics
- **Effort**: 1 день

### N5. Mobile UI

- Сайт desktop-first. Команда смотрит с телефонов
- На /dashboard, /revenue, /clients responsive нужен fix
- **Effort**: 2 дня

### N6. Тесты + CI/CD (расширение)

- Сейчас 64 pytest теста локально. После backend — нужны API тесты.
- GitHub Actions `.github/workflows/tests.yml`
- pytest-cov для coverage

### N7. Telegram bot для recall

- Альтернатива WhatsApp. Если WhatsApp Business approval затянется
- Можно начать как fallback для M1

### N8. Инкрементальный ETL (8 → 2.5 мин)

- 3 фикса: Racket.ID weekly, frozen build_cache, incremental bookings
- **Приоритет упал**: с переходом на GitHub Actions (NOW #3) — это вторично

### N9. Fraud-detect

- Дубль бронирований, abnormal cancels, suspicious refunds
- Алёрты CFO + Manager

### N10. Customer portal на нашем бренде

- Замена Matchpoint customer-side: бронирование, оплаты, история
- **Effort**: огромный (1-2 месяца)
- **Когда**: после 3+ клубов сети

---

## LATER

- **Snapshot-tracking отмен → cid** (для ТОП клиентов по отменам). Расширить sync_bookings_matchpoint
- AI-предсказание churn risk (фича бы по activity_bucket + segment + visit frequency)
- Автоматическая классификация description → service_type
- Интеграция с Google Calendar (тренерские слоты)
- Push-уведомления клиентам (через Matchpoint API если откроют)
- Экспорт CSV/Excel со всех страниц
- Фильтры в clients.html (bucket × segment × visits)
- Dashboard для тренера (его ученики, прогресс, сессии)
- Решение по `manager-*.html` (4 заглушки) — наполнить или удалить
- Рефакторинг `revenue.html` (179KB → разбить на helpers)
- Проверить `intensive.html` (2МБ — почему такой)
- `scrape_debts.py` в cron или удалить
- Редизайн навигации (15+ пунктов в сайдбаре)
- Миграция: брандбук в `11_MARKETING.md`
- ETL для saldo и bono движений

---

## PARKING LOT (идеи без решения делать)

- Программа рефералов (без скидок — подарки?)
- NFC-карточки вход
- Своё приложение V7 (Matchpoint покрывает)
- Мерч онлайн
- Реанимация Racket.ID интеграции

---

## Done / Archive (что сделано — для истории)

### 2026-04-30
- ✅ **#5 (старого backlog) Fix `is_paid` / `is_cancel`** — был всегда 0, парсинг checkbox в HTML, теперь 97% paid 3% cancel реальные
- ✅ **#4 (старого backlog) brain.html → markdown reader** — single source of truth `site/docs/`, удалены legacy `V7_Padel_Brain.md` + `knowledge.html`

### 2026-04-25
- ✅ Memberships block переписан с нуля — независимый IIFE, читает `memberships` напрямую
- ✅ may-goal.html: 3 категории (Тренировки/Турниры/Брони) + графика по дням + 4 языка (EN/RU/UA/TR)

### 2026-04-24
- ✅ pytest suite (64 теста) — нашли баг Top-up
- ✅ docs/16_CONSISTENCY_AUDIT.md + audit_consistency.py
- ✅ docs/15_FINANCE_RECONCILIATION.md
- ✅ Cache buster + dashboard блоки независимые

### 2026-04-22
- ✅ docs/14_CODE_REVIEW.md + первый bi-monthly review
- ✅ docs/13_ACCOUNTING_RULES.md (cash-basis + dedup ADR-015,016)
- ✅ ADR-017 cancellation tracking + ADR-018 per-court KPI
- ✅ Solo-toggle на legend в Chart.js

### 2026-04-16
- ✅ **#1 (старого backlog) Fix `bookings.customer_id`** — Phase D `sync_bookings_matchpoint.py` с tooltip API, 100% покрытие на reserva_individual/partida/clase_suelta
- ✅ Топ клиентов по выручке `clients.html`
- ✅ `sync_memberships_matchpoint.py` в `run_all_etl.py`
- ✅ club-members.html
- ✅ Lite refresh button
- ✅ Авто-генератор `04_CURRENT_STATE.md`

### 2026-04-14/15
- ✅ Миграция `last_tx` → `activity_bucket`
- ✅ Фикс garbage pagination в `sync_client_transactions.py`
- ✅ Страница `recall.html`
- ✅ Реальные цены → `10_PRICES_AND_HOURS.md`
- ✅ Реструктуризация базы знаний в `docs/`
