#!/usr/bin/env python3
"""
sync_trainings_matchpoint.py
Extracts training sessions (clase_suelta) from Matchpoint API.

Usage:
    python etl/sync_trainings_matchpoint.py --month 04 --year 2026
    python etl/sync_trainings_matchpoint.py           # current month
"""

import argparse
import calendar
import json
import os
import re
import time
from datetime import datetime, date

import requests
import urllib3
from bs4 import BeautifulSoup

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BASE_URL   = "https://app-v7padel-tur.matchpoint.com.es"
DELAY      = 0.15
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")

CREDS = {
    "username": "Club",
    "password": "v7padelclub2025new",
}

# ── Price map: per-client price → pack name ──────────────────────────────────
# Keys without _head = club coach, _head = head coach (Umur)
PRICE_MAP = {
    "indAdult": {
        2800: "single", 2700: "pack3", 2600: "pack5",
        2500: "pack8",  2400: "pack10",
    },
    "indAdult_head": {
        3700: "single", 3600: "pack3", 3500: "pack5",
        3400: "pack8",  3300: "pack10",
    },
    "indKids": {
        2600: "single", 2500: "pack3", 2400: "pack5",
        2300: "pack8",  2200: "pack10",
    },
    "indKids_head": {
        3400: "single", 3300: "pack3", 3200: "pack5",
        3100: "pack8",  3000: "pack10",
    },
    "pairAdult": {
        1600: "single", 1500: "pack4", 1400: "pack8", 1300: "pack12",
    },
    "pairAdult_head": {
        2200: "single", 2100: "pack4", 2000: "pack8", 1800: "pack12",
    },
    "pairKids": {
        1300: "single", 1200: "pack8",
    },
    "pairKids_head": {
        1600: "single", 1500: "pack8",
    },
    "grpAdult": {
        1100: "single", 1050: "pack4", 1025: "pack8", 1000: "pack12",
    },
    "grpAdult_head": {
        1400: "single", 1350: "pack4", 1300: "pack8", 1250: "pack12",
    },
    "grpKids": {
        800: "single", 750: "pack8",
    },
    "grpKids_head": {
        1100: "single", 1000: "pack8",
    },
}

# Coaches whose name matches (lowercase) → head level
HEAD_COACHES = {"umur"}

COURT_NAMES = {"P1": "PADEL 1", "P2": "PADEL 2", "P3": "PADEL 3", "P4": "PADEL 4"}


# ── Session / Login ──────────────────────────────────────────────────────────

def build_session():
    s = requests.Session()
    s.headers["User-Agent"] = (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    return s


def mp_login(session):
    """Two-step Matchpoint login (credentials → cashbox selection)."""
    login_url = f"{BASE_URL}/Login.aspx"
    r = session.get(login_url, verify=False, timeout=30)

    soup = BeautifulSoup(r.text, "html.parser")
    form = soup.find("form")
    action = form["action"] if form and form.get("action") else "Login.aspx"
    post_url = f"{BASE_URL}/{action.lstrip('/')}"

    form_data = {}
    for inp in soup.find_all("input"):
        n = inp.get("name", "")
        v = inp.get("value", "")
        t = inp.get("type", "text").lower()
        if n and t != "checkbox":
            form_data[n] = v

    form_data["username"]        = CREDS["username"]
    form_data["password"]        = CREDS["password"]
    form_data["__EVENTTARGET"]   = "btnLogin"
    form_data["__EVENTARGUMENT"] = ""
    form_data.pop("btnLogin", None)

    r2 = session.post(
        post_url, data=form_data, verify=False, timeout=30,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Referer": login_url,
            "Origin": BASE_URL,
        },
        allow_redirects=True,
    )

    # Step 2 — cashbox selection (HiddenFieldLoggedIn == "true")
    soup2  = BeautifulSoup(r2.text, "html.parser")
    hidden = soup2.find("input", {"name": "HiddenFieldLoggedIn"})
    if hidden and hidden.get("value") == "true":
        fd2 = {}
        for inp in soup2.find_all("input"):
            n = inp.get("name", "")
            v = inp.get("value", "")
            if n and inp.get("type", "").lower() != "checkbox":
                fd2[n] = v
        for sel in soup2.find_all("select"):
            nm = sel.get("name")
            if nm:
                opt     = sel.find("option")
                fd2[nm] = opt["value"] if opt else "1"
        fd2["__EVENTTARGET"]   = "btnAcceder"
        fd2["__EVENTARGUMENT"] = ""
        fd2["btnAcceder"]      = "Acceder"
        r3 = session.post(
            r2.url, data=fd2, verify=False, timeout=30,
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": r2.url,
                "Origin": BASE_URL,
            },
            allow_redirects=True,
        )
        return r3
    return r2


def page_post(session, method, body):
    """POST to CuadroReservasNuevo.aspx PageMethod, return d field."""
    url = f"{BASE_URL}/Reservas/CuadroReservasNuevo.aspx/{method}"
    r = session.post(
        url, json=body, verify=False, timeout=30,
        headers={
            "Content-Type":   "application/json; charset=utf-8",
            "Accept":         "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Referer":        f"{BASE_URL}/Reservas/CuadroReservasNuevo.aspx",
            "Origin":         BASE_URL,
        },
    )
    return r.json().get("d")


# ── Parsing helpers ──────────────────────────────────────────────────────────

def parse_training_key(texto1_raw):
    """
    Determine training_key from the Texto1 string.
    Returns one of: indAdult, indKids, pairAdult, pairKids, grpAdult, grpKids.

    Texto1 from tooltip looks like:
      "Clase Individual Adult Training 60 MIN 01/04/2026 12:00 P3"
    Removing "Clase " prefix leaves the original description.
    """
    text = texto1_raw.lower()

    # Format
    if "individual" in text or "(1" in text:
        fmt = "ind"
    elif "pair" in text or "(2 pl)" in text or "(2pl)" in text:
        fmt = "pair"
    elif "group" in text or "grupo" in text or "(3" in text or "(4" in text:
        fmt = "grp"
    else:
        fmt = "ind"  # safe fallback

    # Age
    age = "Kids" if any(w in text for w in ("kid", "child", "junior", "niño", "niña")) else "Adult"

    return f"{fmt}{age}"


def parse_coach(texto2):
    """
    Extract coach name from tooltip's Texto2 = 'Monitor: Umur  '.
    Returns '' if not present.
    """
    if not texto2:
        return ""
    return texto2.replace("Monitor:", "").strip().rstrip(".")


def get_coach_level(coach_name):
    """'umur' → 'head', anything else → 'club'."""
    return "head" if coach_name.strip().lower() in HEAD_COACHES else "club"


def lookup_pack(training_key, coach_level, price_per_client):
    """
    Map (training_key, coach_level, price) → pack name string.
    For head coaches: tries _head map first, falls back to club map.
    Returns 'free' for price == 0, 'unknown' if not found in any map.
    """
    price = int(round(float(price_per_client)))
    if price == 0:
        return "free"

    maps_to_try = []
    if coach_level == "head":
        maps_to_try = [training_key + "_head", training_key]
    else:
        maps_to_try = [training_key]

    for mk in maps_to_try:
        result = PRICE_MAP.get(mk, {}).get(price)
        if result:
            return result
    return "unknown"


def get_standard_price(training_key, coach_level, pack):
    """
    Return the standard (list) price for a given training_key + coach_level + pack.
    Used for salary calculation — ignores actual discounted amount paid.
    Returns None if not found (e.g. 'free').
    """
    if pack in ("free", "unknown"):
        return None

    maps_to_try = []
    if coach_level == "head":
        maps_to_try = [training_key + "_head", training_key]
    else:
        maps_to_try = [training_key]

    for mk in maps_to_try:
        price_map = PRICE_MAP.get(mk, {})
        for price, p in price_map.items():
            if p == pack:
                return float(price)
    return None


def extract_court(texto1):
    """Pull court short code from end of Texto1, map to full name."""
    parts = texto1.strip().split()
    if parts and re.match(r"^P\d+$", parts[-1]):
        return COURT_NAMES.get(parts[-1], parts[-1])
    return ""


# ── Record builder ───────────────────────────────────────────────────────────

def build_record(tooltip):
    """Convert ObtenerInformacionReservaTooltip response → structured dict."""
    usuarios = tooltip.get("Usuarios") or []

    # Coach
    coach       = parse_coach(tooltip.get("Texto2", ""))
    coach_level = get_coach_level(coach)

    # Training key — strip "Clase " prefix added by the API in Texto1
    texto1_full = tooltip.get("Texto1", "")
    texto1_desc = re.sub(r"^Clase\s+", "", texto1_full).strip()
    training_key = parse_training_key(texto1_desc)

    n_clients        = len(usuarios)
    price_per_client = float(usuarios[0].get("ImporteTotal", 0)) if usuarios else 0.0
    actual_revenue   = sum(float(u.get("ImporteTotal", 0)) for u in usuarios)
    paid             = all(not u.get("PendientePago", True) for u in usuarios)
    pending_payment  = sum(float(u.get("ImportePendientePago", 0)) for u in usuarios)

    pack = lookup_pack(training_key, coach_level, price_per_client)

    # Fallback: if pack unrecognised → treat as "single" for salary purposes.
    # Salary is always calculated on the standard list price, not the discounted amount.
    price_override = False
    if pack == "unknown":
        pack           = "single"
        price_override = True

    # For group sessions: minimum 3 clients for salary calc regardless of actual attendance.
    # (Coach is paid as if the group is full — low turnout is not their problem.)
    GROUP_KEYS = {"grpAdult", "grpKids", "grp3Adult", "grp4Adult", "grp3Kids", "grp4Kids"}
    n_clients_for_calc = max(n_clients, 3) if training_key in GROUP_KEYS else n_clients

    # Standard (list) price for salary calculation
    std_price = get_standard_price(training_key, coach_level, pack)
    if std_price is not None:
        calc_revenue = std_price * n_clients_for_calc
        if std_price != price_per_client or n_clients_for_calc != n_clients:
            price_override = True
    else:
        # free session — no salary base
        calc_revenue   = 0.0

    # Date ISO
    fecha    = tooltip.get("StrFecha", "")
    date_iso = ""
    if fecha:
        try:
            date_iso = datetime.strptime(fecha, "%d/%m/%Y").strftime("%Y-%m-%d")
        except ValueError:
            date_iso = fecha

    return {
        "id":               tooltip.get("Id"),
        "date":             date_iso,
        "time":             tooltip.get("StrHoraInicio", ""),
        "time_end":         tooltip.get("StrHoraFin", ""),
        "duration_min":     tooltip.get("Minutos", 60),
        "court":            extract_court(texto1_full),
        "coach":            coach,
        "coach_level":      coach_level,
        "training_key":     training_key,
        "training_name":    texto1_desc,
        "pack":             pack,
        "price_override":      price_override,
        "n_clients":           n_clients,
        "n_clients_for_calc":  n_clients_for_calc,
        "price_per_client":    price_per_client,
        "actual_revenue":   actual_revenue,
        "calc_revenue":     calc_revenue,
        "paid":             paid,
        "pending_payment":  pending_payment,
        "clients":          [u.get("Nombre", "") for u in usuarios],
        "registered_by":    tooltip.get("Usuario_Registro", ""),
    }


# ── Main sync ────────────────────────────────────────────────────────────────

def sync_month(year, month):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_file = os.path.join(OUTPUT_DIR, f"trainings_{year}_{month:02d}.json")

    print(f"\n{'='*60}")
    print(f"Matchpoint Training Sync  —  {year}/{month:02d}")
    print(f"{'='*60}")

    session = build_session()

    print("[1/4] Logging in …")
    result = mp_login(session)
    if "Login.aspx" in result.url:
        print("❌  Login failed! Check credentials.")
        return
    print(f"✅  Logged in → {result.url}")

    # Warm up the booking page (required for PageMethods CSRF)
    session.get(f"{BASE_URL}/Reservas/CuadroReservasNuevo.aspx", verify=False)
    time.sleep(DELAY)

    _, last_day = calendar.monthrange(year, month)
    all_dates   = [date(year, month, d) for d in range(1, last_day + 1)]

    print(f"[2/4] Daily schedules for {len(all_dates)} days …")
    clase_ids = []  # [(fecha_str, booking_id)]

    for d in all_dates:
        fecha = d.strftime("%d/%m/%Y")
        try:
            data = page_post(session, "ObtenerDiario", {"idCuadro": 3, "fecha": fecha})
            if data and isinstance(data, dict):
                clases = [e for e in data.get("Entradas", []) if e.get("Tipo") == "clase_suelta"]
                if clases:
                    print(f"  {fecha}  {len(clases):2d} trainings")
                    for c in clases:
                        clase_ids.append((fecha, c["Id"]))
                else:
                    print(f"  {fecha}  —")
        except Exception as exc:
            print(f"  {fecha}  ERROR: {exc}")
        time.sleep(DELAY)

    print(f"\n[3/4] Fetching details for {len(clase_ids)} sessions …")
    trainings = []

    for i, (fecha, bid) in enumerate(clase_ids, 1):
        try:
            tooltip = page_post(session, "ObtenerInformacionReservaTooltip", {"id": bid})
            if tooltip and isinstance(tooltip, dict):
                # Skip sessions where every client paid 0 (trial/free classes — not counted for salary)
                usuarios = tooltip.get("Usuarios") or []
                if usuarios and all(float(u.get("ImporteTotal", 0)) == 0 for u in usuarios):
                    print(f"  [{i:3d}/{len(clase_ids)}] {fecha}  SKIP (free — all ImporteTotal=0)")
                    continue

                rec = build_record(tooltip)
                trainings.append(rec)
                override_flag = " ⚡" if rec["price_override"] else ""
                print(
                    f"  [{i:3d}/{len(clase_ids)}] {fecha}  {rec['time']:5s}  "
                    f"{rec['training_key']:12s}  pack={rec['pack']:8s}  "
                    f"coach={rec['coach'] or '?':18s}  "
                    f"n={rec['n_clients']}  "
                    f"act={rec['actual_revenue']:.0f}₺  calc={rec['calc_revenue']:.0f}₺"
                    f"{override_flag}"
                )
        except Exception as exc:
            print(f"  [{i:3d}] {fecha} id={bid}  ERROR: {exc}")
        time.sleep(DELAY)

    print(f"\n[4/4] Saving → {out_file} …")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(trainings, f, ensure_ascii=False, indent=2)

    # ── Summary ──────────────────────────────────────────────────────────────
    actual_rev   = sum(t["actual_revenue"] for t in trainings)
    calc_rev     = sum(t["calc_revenue"]   for t in trainings)
    overrides    = [t for t in trainings if t["price_override"]]
    by_coach     = {}
    for t in trainings:
        c = t["coach"] or "Unknown"
        by_coach[c] = by_coach.get(c, 0) + 1

    print(f"\n{'='*60}")
    print(f"✅  DONE  —  {len(trainings)} sessions saved")
    print(f"   Actual revenue : {actual_rev:,.0f} ₺  (from Matchpoint)")
    print(f"   Calc revenue   : {calc_rev:,.0f} ₺  (standard prices, for salary)")
    print(f"   Price overrides: {len(overrides)} sessions ⚡ (discount applied or unknown price)")
    print(f"   By coach       : {dict(sorted(by_coach.items(), key=lambda x: -x[1]))}")
    print(f"   File           : {out_file}")
    print(f"{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(description="Sync Matchpoint training sessions")
    parser.add_argument("--month", type=int, default=datetime.now().month,
                        help="Month 1-12 (default: current)")
    parser.add_argument("--year",  type=int, default=datetime.now().year,
                        help="Year, e.g. 2026 (default: current)")
    args = parser.parse_args()

    if not 1 <= args.month <= 12:
        print("❌  Month must be between 1 and 12")
        return

    sync_month(args.year, args.month)


if __name__ == "__main__":
    main()
