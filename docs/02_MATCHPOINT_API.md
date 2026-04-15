# 02 — Matchpoint API

*Base URL*: `https://app-v7padel-tur.matchpoint.com.es`
*Stack*: ASP.NET WebForms (классика, ViewState-based)
*Credentials*: `etl/matchpoint_creds.json` — `{"username": "...", "password": "..."}`
*Reference mp_login*: `etl/sync_customers_matchpoint.py`

## Правила работы с ASP.NET

Это не REST. Это WebForms. Значит:

1. **ViewState обязателен.** Каждый POST требует `__VIEWSTATE`, `__VIEWSTATEGENERATOR`, `__EVENTVALIDATION` из предыдущего ответа. Терять VIEWSTATE = терять сессию страницы.
2. **Postback pattern.** Кнопки/пагинация работают через `__EVENTTARGET` + `__EVENTARGUMENT`. Не через URL-параметры.
3. **Cookies сессии** устанавливаются логином. `requests.Session()` их несёт автоматически.
4. **`session.verify = False`** — сертификат кривой. `urllib3.disable_warnings()`.
5. **Rate limit**: ~150–300 мс между запросами. Иначе периодические 500-ки.
6. **Encoding**: `response.encoding = 'utf-8'`. Иначе ломается кириллица/турецкий.
7. **Grid redirects**: `/Reservas/CuadroReservas.aspx` → `CuadroReservasNuevo.aspx`. `allow_redirects=True` + использовать `r.url` как action.

## Аутентификация (2 шага)

1. `GET /Login.aspx` → достать `__VIEWSTATE`, `__VIEWSTATEGENERATOR`, `__EVENTVALIDATION`
2. `POST /Login.aspx`:
   - `username`, `password`
   - `ddlLenguaje=en-GB`
   - `__EVENTTARGET=btnLogin`
3. Если в ответе есть `btnAcceder` → нужен выбор кассы:
   - `POST` с `DropDownListCajas=1`, `__EVENTTARGET=btnAcceder`

`mp_login()` инкапсулирует это всё.

## Эндпоинты — полный каталог

### Клиенты

#### `GET/POST /Clientes/ListadoClientes.aspx`
HTML-таблица клиентов. Page size до 500 стабильно (1000 → ошибки сервера).
Используется: `sync_customers_matchpoint.py`.

#### `POST /Administracion/Clientes/ListaClientes.aspx/ObtenerClientes`
JSON-эндпоинт (PageMethod). Альтернатива.

#### `GET /Clientes/FichaCliente.aspx?id={customer_id}`
Карточка клиента: телефон, email, категории, баланс. Используется `enrich_customers.py`.

### Финансы

#### `GET/POST /Facturacion/ListadoTickets_Venta.aspx`
**Тикеты продаж (все транзакции кроме saldo/bono).** HTML-таблица с пагинацией.

Фильтры:
- `ctl01$ctl00$CC$ContentPlaceHolderFiltros$TextBoxFechaInicio` — дата от (`DD/MM/YYYY`)
- `ctl01$ctl00$CC$ContentPlaceHolderFiltros$TextBoxFechaFinBusqueda` — дата до
- Применение фильтра: `__EVENTTARGET=ctl01$ctl00$CC$ContentPlaceHolderAcciones$LinkButtonRecargar`

Пагинация:
- `__EVENTTARGET=ctl01$ctl00$CC$ContentPlaceHolderListado$GridViewListado`
- `__EVENTARGUMENT=Page$N`

Колонки: `Number | Issuer | Date | P. Date | P. Method | Cod. | Tax ID | Client | Description | Tax Base | VAT | Total | Paid | Cancel`

⚠️ **Подводные камни**:
- В таблицу попадают мусорные строки пагинации (первая ячейка `...` или цифра). **Регекс тикета**: `^[A-Z]\d{2}-\d+$` (например `A26-03777`). Любая строка не прошедшая регекс — отбрасывается.
- Колонки `Paid`/`Cancel` парсятся криво — `is_paid`/`is_cancel` в нашей таблице всегда 0. Известный баг, см. `07_ANTI_PATTERNS.md`.

Используется: `sync_client_transactions.py`.

#### `GET/POST /Facturacion/ListadoMovimientosSaldo.aspx`
**Движения по saldo-балансам** клиентов. Отдельный источник выручки. **Не скрейпится сейчас**, только прозондировано (`probe_saldo.py`). При необходимости точного revenue per client — добавить в ETL.

#### `GET/POST /Facturacion/ListadoClientes_Bonos_Movimientos.aspx`
**Движения по bono-пакетам** (абонементы, пакеты тренировок — списание сессий). **Не скрейпится сейчас.**

#### `GET/POST /Facturacion/ListadoClientesMasGasto.aspx`
**Агрегат** по клиентам: суммарные траты. Объединяет все три источника выше. Используется `sync_client_revenue.py`.

Три источника выручки в Matchpoint → это причина, почему «последний платёж» по тикетам был неточным → перешли на `activity_bucket` из агрегата. См. `09_DECISIONS.md` #002.

### Загрузка кортов

#### `POST /Reservas/CuadroReservasNuevo.aspx/ObtenerEstadisticasOcupacion`
JSON PageMethod. Нужно сначала посетить grid-страницу `/Reservas/CuadroReservas.aspx?id_cuadro=3` (устанавливает серверный контекст).

Request:
```json
{"idCuadro": "3", "fecha": "DD/MM/YYYY"}
```
Headers: `Content-Type: application/json; charset=utf-8`

Response (внутри `{"d": {...}}`):
| Поле | Тип | Описание |
|---|---|---|
| HorasOcupadas | float | Занятые часы за день |
| PorcentajeOcupacion | float | % загрузки |
| NumeroPersonas | int | Количество человек |
| Pie | array | `[{category, value}]` — разбивка по типам |
| GraficoOcupacion | array | Почасовой % |
| ReservasCantidadRealizada{Administracion,Web,Movil} | int | Букинги по каналам |

**idCuadro=3** = PADEL grid.

**Маппинг Pie-категорий на наши 3 бизнес-категории** (в `scrape_occupancy.py`):

| Dashboard | API |
|---|---|
| **Бронирования** | `reserva` + `partida` (обычные букинги + опен-игры) |
| **Тренировки** | `clases` |
| **Турниры** | `actividades` + `centro` |
| *исключено* | `mantenimiento` (вычитаем из hours) |

`hours = HorasOcupadas - mantenimiento`.

### Бронирования

#### `GET/POST /Reservas/ListadoReservas.aspx`
HTML-таблица бронирований. Использует `scrape_debts.py`, bookings ETL (если есть).
⚠️ `customer_id` в наших `bookings` часто пустой — надо чинить парсинг.

### Долги

#### `GET /Facturacion/ListadoDeudas.aspx` (примерно)
Задолженности. `scrape_debts.py`.

## Helpers

`etl/sync_customers_matchpoint.py` экспортирует:
- `mp_login()` → `requests.Session`
- `MP_BASE`, `SA_PATH`, `DB_ID`
- `get_asp_fields(soup)` → `{__VIEWSTATE, __VIEWSTATEGENERATOR, __EVENTVALIDATION}`
- `get_all_form_fields(soup)` → все поля формы (для postback)

Все остальные ETL-скрипты импортируют из него.

## Что ещё НЕ задокументировано (TODO)

- Полный список эндпоинтов управления услугами и ценами (прайс-лист внутри Matchpoint)
- Эндпоинт создания/редактирования клиента
- Эндпоинт создания тикета (если вообще доступен)
- Эндпоинт создания бронирования

При первом использовании — документировать здесь же в тот же PR.
