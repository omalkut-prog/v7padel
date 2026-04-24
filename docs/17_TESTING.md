# 17 · Testing — как не сломать бизнес-логику коммитом

> **Статус**: живой документ. Обновлять при добавлении новых тестов или категорий тестов.
> Создан: 2026-04-24. Повод: первая версия `test_build_cache.py` нашла баг сразу же — `categorize_revenue("Top-up")` возвращал `"Прочее"` вместо `"Пополнение баланса"` → ~82k ₺/мес уходило в неправильную категорию.

## Зачем тесты

Аудит-скрипт (`audit_consistency.py`) ловит **расхождения между формулами** на реальных данных. Он запускается **после** ETL, **после** того как баг уже попал в кэш и отразился на dashboard.

Тесты (`test_*.py`) ловят **регрессии в логике** до того как они зальются — прямо на локалке/в pre-commit hook. Быстрее, дешевле, предотвращают баг до его появления в проде.

**Оба слоя дополняют друг друга, не заменяют.**

## Что покрыто

`etl/test_build_cache.py` — **64 теста** (на 2026-04-24):

| Группа | Что проверяется | Тестов |
|---|---|---|
| **SafeFloat** | парсинг чисел (запятые, пробелы, nbsp, мусор) | 9 |
| **ParseDate** | 6+ форматов дат, невалидные → None | 9 |
| **ParsePaidUntil** | `dd/mm/yyyy` → `date`, не `datetime` | 2 |
| **CategorizeRevenue** | все REV_CATEGORIES в правильном порядке | 17 |
| **GoodsCategory** | `_goods_category_from_sub`: mapping товаров | 9 |
| **RevWeekly** | group by week_start, dow alignment | 3 |
| **RevDowAvg** | avg по дням недели, n_days счёт | 2 |
| **RevMonthlyTx** | aggregates by month | 1 |
| **RevByMonthCat** | categorize_revenue применяется, cutoff работает | 2 |
| **GoodsByMonthCat** | включает Giftboxes (bug fix 2026-04-24) | 2 |
| **TodaySnapshot** | date filter, active-only, cancelled excluded | 3 |
| **CourtHoursByCourt** | aggregation, future excluded, cancelled excluded | 3 |
| **RevCategoriesOrder** | camp раньше training, equipment раньше group | 2 |

## Как запускать

```bash
cd etl
pytest                                   # все тесты (нужно -s флаг — см. ниже)
pytest test_build_cache.py::TestSafeFloat -v
pytest -k "category"                     # только тесты где "category" в имени
```

**Важно**: `pytest.ini` уже содержит `addopts = -v -s`. Флаг `-s` нужен потому что `build_cache.py` при импорте делает `sys.stdout = io.TextIOWrapper(...)` — это конфликтует с pytest capture. Без `-s` тесты не соберутся.

## Как добавить тест

### Шаблон для простой функции:

```python
class TestMyFunction:
    def test_happy_path(self):
        assert my_function("input") == "expected"

    def test_edge_case_empty(self):
        assert my_function("") == default_value

    def test_edge_case_none(self):
        assert my_function(None) is None
```

### Шаблон для aggregation-функции:

```python
class TestMyAggregation:
    def test_simple_sum(self):
        rows = [
            {"date": "2026-04-01", "amount": "100"},
            {"date": "2026-04-02", "amount": "200"},
        ]
        result = my_aggregate(rows)
        assert result == 300.0

    def test_filter_excludes_cancelled(self):
        rows = [{"status": "cancelled", "amount": "999"}]
        assert my_aggregate(rows) == 0
```

### Шаблон для regression test (когда исправил баг):

```python
def test_camp_not_swallowed_by_training(self):
    """Regression: до 2026-04-21 Camp попадал в Тренировки
    из-за порядка keys в REV_CATEGORIES. Bob Camp 140k был неправильно
    категоризован. Fix: camp key добавлен до training.
    """
    assert categorize_revenue("Camp and intensive event") == "Кэмпы/Интенсивы"
```

**Правило**: **каждый раз когда находишь баг и чинишь — пиши regression test**. Даже один тест на один баг — намного лучше чем ничего.

## Что не покрыто (TODO)

В порядке приоритета:

| # | Функция | Почему важно | Effort |
|---|---|---|---|
| 1 | `compute_opex_by_month_cat` | Сложная логика: capex flags, internal movements, cat_translate, fixed recurring | 30 мин |
| 2 | `compute_top_clients_revenue` | 8 аргументов, join по нескольким таблицам, сложные правила | 45 мин |
| 3 | `compute_clients_enriched` | Join customers × bookings × memberships, customer_ids CSV parsing | 30 мин |
| 4 | `merge_manual_entries` | dedup логика (ADR-015), auto-downgrade income→info | 30 мин |
| 5 | `compute_occupancy_planfact` | plan/fact alignment, cancellations merge | 45 мин |
| 6 | `compute_member_churn` | paid_until parsing + 4 buckets (expiring/expired/renewed/ok) | 20 мин |
| 7 | `sync_bookings_matchpoint.py` (parser) | HTML parsing устойчив к изменениям Matchpoint | 60 мин |
| 8 | `sync_cancellations_matchpoint.py` (parser) | Same | 45 мин |

Добавлять по 1-2 в каждое code-review (см. `docs/14_CODE_REVIEW.md`).

## CI/CD setup (backlog)

Пока запускается только локально. Следующий шаг:

1. **GitHub Actions** workflow `.github/workflows/tests.yml` — запуск `pytest` на каждый PR в `etl/`.
2. **Pre-commit hook** — не пропускать коммиты если тесты падают.
3. **Coverage tracking** — `pytest-cov` покажет что какие % кода покрыты.

Backlog пункт **K** (добавлю после одобрения).

## Философия

1. **Тест должен быть проще чем код, который тестирует.** Если тест сложный — значит код слишком сложный.
2. **Маленькие конкретные тесты лучше одного большого.** Один тест = одна причина failure.
3. **Regression test = документация бага.** Имя теста объясняет что было сломано и почему теперь работает.
4. **Не тестируй реализацию, тестируй поведение.** Если рефакторишь функцию — тесты не должны ломаться.
5. **Быстрота > Охват.** Если тест >1с — это уже долго. Вся suite должна проходить за <10с.

## Связанные документы

- [14_CODE_REVIEW.md](14_CODE_REVIEW.md) — bi-monthly code review, добавляет тесты в чек-лист
- [16_CONSISTENCY_AUDIT.md](16_CONSISTENCY_AUDIT.md) — runtime-консистентность после ETL
- [12_WORKING_WITH_CLAUDE.md](12_WORKING_WITH_CLAUDE.md) — принцип "когда нашли баг → пишем regression test"
