# 03 — ETL Playbook

*Папка*: `etl/`
*Планировщик*: Windows Task Scheduler, 06:00 ежедневно
*Точка входа*: `etl/run_all_etl.py`

## Каталог скриптов

### Sync (пишут в `v7padel_db`)

| Скрипт | Назначение | Частота | Источник |
|---|---|---|---|
| `sync_customers_matchpoint.py` | Справочник клиентов | Еженедельно (воскр. 06:00) | `ListadoClientes.aspx` |
| `enrich_customers.py` | Обогащение: телефон, email, категории | После sync_customers | `FichaCliente.aspx` |
| `sync_client_transactions.py` | Long-format все тикеты за 120 дней | Ежедневно | `ListadoTickets_Venta.aspx` |
| `sync_client_revenue.py` | Wide-format агрегат выручки | Ежедневно | `ListadoClientesMasGasto.aspx` |
| `sync_client_visits.py` | Визиты клиента | Ежедневно | (уточнить endpoint в скрипте) |
| `sync_client_categories.py` | Топ-категории клиента | Ежедневно | Matchpoint |
| `scrape_occupancy.py` | Загрузка кортов по дням | Ежедневно | `CuadroReservasNuevo` PageMethod |
| `scrape_debts.py` | Задолженности | Ежедневно | Matchpoint |

### Build (читают v7padel_db, пишут `v7padel_cache`)

| Скрипт | Назначение |
|---|---|
| `build_cache.py` | Агрегат для `clients.html` — `top_clients_revenue` с сегментами и activity_bucket |

### Probe / Audit (диагностика, не запускаются автоматом)

| Скрипт | Зачем |
|---|---|
| `probe_*.py` | Разведка эндпоинтов Matchpoint |
| `audit_*.py` | Аудит данных в sheets |
| `probe_service_prices.py` | Вытащить реальные цены услуг из `client_transactions` (для `10_PRICES_AND_HOURS.md`) |
| `audit_bucket.py` | Распределение activity_bucket в кэше |
| `audit_last_tx.py`/`2`/`3` | Разбор проблемы last_tx (исторический, сохранён для контекста) |

### Служебные

| Скрипт | Что делает |
|---|---|
| `etl.py` | Старый раннер Google Sheets (income/expenses) → `transactions`/`expenses`/`pnl_monthly` |
| `csv_to_sheets.py` | Перекладывает CSV → Sheets |
| `inspect_pnl.py`/`2` | Разбор структуры PnL (в т.ч. аренды 380 490 ₺ в 04.41) |
| `inspect_sheets.py` | Проверка схемы таблиц в v7padel_db |
| `explore_db.py` | Интерактивная разведка |
| `check_access.py` | Проверка прав service account |
| `fix_typo.py`/`.ipynb` | Исправление опечаток в именах клиентов |
| `install_*.ps1` | PowerShell-инсталлеры Task Scheduler |
| `create_cache_task.bat` | Батник установки задачи build_cache |

## Порядок запуска (run_all_etl.py)

```
1. sync_customers_matchpoint  (опц. — раз в неделю)
2. enrich_customers           (опц. — после customers)
3. sync_client_transactions   (обязательно)
4. sync_client_revenue        (обязательно)
5. sync_client_visits         (обязательно)
6. sync_client_categories     (обязательно)
7. scrape_occupancy           (обязательно)
8. scrape_debts               (обязательно)
9. build_cache                (в КОНЦЕ — читает всё выше)
10. generate_state_doc        (после build_cache — обновляет 04_CURRENT_STATE.md)
```

Шаг 10 появляется по плану — см. `05_BACKLOG.md`.

## Режимы запуска

Каждый sync-скрипт поддерживает:
- `python etl/sync_X.py` — **dry-run** по умолчанию. Покажет что бы записало, но не пишет.
- `python etl/sync_X.py --write` — реально пишет в Sheets.

Это критично для безопасных экспериментов.

## Окружение

- Python 3.12 (Windows)
- Зависимости: `gspread`, `beautifulsoup4`, `requests`, `google-auth`, `google-api-python-client`
- Service account key: `etl/sa.json` — **НЕ коммитить**. Права на `v7padel_db` + `v7padel_cache` + `drive.readonly`.
- Matchpoint creds: `etl/matchpoint_creds.json` — **НЕ коммитить**.
- Логи: `etl/logs/*.log`

## Как добавить новое поле в `client_revenue`

1. Добавить поле в `build_cache.py`: в row-dict, в headers, в write-block.
2. Прогнать: `python etl/build_cache.py` (dry-run).
3. Проверить: `python etl/audit_bucket.py` или новый audit-скрипт.
4. Прогнать с `--write`.
5. Обновить `01_ARCHITECTURE.md` (раздел `client_revenue` поля).
6. Обновить `clients.html` / `recall.html` если поле нужно в UI. Бампнуть кэш-бустер `?v=k(N+1)`.

## Как добавить новый ETL-источник

1. Создать `etl/sync_X.py` — взять шаблон из `sync_client_transactions.py`.
2. Использовать `mp_login()` из `sync_customers_matchpoint`.
3. Поддержать `--dry-run` / `--write`.
4. Добавить в `run_all_etl.py`.
5. Документировать эндпоинт в `02_MATCHPOINT_API.md`.
6. Документировать таблицу в `01_ARCHITECTURE.md`.
7. Обновить `03_ETL_PLAYBOOK.md` (этот файл — каталог).

## Типичные проблемы

### UnicodeEncodeError при запуске (Windows)
Windows Python печатает в cp1252 по умолчанию. Решение:
```python
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
```
Либо `chcp 65001` в консоли, либо `set PYTHONIOENCODING=utf-8`.

### Matchpoint 500 / timeout
- Рост rate limit (увеличить паузу между запросами до 300–500 мс)
- Проверить `session.verify = False`
- Проверить что ViewState не потерян между страницами

### Gspread quota
Google Sheets API: 60 запросов/мин на service account. Если пишем построчно — упадём. Использовать `ws.update(range_name='A1', values=rows)` одним запросом.

### Пустой customer_id в транзакции
В `rows_to_records` cid → `'0'` если пустой (анонимная продажа). Нормально для тикетов бара без привязки.
