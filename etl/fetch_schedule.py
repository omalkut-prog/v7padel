"""
fetch_schedule.py — витягує дані зайнятості кортів з Matchpoint
та зберігає schedule_data.json для schedule-v2.html

Запуск:
  python etl/fetch_schedule.py --month 5 --year 2026
  python etl/fetch_schedule.py --month 5 --year 2026 --out schedule_data.json
"""
import argparse
import calendar
import json
import random
import re
import string
import time
import urllib3
from datetime import date, timedelta

import requests
from bs4 import BeautifulSoup

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BASE_URL = "https://app-v7padel-tur.matchpoint.com.es"
ID_CUADRO = 3          # id_cuadro=3 — Padel courts
DELAY = 0.2            # 200ms between requests

CREDS = {
    "username": "Club",
    "password": "v7padelclub2025new",
}

# Matchpoint Tipo → schedule-v2 type
TYPE_MAP = {
    "reserva_actividad_abierta": "booking",    # tournament / open activity
    "reserva_club":              "booking",
    "reserva_individual":        "booking",
    "reserva_partida":           "booking",
    "clase_particular":          "training",
    "clase_suelta":              "training",
    "mantenimiento":             "maintenance",
}


def rand_id(prefix="mp"):
    return prefix + "_" + "".join(random.choices(string.ascii_lowercase + string.digits, k=8))


def mp_login(session: requests.Session) -> bool:
    """Two-step Matchpoint login. Returns True on success."""
    # Step 1 — credentials form
    r = session.get(f"{BASE_URL}/Login.aspx", verify=False, timeout=30)
    soup = BeautifulSoup(r.text, "html.parser")
    form = soup.find("form")
    if not form:
        print("[LOGIN] ERROR: no form found on Login.aspx")
        return False

    action = form.get("action", "")
    post_url = f"{BASE_URL}/{action.lstrip('/')}"

    fd = {inp.get("name", ""): inp.get("value", "")
          for inp in soup.find_all("input") if inp.get("name", "")}
    fd.update({
        "username": CREDS["username"],
        "password": CREDS["password"],
        "__EVENTTARGET": "btnLogin",
        "__EVENTARGUMENT": "",
    })
    fd.pop("btnLogin", None)

    r2 = session.post(post_url, data=fd, verify=False, timeout=30,
                      headers={"Content-Type": "application/x-www-form-urlencoded",
                               "Referer": f"{BASE_URL}/Login.aspx"},
                      allow_redirects=False)

    # Step 2 — cashbox selection (HiddenFieldLoggedIn = 'true')
    soup2 = BeautifulSoup(r2.text, "html.parser")
    hfl = soup2.find("input", {"name": "HiddenFieldLoggedIn"})
    if not hfl or hfl.get("value") != "true":
        print("[LOGIN] ERROR: credentials rejected")
        return False

    fd2 = {inp.get("name", ""): inp.get("value", "")
           for inp in soup2.find_all("input") if inp.get("name", "")}
    sel = soup2.find("select", {"name": "DropDownListCajas"})
    if sel:
        opts = sel.find_all("option")
        fd2["DropDownListCajas"] = opts[0].get("value", "1") if opts else "1"
    fd2.update({"__EVENTTARGET": "btnAcceder", "__EVENTARGUMENT": ""})
    fd2.pop("btnAcceder", None)

    cashier_url = f"{BASE_URL}/Temas/Matchpoint_2_5/Login.aspx?AspxAutoDetectCookieSupport=1"
    r3 = session.post(cashier_url, data=fd2, verify=False, timeout=30,
                      headers={"Content-Type": "application/x-www-form-urlencoded",
                               "Referer": post_url},
                      allow_redirects=True)

    if "Login" in r3.url:
        print(f"[LOGIN] ERROR: still on Login page after cashier step: {r3.url}")
        return False

    print(f"[LOGIN] OK — {r3.url}")
    return True


def fetch_day(session: requests.Session, day: date) -> list:
    """Fetch ObtenerCuadro for one day, return list of block dicts."""
    fecha = day.strftime("%d/%m/%Y")
    url = f"{BASE_URL}/Reservas/CuadroReservasNuevo.aspx/ObtenerCuadro"
    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": f"{BASE_URL}/Reservas/CuadroReservasNuevo.aspx?id_cuadro={ID_CUADRO}",
    }
    body = {"idCuadro": ID_CUADRO, "fecha": fecha}

    try:
        r = session.post(url, json=body, headers=headers, verify=False, timeout=30)
    except Exception as e:
        print(f"  [ERROR] {fecha}: {e}")
        return []

    if r.status_code != 200:
        print(f"  [WARN] {fecha}: HTTP {r.status_code}")
        return []

    try:
        data = r.json().get("d", {})
    except Exception:
        print(f"  [WARN] {fecha}: invalid JSON")
        return []

    date_iso = day.strftime("%Y-%m-%d")
    blocks = []

    columnas = data.get("Columnas", [])
    for court_idx, col in enumerate(columnas):
        court_label = col.get("TextoPrincipal", f"P{court_idx+1}")
        for occ in col.get("Ocupaciones", []):
            tipo = occ.get("Tipo", "")
            mp_type = TYPE_MAP.get(tipo, "booking")

            # Parse persons from TextoAmpliadoCabecera e.g. "(3/4p)"
            persons = 0
            cab = occ.get("TextoAmpliadoCabecera", "")
            m = re.search(r'\((\d+)(?:/(\d+))?p\)', cab)
            if m:
                persons = int(m.group(1))

            name = occ.get("Texto1", "") or tipo.replace("_", " ").title()
            # Strip HTML from Texto2 for persons fallback
            txt2 = re.sub(r"<[^>]+>", " ", occ.get("Texto2", "")).strip()
            if not persons and txt2:
                names = [n.strip() for n in txt2.split() if n.strip()]
                persons = len(names) // 2 if len(names) > 1 else len(names)

            blocks.append({
                "id":        rand_id(),
                "date":      date_iso,
                "courtIdx":  court_idx,
                "courtLabel": court_label,
                "start":     occ.get("StrHoraInicio", ""),
                "end":       occ.get("StrHoraFin", ""),
                "type":      mp_type,
                "mpTipo":    tipo,
                "name":      name,
                "persons":   persons,
                "color":     occ.get("Color", ""),
                "fromMP":    True,
            })

    return blocks


def main():
    parser = argparse.ArgumentParser(description="Fetch Matchpoint schedule data")
    parser.add_argument("--month", type=int, required=True)
    parser.add_argument("--year",  type=int, required=True)
    parser.add_argument("--out",   default="schedule_data.json")
    args = parser.parse_args()

    session = requests.Session()
    session.headers["User-Agent"] = (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )

    print(f"[FETCH] {args.year}-{args.month:02d}  → {args.out}")
    if not mp_login(session):
        print("[FETCH] Abort: login failed")
        return

    # Warm up the booking grid page (establishes page-level session state)
    session.get(f"{BASE_URL}/Reservas/CuadroReservasNuevo.aspx?id_cuadro={ID_CUADRO}",
                verify=False, timeout=30)
    time.sleep(DELAY)

    _, days_in_month = calendar.monthrange(args.year, args.month)
    all_blocks = []
    errors = 0

    for day_num in range(1, days_in_month + 1):
        d = date(args.year, args.month, day_num)
        print(f"  Fetching {d.strftime('%Y-%m-%d')} ...", end=" ", flush=True)
        blocks = fetch_day(session, d)
        all_blocks.extend(blocks)
        print(f"{len(blocks)} blocks")
        time.sleep(DELAY)

    out = {
        "version": 2,
        "exported": date.today().isoformat(),
        "month": args.month,
        "year": args.year,
        "blocks": all_blocks,
    }

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"\n[DONE] {len(all_blocks)} blocks → {args.out}")
    # Stats
    from collections import Counter
    by_type = Counter(b["type"] for b in all_blocks)
    print(f"  By type: {dict(by_type)}")
    dates = set(b["date"] for b in all_blocks)
    print(f"  Days covered: {len(dates)}")


if __name__ == "__main__":
    main()
