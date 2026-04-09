#!/usr/bin/env python3
"""V7 Padel — Racket.ID data extraction via Firestore REST API.

Extracts tournaments, members, and participant data from Racket.ID
Firebase backend for the V7 Padel Antalya group (pQ5uN5ZErqRufJ).

Output: 3 CSV files in ../data/
  - racketid_members.csv     (351 group members with profiles)
  - racketid_tournaments.csv (all events/tournaments)
  - racketid_participants.csv (user × tournament participation)
"""

import urllib.request, json, csv, os, sys, io, time
from collections import Counter

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE = 'https://firestore.googleapis.com/v1/projects/racket-id/databases/(default)/documents'
GROUP_ID = 'pQ5uN5ZErqRufJ'
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
os.makedirs(DATA_DIR, exist_ok=True)


def firestore_get(path):
    """GET a Firestore document."""
    url = f'{BASE}/{path}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode('utf-8'))


def firestore_query(collection, field, value, limit=20, offset=0):
    """Run a structured query with one field filter."""
    query = {
        'structuredQuery': {
            'from': [{'collectionId': collection}],
            'where': {
                'fieldFilter': {
                    'field': {'fieldPath': field},
                    'op': 'EQUAL',
                    'value': {'stringValue': value}
                }
            },
            'limit': limit,
            'offset': offset
        }
    }
    req = urllib.request.Request(
        BASE + ':runQuery',
        data=json.dumps(query).encode(),
        headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode('utf-8'))


def fval(fields, key, default=''):
    """Extract a scalar value from Firestore fields."""
    if key not in fields:
        return default
    v = fields[key]
    for vtype in ('stringValue', 'integerValue', 'doubleValue', 'booleanValue', 'timestampValue'):
        if vtype in v:
            return v[vtype]
    return default


# ============================================================
# 1. MEMBERS — fetch group users, then resolve profiles
# ============================================================
print('=== Extracting group members ===')
group = firestore_get(f'IGroups/{GROUP_ID}')
user_ids = [u['stringValue'] for u in group['fields']['users']['arrayValue']['values']]
print(f'Group has {len(user_ids)} members')

members = []
for i, uid in enumerate(user_ids):
    try:
        profile = firestore_get(f'IUserProfiles/{uid}')
        f = profile.get('fields', {})
        members.append({
            'user_id': uid,
            'name': fval(f, 'name'),
            'padel_rating': fval(f, 'padelRating', 0),
            'phone': fval(f, 'phoneNumber'),
            'gender': fval(f, 'gender'),
            'email': fval(f, 'email'),
        })
    except Exception as e:
        members.append({'user_id': uid, 'name': f'ERROR: {e}', 'padel_rating': 0, 'phone': '', 'gender': '', 'email': ''})

    if (i + 1) % 50 == 0:
        print(f'  ...fetched {i+1}/{len(user_ids)} profiles')
        time.sleep(0.5)  # be nice to Firebase

print(f'Members fetched: {len(members)}')

# Write members CSV
members_path = os.path.join(DATA_DIR, 'racketid_members.csv')
with open(members_path, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=['user_id', 'name', 'padel_rating', 'phone', 'gender', 'email'])
    w.writeheader()
    w.writerows(members)
print(f'Written: {members_path}')

# ============================================================
# 2. TOURNAMENTS — all IProducts for V7 group
# ============================================================
print('\n=== Extracting tournaments ===')
all_products = []
offset = 0
while True:
    results = firestore_query('IProducts', 'group', GROUP_ID, limit=20, offset=offset)
    docs = [r for r in results if 'document' in r]
    all_products.extend(docs)
    if len(docs) < 20:
        break
    offset += 20
    time.sleep(0.3)
    if offset > 1000:
        break

print(f'Total products: {len(all_products)}')

tournaments = []
participants_rows = []

for p in all_products:
    doc = p['document']
    doc_id = doc['name'].split('/')[-1]
    f = doc['fields']

    title = fval(f, 'title')
    status = fval(f, 'status')
    date = fval(f, 'date')
    end_time = fval(f, 'endTime')
    sport = fval(f, 'sport')
    doubles = fval(f, 'doubles', False)
    slots_count = fval(f, 'slots', 0)
    club_name = fval(f, 'clubName')

    # Extract participant user IDs
    participant_ids = []
    # Method 1: users map (registered participants)
    users_field = f.get('users', {})
    if 'mapValue' in users_field:
        participant_ids = list(users_field['mapValue'].get('fields', {}).keys())

    # Method 2: _users array (all associated users)
    _users_field = f.get('_users', {})
    if 'arrayValue' in _users_field:
        _user_ids = [u['stringValue'] for u in _users_field['arrayValue'].get('values', [])]
        # Use _users if users map is empty
        if not participant_ids:
            participant_ids = _user_ids

    # Gameplan state
    gp = f.get('gameplan', {})
    gp_state = ''
    if 'mapValue' in gp:
        gp_fields = gp['mapValue'].get('fields', {})
        gp_state = fval(gp_fields, 'state')

    tournaments.append({
        'product_id': doc_id,
        'title': title,
        'status': status,
        'date': str(date)[:19] if date else '',
        'end_time': end_time,
        'sport': sport,
        'doubles': doubles,
        'slots': slots_count,
        'participants_count': len(participant_ids),
        'gameplan_state': gp_state,
        'club_name': club_name,
    })

    # Participant rows
    for uid in participant_ids:
        participants_rows.append({
            'product_id': doc_id,
            'user_id': uid,
            'title': title,
            'date': str(date)[:19] if date else '',
        })

# Write tournaments CSV
tourn_path = os.path.join(DATA_DIR, 'racketid_tournaments.csv')
with open(tourn_path, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=['product_id', 'title', 'status', 'date', 'end_time',
                                       'sport', 'doubles', 'slots', 'participants_count',
                                       'gameplan_state', 'club_name'])
    w.writeheader()
    w.writerows(tournaments)
print(f'Written: {tourn_path} ({len(tournaments)} rows)')

# Write participants CSV
part_path = os.path.join(DATA_DIR, 'racketid_participants.csv')
with open(part_path, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=['product_id', 'user_id', 'title', 'date'])
    w.writeheader()
    w.writerows(participants_rows)
print(f'Written: {part_path} ({len(participants_rows)} rows)')

# ============================================================
# SUMMARY
# ============================================================
print('\n' + '=' * 60)
print('RACKET.ID EXTRACTION SUMMARY')
print('=' * 60)
print(f'Members:        {len(members)}')
print(f'Tournaments:    {len(tournaments)}')
print(f'Participations: {len(participants_rows)}')
print(f'Unique participants across all events: {len(set(r["user_id"] for r in participants_rows))}')

# Stats
status_counts = Counter(t['status'] for t in tournaments)
print(f'\nTournament status: {dict(status_counts)}')

ended = [t for t in tournaments if t['gameplan_state'] == 'ended']
print(f'Completed (gameplan=ended): {len(ended)}')

avg_part = sum(t['participants_count'] for t in tournaments) / max(len(tournaments), 1)
print(f'Avg participants per event: {avg_part:.1f}')
