# 16 · Consistency Audit — автоматический ловец расхождений

> **Статус**: живой документ. Обновлять при добавлении новых проверок.
> Создан: 2026-04-24. Повод: нашли 2 бага в формулах кэша (live_month vs weekly, goods_narrow vs categorized).

## TL;DR

`etl/audit_consistency.py` — скрипт который считает **одну и ту же метрику разными способами** из разных функций/таблиц, и падает (exit 1) если результаты не совпадают. Запускается последним шагом в `run_all_etl.py`.

Идея: **любое несовпадение — это баг в одной из формул**. Алгоритм ловит:
- UTC/local таймзоны (как фикс 2026-04-24).
- Разные фильтры в похожих функциях (live vs weekly, narrow vs categorized).
- Забытые категории в REV_CATEGORIES.
- Потерянные поля при ETL.
- Регрессии когда кто-то меняет одну функцию, забывая синхронизировать другую.

## Запуск

### Локально (руками)
```bash
cd C:\Users\volod\v7padel\etl
python audit_consistency.py              # полный вывод
python audit_consistency.py --quiet      # только FAIL/WARN
python audit_consistency.py --json       # для автоматизации
```

### В cron
Последний шаг в `run_all_etl.py` после `build_cache` + `generate_state_doc`. Запускается с `--quiet`, лог пишется в общий `master_YYYY-MM-DD.log`. Если `FAIL` — exit code 1, cron статус = FAILED, уведомление в Task Scheduler.

## Что такое FAIL vs WARN

| Severity | Когда | Поведение |
|---|---|---|
| **FAIL** | Инвариант жёсткий, расхождение = баг | exit 1, остановка cron, уведомление |
| **WARN** | Расхождение возможно (e.g. Giftboxes в Товары) | exit 0, но печатается в логе |

## Текущие проверки (по состоянию на 2026-04-24)

### Revenue consistency (FAIL)

```python
assert compute_live_month.revenue == compute_rev_weekly_income + compute_rev_weekly_goods
```

**Нашли при создании**: `compute_live_month` суммировал все `tx.total` без фильтра, а `rev_weekly_*` пропускал `categorize_revenue == None` (e.g. "Depositing money"). Расхождение 500 ₺/мес.

### Goods consistency (WARN)

```python
# narrow: фильтр category == "sale of goods"
# categorized: categorize_revenue == "Товары"
assert goods_narrow == goods_categorized  # WARN — diff = Giftboxes/Inventory/Accessor
```

**Нашли при создании**: старая `compute_goods_by_month_cat` использовала узкий фильтр → теряла Giftboxes 1 200 ₺/мес. Фикс — перешли на `categorize_revenue`.

### Hours consistency (WARN)

```python
assert booking_hours_active_month(bk, ym) <= occupancy_hours_month(oc, ym)
```

bookings (только active) **должно** быть ≤ occupancy (считает всё, включая cancellations). Если bookings > occupancy — источники рассинхрон.

**Текущий статус**: WARN на март/апрель. bookings 890 ч vs occupancy 722 ч. Причина неясна — возможно двойной подсчёт длительности (overlapping?) или occupancy недосчитано. **TODO разобрать.**

### Bookings status (WARN)

```python
assert bookings.status ⊆ {"Active", ""}
```

В bookings не должно быть `cancelled` (они в отдельной таблице `cancellations`).

**Текущий статус**: WARN. В bookings есть `cancelled` строки. **Видимо старый sync оставил следы. Нужен cleanup.**

### Sanity

- `customers.total > 0` (FAIL) — ETL сломан если пусто.
- `transactions.month` populated (FAIL) — иначе monthly агрегаты сломаются.

## Как добавить новую проверку

Открыть `etl/audit_consistency.py`, секцию `run_checks(data)`.

### Вариант 1: сравнение двух чисел с tolerance

```python
def m_my_metric_style_a(data, ym):
    return ...  # способ 1

def m_my_metric_style_b(data, ym):
    return ...  # способ 2

# в run_checks:
results.append(_compare(
    f"my_metric_{ym}: style_a == style_b",
    m_my_metric_style_a(data, ym),
    m_my_metric_style_b(data, ym),
    tolerance_abs=1.0,      # или tolerance_pct=0.5
    severity="FAIL",        # или WARN
    note="Объяснение что сравниваем и почему"
))
```

### Вариант 2: булевый инвариант

```python
ok = some_condition()
results.append({
    "name": "my invariant",
    "a": actual_value,
    "b": expected_value,
    "pass": ok,
    "severity": "FAIL",
    "note": "Что означает провал",
})
```

## Идеи для следующих проверок (backlog)

| # | Проверка | Severity | Почему |
|---|---|---|---|
| 1 | `dashboard_kpi.revenue_30d` == sum(tx last 30d categorized) | FAIL | Ловит рассинхрон dashboard_kpis vs transactions |
| 2 | `rev_by_month_cat` row sum == `rev_monthly_tx` total | FAIL | Проверка полноты категоризации |
| 3 | `∑ opex_by_month_cat` == `∑ expenses where !capex` | FAIL | Проверка фильтров OPEX |
| 4 | `rpch_lm` == `pnl_data[last_ym].revenue / occupancy[last_ym].hours` | FAIL | Regression guard на ADR-018 |
| 5 | `∑ kpis_per_court.revenue` == `pnl_data[last_ym].revenue` | FAIL | Per-court decomposition consistency |
| 6 | `bookings.court_id ⊆ {P1,P2,P3,P4}` | WARN | Notify если появился новый корт |
| 7 | `occupancy_daily.days_count ≥ 28 для любого прошлого месяца` | WARN | Ловит пропуски в occupancy scraping |
| 8 | `cancellation_rate_month ∈ [5%, 50%]` | WARN | Аномалии в scraping cancellations |
| 9 | `customers.subs_date < today` для всех | FAIL | Future-dated регистрации = баг parse |
| 10 | `pnl_data.revenue > 0` для каждого live месяца | WARN | Катастрофа если 0 |

Добавить всё сразу **не нужно** — по 1-2 проверки за ревью, проверять что не flaky (не даёт false FAIL из-за легитимных изменений данных).

## Как это работает с другого компа

`audit_consistency.py` лежит в `etl/` — это локальный ETL pipeline (не в git). Чтобы воспроизвести на другом компе:

1. Склонировать `v7padel-etl` (приватный репо на GitHub) или скопировать папку `etl/` + `sa.json`.
2. `pip install gspread google-auth` (уже в requirements.txt).
3. `python etl/audit_consistency.py` — работает сразу.

Если хочется подключить к cron на том компе — добавить шаг в `run_all_etl.py` (уже есть) или запускать отдельно после основного cron.

## Когда обновлять этот файл

- Добавил новую проверку → написать описание в секцию «Текущие проверки».
- Проверка стала flaky (false FAIL) → понизить до WARN + документировать почему.
- Нашли новый класс расхождений → добавить в backlog (снизу).

## Связанные документы

- [09_DECISIONS.md](09_DECISIONS.md) — ADR-015 (dedup), ADR-016 (cash-basis), ADR-018 (per-court).
- [13_ACCOUNTING_RULES.md](13_ACCOUNTING_RULES.md) — правила учёта которые проверяем.
- [14_CODE_REVIEW.md](14_CODE_REVIEW.md) — как этот audit встроен в bi-monthly ревью.
- [15_FINANCE_RECONCILIATION.md](15_FINANCE_RECONCILIATION.md) — сверка с ручным финучётом (другой класс checks).
