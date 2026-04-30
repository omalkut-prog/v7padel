"""
Matchpoint API Explorer
Досліджує доступні ендпоінти для отримання даних по тренуваннях/заняттях.
"""

import requests
import json
import re
import time
import urllib3
from bs4 import BeautifulSoup
from datetime import datetime

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BASE_URL = "https://app-v7padel-tur.matchpoint.com.es"
DELAY = 0.15  # 150ms між запитами
RESULTS_FILE = "etl/api_results.txt"

CREDS = {
    "username": "Club",
    "password": "v7padelclub2025new",
}

PAGES_TO_EXPLORE = [
    "/Clases/ListaClases.aspx",
    "/Profesores/ListaProfesores.aspx",
    "/Reservas/ListaReservas.aspx",
    "/Actividades/ListaActividades.aspx",
    "/Administracion/Reservas/ListaReservas.aspx",
    "/Reservas/CuadroReservas.aspx?id_cuadro=3",
    "/Reservas/CuadroReservasNuevo.aspx",
]

POST_ENDPOINTS = [
    "/Clases/ListaClases.aspx/ObtenerClases",
    "/Clases/ListaClases.aspx/GetClases",
    "/Clases/ListaClases.aspx/CargarClases",
    "/Profesores/ListaProfesores.aspx/ObtenerProfesores",
    "/Profesores/ListaProfesores.aspx/GetProfesores",
    "/Reservas/ListaReservas.aspx/ObtenerReservas",
    "/Reservas/ListaReservas.aspx/GetReservas",
    "/Actividades/ListaActividades.aspx/ObtenerActividades",
    "/Actividades/ListaActividades.aspx/GetActividades",
    "/Administracion/Reservas/ListaReservas.aspx/ObtenerReservas",
]

POST_BODIES = [
    {"fechaInicio": "01/04/2026", "fechaFin": "30/04/2026"},
    {"fecha": "01/04/2026", "idProfesor": ""},
    {"fechaInicio": "01/04/2026", "fechaFin": "30/04/2026", "idProfesor": ""},
]


def log(msg, file=None):
    print(msg)
    if file:
        file.write(msg + "\n")


def mp_login(session):
    """Двокроковий логін у Matchpoint."""
    login_url = f"{BASE_URL}/Login.aspx"
    print(f"[LOGIN] GET {login_url}")

    r = session.get(login_url, verify=False, timeout=30)
    print(f"[LOGIN] GET status: {r.status_code}")

    soup = BeautifulSoup(r.text, "html.parser")

    # Визначаємо URL для POST з action форми
    form = soup.find("form")
    if form and form.get("action"):
        action = form["action"]
        if action.startswith("http"):
            post_url = action
        elif action.startswith("/"):
            post_url = f"{BASE_URL}{action}"
        else:
            post_url = f"{BASE_URL}/{action}"
    else:
        post_url = login_url
    print(f"[LOGIN] Form action POST URL: {post_url}")

    # Витягуємо ВСІ приховані поля форми (ViewState, EventValidation тощо)
    form_data = {}
    for inp in soup.find_all("input"):
        name = inp.get("name", "")
        value = inp.get("value", "")
        inp_type = inp.get("type", "text").lower()
        # Включаємо всі поля крім checkbox (щоб не перезаписати)
        if name and inp_type != "checkbox":
            form_data[name] = value

    # Встановлюємо поля логіну
    form_data["username"] = CREDS["username"]
    form_data["password"] = CREDS["password"]

    # __doPostBack('btnLogin','') — стандартний ASP.NET WebForms механізм
    form_data["__EVENTTARGET"] = "btnLogin"
    form_data["__EVENTARGUMENT"] = ""
    # Прибираємо btnLogin як окреме поле (воно type=button, не submit)
    form_data.pop("btnLogin", None)

    print(f"[LOGIN] Поля форми: {[k for k in form_data if not k.startswith('__')]}")
    print(f"[LOGIN] POST {post_url}")

    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": login_url,
        "Origin": BASE_URL,
    }

    r2 = session.post(post_url, data=form_data, verify=False, timeout=30,
                      headers=headers, allow_redirects=True)
    print(f"[LOGIN] POST status: {r2.status_code}, URL: {r2.url}")

    # Крок 2: вибір каси (btnAcceder + DropDownListCajas)
    soup2 = BeautifulSoup(r2.text, "html.parser")

    # Перевіряємо HiddenFieldLoggedIn — якщо true, то крок 2 потрібен
    hidden_logged = soup2.find("input", {"name": "HiddenFieldLoggedIn"})
    is_logged = hidden_logged and hidden_logged.get("value") == "true"

    cashier_btn = soup2.find("input", {"name": re.compile(r"btnAcceder|btnCaja|btnOK|btnEntrar", re.I)})

    if cashier_btn and is_logged:
        btn_name = cashier_btn.get("name", "btnAcceder")
        print(f"[LOGIN] Крок 2 — вибір каси: {btn_name!r}")

        form_data2 = {}
        for inp in soup2.find_all("input"):
            name = inp.get("name", "")
            value = inp.get("value", "")
            if name and inp.get("type", "").lower() != "checkbox":
                form_data2[name] = value

        # Додаємо select dropdown (вибір каси — перша опція)
        for sel in soup2.find_all("select"):
            sel_name = sel.get("name")
            if sel_name:
                first_opt = sel.find("option")
                form_data2[sel_name] = first_opt["value"] if first_opt else "1"
                print(f"[LOGIN] Каса: {sel_name}={form_data2[sel_name]!r}")

        # __doPostBack для btnAcceder
        form_data2["__EVENTTARGET"] = btn_name
        form_data2["__EVENTARGUMENT"] = ""
        form_data2[btn_name] = cashier_btn.get("value", "Acceder")

        r3 = session.post(r2.url, data=form_data2, verify=False, timeout=30,
                          headers={"Content-Type": "application/x-www-form-urlencoded",
                                   "Referer": r2.url, "Origin": BASE_URL},
                          allow_redirects=True)
        print(f"[LOGIN] Крок 2 status: {r3.status_code}, URL: {r3.url}")
        return r3
    else:
        print("[LOGIN] Кроку з касою немає або вже залогінились")
        return r2


def find_page_methods(html, url):
    """Знаходить виклики PageMethods та doPostBack у HTML."""
    methods = []

    # PageMethods.НазваМетоду(
    pm_matches = re.findall(r'PageMethods\.(\w+)\s*\(', html)
    for m in set(pm_matches):
        methods.append(f"PageMethods.{m}")

    # __doPostBack
    dpb_matches = re.findall(r'__doPostBack\s*\(\s*[\'"]([^\'"]+)[\'"]', html)
    for m in set(dpb_matches):
        methods.append(f"__doPostBack('{m}')")

    # WebService або ScriptManager endpoints
    ws_matches = re.findall(r'[\'"](/[^\'"]+\.aspx/\w+)[\'"]', html)
    for m in set(ws_matches):
        methods.append(f"WebMethod: {m}")

    # UpdatePanel та AsyncPostBack targets
    ap_matches = re.findall(r'Sys\.Net\.WebServiceProxy\.invoke\s*\(\s*[\'"]([^\'"]+)[\'"]', html)
    for m in set(ap_matches):
        methods.append(f"WebServiceProxy: {m}")

    return methods


def try_post(session, endpoint, body):
    """Пробує POST запит до ендпоінту."""
    url = f"{BASE_URL}{endpoint}"
    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
    }
    try:
        r = session.post(url, json=body, headers=headers,
                         verify=False, timeout=30)
        return r.status_code, r.text
    except Exception as e:
        return None, str(e)


def explore_page(session, path, results_file):
    """Досліджує одну сторінку."""
    url = f"{BASE_URL}{path}"
    log(f"\n{'='*60}", results_file)
    log(f"GET {url}", results_file)

    try:
        r = session.get(url, verify=False, timeout=30)
    except Exception as e:
        log(f"  ПОМИЛКА: {e}", results_file)
        return

    log(f"  Status: {r.status_code}  |  Final URL: {r.url}", results_file)

    # Перевіряємо чи не редирект на логін
    if "Login.aspx" in r.url or "login" in r.url.lower():
        log(f"  ⚠️  Редирект на логін — сесія не валідна", results_file)
        return

    if r.status_code != 200:
        log(f"  ⚠️  Не 200 — пропускаємо", results_file)
        return

    # Шукаємо PageMethods
    methods = find_page_methods(r.text, url)
    if methods:
        log(f"  ✅ Знайдено методів: {len(methods)}", results_file)
        for m in methods:
            log(f"     → {m}", results_file)
    else:
        log(f"  — PageMethods не знайдено", results_file)

    # Зберігаємо перші 300 символів сторінки (title + початок body)
    soup = BeautifulSoup(r.text, "html.parser")
    title = soup.title.string if soup.title else "немає title"
    log(f"  Title: {title}", results_file)

    # Шукаємо форми
    forms = soup.find_all("form")
    log(f"  Форм на сторінці: {len(forms)}", results_file)

    time.sleep(DELAY)


def main():
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/120.0.0.0 Safari/537.36",
    })

    with open(RESULTS_FILE, "w", encoding="utf-8") as f:
        log(f"Matchpoint API Research — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", f)
        log(f"BASE_URL: {BASE_URL}", f)
        log("=" * 60, f)

        # КРОК 1: Логін
        log("\n[КРОК 1] ЛОГІН", f)
        login_result = mp_login(session)
        if not login_result:
            log("ПОМИЛКА ЛОГІНУ", f)
            return

        final_url = login_result.url
        if "Login.aspx" in final_url:
            log(f"⚠️  Логін не вдався — залишились на {final_url}", f)
            log(f"HTML (перші 500): {login_result.text[:500]}", f)
        else:
            log(f"✅ Логін успішний — перейшли на {final_url}", f)

        time.sleep(DELAY)

        # КРОК 2: Дослідження сторінок
        log("\n[КРОК 2] ДОСЛІДЖЕННЯ СТОРІНОК", f)
        for path in PAGES_TO_EXPLORE:
            explore_page(session, path, f)
            time.sleep(DELAY)

        # КРОК 3: POST запити
        log("\n[КРОК 3] POST ЗАПИТИ", f)
        successful_posts = []

        for endpoint in POST_ENDPOINTS:
            for body in POST_BODIES:
                log(f"\nPOST {endpoint}", f)
                log(f"  Body: {json.dumps(body)}", f)

                status, response_text = try_post(session, endpoint, body)
                log(f"  Status: {status}", f)

                if status and status == 200:
                    preview = response_text[:500]
                    log(f"  ✅ УСПІХ! Відповідь (500 chars):", f)
                    log(f"  {preview}", f)
                    successful_posts.append({
                        "endpoint": endpoint,
                        "body": body,
                        "response_preview": preview,
                    })
                elif status:
                    log(f"  — Відповідь: {response_text[:200]}", f)
                else:
                    log(f"  — Помилка: {response_text[:200]}", f)

                time.sleep(DELAY)

        # КРОК 4: SUMMARY
        log("\n" + "=" * 60, f)
        log("SUMMARY", f)
        log("=" * 60, f)
        login_ok = "Login.aspx" not in login_result.url
        log(f"Логін: {'✅ успішний' if login_ok else '❌ не вдався'}", f)
        log(f"POST успішних відповідей: {len(successful_posts)}", f)

        if successful_posts:
            log("\nУспішні POST ендпоінти:", f)
            for p in successful_posts:
                log(f"  ✅ {p['endpoint']} | body: {p['body']}", f)
                log(f"     Preview: {p['response_preview'][:200]}", f)
        else:
            log("Жодного успішного POST запиту :(", f)

    # Термінальний summary
    print("\n" + "=" * 60)
    print("ФІНАЛЬНИЙ SUMMARY")
    print("=" * 60)
    print(f"Результати збережено у: {RESULTS_FILE}")
    print(f"Логін: {'✅ успішний' if 'Login.aspx' not in login_result.url else '❌ не вдався'}")  # noqa
    print(f"Успішних POST: {len(successful_posts)}")
    if successful_posts:
        print("Знайдені ендпоінти:")
        for p in successful_posts:
            print(f"  ✅ {p['endpoint']}")
    print("=" * 60)


if __name__ == "__main__":
    main()
