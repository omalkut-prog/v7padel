#!/usr/bin/env python3
"""
api_server.py  —  Local API server for V7 Padel coach calculator
Runs on http://localhost:5055

Endpoints:
  GET  /api/trainings?month=04&year=2026
  GET  /api/coaches
  GET  /api/months
  POST /api/salary/save
  GET  /api/salary?coach=Umur&month=04&year=2026

Usage:
  python etl/api_server.py
"""

import glob
import json
import os

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allow requests from file:// and localhost pages

BASE_DIR   = os.path.dirname(__file__)
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
SALARY_DIR = os.path.join(BASE_DIR, "salary")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(SALARY_DIR, exist_ok=True)


# ── Helpers ──────────────────────────────────────────────────────────────────

def load_trainings_file(year, month):
    """Load trainings JSON file for a given year/month. Returns list or None."""
    path = os.path.join(OUTPUT_DIR, f"trainings_{year}_{int(month):02d}.json")
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


# ── Routes ───────────────────────────────────────────────────────────────────

@app.route("/api/trainings")
def get_trainings():
    """
    GET /api/trainings?month=04&year=2026
    Returns full list of training records for the month.
    Optional filter: &coach=Umur
    """
    month = request.args.get("month", "").strip()
    year  = request.args.get("year",  "").strip()
    coach = request.args.get("coach", "").strip()

    if not month or not year:
        return jsonify({"error": "month and year are required"}), 400

    data = load_trainings_file(year, month)
    if data is None:
        return jsonify({"error": f"No data found for {year}-{month}. Run sync first."}), 404

    if coach:
        data = [t for t in data if t.get("coach", "").lower() == coach.lower()]

    return jsonify(data)


@app.route("/api/coaches")
def get_coaches():
    """
    GET /api/coaches
    Returns sorted list of unique coach names across all synced months.
    """
    coaches = set()
    for path in glob.glob(os.path.join(OUTPUT_DIR, "trainings_*.json")):
        with open(path, encoding="utf-8") as f:
            for t in json.load(f):
                name = (t.get("coach") or "").strip()
                if name:
                    coaches.add(name)
    return jsonify(sorted(coaches))


@app.route("/api/months")
def get_months():
    """
    GET /api/months
    Returns list of {year, month} objects where synced data exists.
    """
    months = []
    for path in sorted(glob.glob(os.path.join(OUTPUT_DIR, "trainings_*.json"))):
        name   = os.path.basename(path).replace("trainings_", "").replace(".json", "")
        parts  = name.split("_")
        if len(parts) == 2:
            months.append({"year": parts[0], "month": parts[1]})
    return jsonify(months)


@app.route("/api/salary/save", methods=["POST"])
def save_salary():
    """
    POST /api/salary/save
    Body: { coach, month, year, ...calculation fields }
    Saves to etl/salary/salary_YYYY_MM_CoachName.json
    """
    data = request.get_json(force=True, silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    coach = (data.get("coach") or "unknown").replace(" ", "_")
    month = data.get("month", "00")
    year  = data.get("year",  "0000")

    filename = f"salary_{year}_{int(month):02d}_{coach}.json"
    path     = os.path.join(SALARY_DIR, filename)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return jsonify({"ok": True, "file": filename})


@app.route("/api/salary")
def get_salary():
    """
    GET /api/salary?coach=Umur&month=04&year=2026
    Returns saved salary calculation or 404.
    """
    coach = (request.args.get("coach") or "").replace(" ", "_").strip()
    month = (request.args.get("month") or "").strip()
    year  = (request.args.get("year")  or "").strip()

    if not all([coach, month, year]):
        return jsonify({"error": "coach, month and year are required"}), 400

    filename = f"salary_{year}_{int(month):02d}_{coach}.json"
    path     = os.path.join(SALARY_DIR, filename)

    if not os.path.exists(path):
        return jsonify({"error": f"Salary record not found: {filename}"}), 404

    with open(path, encoding="utf-8") as f:
        return jsonify(json.load(f))


# ── Startup ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\n🚀  V7 Padel API Server")
    print(f"   http://localhost:5055\n")
    print("   GET  /api/trainings?month=04&year=2026")
    print("   GET  /api/coaches")
    print("   GET  /api/months")
    print("   POST /api/salary/save")
    print("   GET  /api/salary?coach=Umur&month=04&year=2026")
    print("\n   Ctrl+C to stop\n")
    app.run(host="0.0.0.0", port=5055, debug=False)
