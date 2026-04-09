#!/usr/bin/env python3
"""V7 Padel — Cross-matching Racket.ID members ↔ Matchpoint customers.

Links Racket.ID profiles (name, phone, email) to Matchpoint customer records.
Outputs confidence-scored linkage to data/customer_linkage.csv"""

import csv, os, sys, io, re, unicodedata
from collections import Counter

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')

# Staff exclusions
STAFF_NAMES = {'gulcan yanar', 'v7 padel admin'}


def norm_name(s):
    if not s: return ''
    s = str(s).replace('\xa0', ' ').strip().lower()
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r'[?]', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def norm_phone(s):
    if not s: return ''
    return re.sub(r'[^\d+]', '', str(s).replace('\xa0', ''))


# ---- Load Matchpoint customers ----
import openpyxl
wb = openpyxl.load_workbook('C:/Users/volod/Downloads/out (11).xlsx', read_only=True)
cust_rows = list(wb.active.iter_rows(values_only=True))
cust_headers = cust_rows[0]
cust_data = cust_rows[1:]

mp_customers = []
mp_by_name = {}  # norm_name -> customer
mp_by_phone = {}  # norm_phone -> customer

for r in cust_data:
    code = r[0]
    name = str(r[2] or '').replace('\xa0', ' ').strip()
    last1 = str(r[3] or '').replace('\xa0', ' ').strip()
    last2 = str(r[4] or '').replace('\xa0', ' ').strip()
    phone = str(r[6] or '').replace('\xa0', ' ').strip()
    email = str(r[7] or '').replace('\xa0', ' ').strip()

    full = name
    if last1: full += ' ' + last1
    nfull = norm_name(full)

    if nfull in STAFF_NAMES:
        continue

    rec = {
        'mp_code': code,
        'mp_name': full,
        'mp_phone': phone,
        'mp_email': email,
        'mp_norm_name': nfull,
    }
    mp_customers.append(rec)
    if nfull and len(nfull) > 3:
        mp_by_name[nfull] = rec
    np = norm_phone(phone)
    if np and len(np) >= 7:
        mp_by_phone[np] = rec
        # Also store without country code prefix
        if np.startswith('+90'):
            mp_by_phone[np[3:]] = rec
        elif np.startswith('+380'):
            mp_by_phone[np[4:]] = rec
        elif np.startswith('+7'):
            mp_by_phone[np[2:]] = rec

print(f'Matchpoint customers loaded: {len(mp_customers)}')
print(f'Name index: {len(mp_by_name)} entries')
print(f'Phone index: {len(mp_by_phone)} entries')

# ---- Load Racket.ID members ----
rid_members = []
with open(os.path.join(DATA_DIR, 'racketid_members.csv'), encoding='utf-8') as f:
    for row in csv.DictReader(f):
        nn = norm_name(row['name'])
        if nn in STAFF_NAMES:
            continue
        rid_members.append({
            'rid_user_id': row['user_id'],
            'rid_name': row['name'],
            'rid_rating': row['padel_rating'],
            'rid_phone': row['phone'],
            'rid_email': row['email'],
            'rid_norm_name': nn,
        })

print(f'Racket.ID members loaded: {len(rid_members)}')

# ---- Load Racket.ID participation stats ----
rid_participation = Counter()
with open(os.path.join(DATA_DIR, 'racketid_participants.csv'), encoding='utf-8') as f:
    for row in csv.DictReader(f):
        rid_participation[row['user_id']] += 1

# ---- Cross-match ----
linkage = []
matched_by_phone = 0
matched_by_name = 0
matched_by_email = 0
unmatched = 0

for rm in rid_members:
    mp_match = None
    confidence = 0
    method = ''

    # 1. Phone match (highest confidence)
    np = norm_phone(rm['rid_phone'])
    if np and len(np) >= 7:
        # Try direct
        if np in mp_by_phone:
            mp_match = mp_by_phone[np]
            confidence = 95
            method = 'phone_exact'
        # Try without prefix
        elif np.startswith('+90') and np[3:] in mp_by_phone:
            mp_match = mp_by_phone[np[3:]]
            confidence = 90
            method = 'phone_no_prefix'
        elif np.startswith('+380') and np[4:] in mp_by_phone:
            mp_match = mp_by_phone[np[4:]]
            confidence = 90
            method = 'phone_no_prefix'

    # 2. Name match (if no phone match)
    if not mp_match:
        nn = rm['rid_norm_name']
        if nn and nn in mp_by_name:
            mp_match = mp_by_name[nn]
            confidence = 80
            method = 'name_exact'
        elif nn:
            # Try first+last in different order
            parts = nn.split()
            if len(parts) == 2:
                rev = parts[1] + ' ' + parts[0]
                if rev in mp_by_name:
                    mp_match = mp_by_name[rev]
                    confidence = 75
                    method = 'name_reversed'
            # Try first name only (low confidence)
            if not mp_match and len(parts) >= 1 and len(parts[0]) >= 3:
                candidates = [c for c in mp_customers if c['mp_norm_name'].startswith(parts[0] + ' ')]
                if len(candidates) == 1:
                    mp_match = candidates[0]
                    confidence = 50
                    method = 'first_name_unique'

    participations = rid_participation.get(rm['rid_user_id'], 0)

    linkage.append({
        'rid_user_id': rm['rid_user_id'],
        'rid_name': rm['rid_name'],
        'rid_rating': rm['rid_rating'],
        'rid_phone': rm['rid_phone'],
        'rid_participations': participations,
        'mp_code': mp_match['mp_code'] if mp_match else '',
        'mp_name': mp_match['mp_name'] if mp_match else '',
        'confidence': confidence,
        'method': method,
    })

    if mp_match:
        if 'phone' in method:
            matched_by_phone += 1
        elif 'name' in method:
            matched_by_name += 1
    else:
        unmatched += 1

# ---- Output ----
out_path = os.path.join(DATA_DIR, 'customer_linkage.csv')
with open(out_path, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=['rid_user_id', 'rid_name', 'rid_rating', 'rid_phone',
                                       'rid_participations', 'mp_code', 'mp_name', 'confidence', 'method'])
    w.writeheader()
    w.writerows(linkage)

print(f'\nWritten: {out_path}')

# ---- Report ----
total = len(linkage)
matched = total - unmatched
print(f'\n{"="*60}')
print(f'CROSS-MATCHING REPORT')
print(f'{"="*60}')
print(f'Racket.ID members:  {total}')
print(f'MATCHED to MP:      {matched} ({matched/total*100:.1f}%)')
print(f'  By phone:         {matched_by_phone}')
print(f'  By name:          {matched_by_name}')
print(f'Unmatched:          {unmatched}')

# Confidence distribution
conf_dist = Counter(r['confidence'] for r in linkage if r['confidence'] > 0)
print(f'\nConfidence distribution:')
for c, cnt in sorted(conf_dist.items(), reverse=True):
    print(f'  {c}%: {cnt}')

# Top matched with high participation
active = sorted([r for r in linkage if r['mp_code'] and r['rid_participations'] > 0],
                key=lambda x: -x['rid_participations'])
print(f'\nTop 10 most active matched members:')
for r in active[:10]:
    print(f'  {r["rid_name"]} → {r["mp_name"]} | {r["rid_participations"]} events | conf={r["confidence"]}%')

# Unmatched with high participation
unm_active = sorted([r for r in linkage if not r['mp_code'] and r['rid_participations'] > 0],
                     key=lambda x: -x['rid_participations'])
print(f'\nTop unmatched active players (need manual review):')
for r in unm_active[:10]:
    print(f'  {r["rid_name"]} | {r["rid_participations"]} events | phone: {r["rid_phone"]}')
