/**
 * V7 Padel — Racket.ID Firestore live data loader.
 * Fetches tournaments, participants, and member profiles directly from Firebase REST API.
 * No ETL delay — always fresh data.
 */
window.RacketID = (function() {
  const BASE = 'https://firestore.googleapis.com/v1/projects/racket-id/databases/(default)/documents';
  // V7 Padel groups in Racket.ID. Антальская группа — основная; UA — украинские корзинки.
  const GROUPS = [
    { id: 'pQ5uN5ZErqRufJ', name: 'V7 Antalya', club: 'antalya' },
    { id: 'JMEPce8MA6ZAwm', name: 'V7 UA',      club: 'ua' },
  ];

  // Cache to avoid re-fetching profiles
  const _profileCache = {};
  let _tournamentsCache = null;

  function fval(fields, key) {
    if (!fields || !fields[key]) return '';
    const v = fields[key];
    return v.stringValue ?? v.integerValue ?? v.doubleValue ?? v.booleanValue ?? v.timestampValue ?? '';
  }

  function fmap(fields, key) {
    if (!fields || !fields[key]) return {};
    const v = fields[key];
    if (v.mapValue) return v.mapValue.fields || {};
    return {};
  }

  function farray(fields, key) {
    if (!fields || !fields[key]) return [];
    const v = fields[key];
    if (v.arrayValue && v.arrayValue.values) return v.arrayValue.values.map(x => x.stringValue || '').filter(Boolean);
    return [];
  }

  async function firestoreQuery(collection, field, value, pageSize) {
    pageSize = pageSize || 20;
    const allDocs = [];
    let offset = 0;
    while (true) {
      const query = {
        structuredQuery: {
          from: [{ collectionId: collection }],
          where: { fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: { stringValue: value } } },
          limit: pageSize,
          offset: offset
        }
      };
      const resp = await fetch(BASE + ':runQuery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });
      const results = await resp.json();
      const docs = results.filter(r => r.document);
      allDocs.push(...docs);
      if (docs.length < pageSize) break;
      offset += pageSize;
      if (offset > 1000) break;
    }
    return allDocs;
  }

  /**
   * Load all tournaments for V7 group. Returns array of tournament objects.
   * Cached after first call — use forceRefresh=true to bypass.
   */
  async function loadTournaments(forceRefresh) {
    if (_tournamentsCache && !forceRefresh) return _tournamentsCache;

    // Fetch tournaments from ALL V7 groups in parallel
    const allDocs = await Promise.all(
      GROUPS.map(g => firestoreQuery('IProducts', 'group', g.id, 20).then(docs => ({ group: g, docs })))
    );
    const tournaments = [];

    allDocs.forEach(({ group, docs }) => {
    docs.forEach(p => {
      const doc = p.document;
      const docId = doc.name.split('/').pop();
      const f = doc.fields || {};

      const title = String(fval(f, 'title') || '');
      const status = fval(f, 'status');
      const dateRaw = fval(f, 'date');
      const endTime = fval(f, 'endTime');
      const sport = fval(f, 'sport');
      const doubles = fval(f, 'doubles');
      const slots = parseInt(fval(f, 'slots')) || 0;
      const clubName = fval(f, 'clubName');

      // Participants: from users map (with joinDate from registration) or _users array
      const usersMap = fmap(f, 'users');
      let participantIds = Object.keys(usersMap);
      const registrations = {}; // userId → Date (joinDate)
      participantIds.forEach(uid => {
        const val = usersMap[uid];
        // Structure: user → mapValue.fields.registration → mapValue.fields.{id} → mapValue.fields.joinDate
        if (val && val.mapValue && val.mapValue.fields) {
          const regField = val.mapValue.fields.registration;
          if (regField && regField.mapValue && regField.mapValue.fields) {
            const regEntries = regField.mapValue.fields;
            // Take first registration entry (there's usually one with a random ID)
            const firstKey = Object.keys(regEntries)[0];
            if (firstKey) {
              const entry = regEntries[firstKey];
              if (entry && entry.mapValue && entry.mapValue.fields && entry.mapValue.fields.joinDate) {
                const jd = entry.mapValue.fields.joinDate.stringValue;
                if (jd) { const d = new Date(jd.replace(' ', 'T')); if (!isNaN(d)) registrations[uid] = d; }
              }
            }
          }
        }
      });
      if (!participantIds.length) {
        participantIds = farray(f, '_users');
      }

      // Gameplan state
      const gpFields = fmap(f, 'gameplan');
      const gpState = fval(gpFields, 'state');

      // Parse date
      const dateStr = String(dateRaw || '').slice(0, 19);
      const dt = dateStr ? new Date(dateStr.replace(' ', 'T')) : null;

      if (status === 'program') return; // skip templates
      if (!dt || isNaN(dt.getTime())) return;

      // Classify type (special first — takes priority, then rated, korzinka, default nonrated)
      const tu = title.toUpperCase();
      const tl = title.toLowerCase();
      let type = 'nonrated';
      // Украинские корзинки (V7 UA) — отдельный тип
      const korzinkaMatch = title.match(/(\d)\s*[кКKk][оo]р[зz]ин/);
      if (korzinkaMatch || tl.includes('корзин') || tl.includes('korzin')) {
        type = 'korzinka';
      }
      if (tu.includes('RANKED') || tu.includes('AMERICANO 1100') || tu.includes('BEGINNERS') || tu.includes('LADY')) type = 'rated';
      if (tu.includes('PREMIER') || tu.includes('MAJOR') || tu.includes('KIDS') || tu.includes('JUNIOR') || tu.includes('EVENT WEEKEND') || tu.includes('PADEL VS')) type = 'special';

      // Клуб turnира (для фильтров)
      const tournamentClub = group.club;

      // Clean title from emojis
      const cleanTitle = title.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();

      tournaments.push({
        id: docId,
        title: cleanTitle,
        titleRaw: title,
        type,
        korzinkaLevel: korzinkaMatch ? parseInt(korzinkaMatch[1]) : null, // 1..5 for UA korzinkas
        club: tournamentClub,       // 'antalya' or 'ua'
        groupName: group.name,      // 'V7 Antalya' or 'V7 UA'
        date: dt,
        dateStr: dt.toISOString().slice(0, 10),
        endTime,
        slots,
        participants: participantIds.length,
        participantIds,
        registrations, // userId → Date (if available from Firestore)
        hasRegDates: Object.keys(registrations).length > 0,
        fillPct: slots > 0 ? Math.round(participantIds.length / slots * 100) : 0,
        state: (gpState || '').toLowerCase(),
      });
    });
    }); // end allDocs.forEach

    tournaments.sort((a, b) => b.date - a.date);
    _tournamentsCache = tournaments;
    return tournaments;
  }

  /**
   * Fetch a user profile by ID. Cached.
   */
  async function loadProfile(userId) {
    if (_profileCache[userId]) return _profileCache[userId];
    try {
      const resp = await fetch(BASE + '/IUserProfiles/' + userId);
      const doc = await resp.json();
      const f = doc.fields || {};
      const profile = {
        user_id: userId,
        name: fval(f, 'name') || userId,
        rating: parseFloat(fval(f, 'padelRating')) || 0,
        phone: fval(f, 'phoneNumber'),
        email: fval(f, 'email'),
        gender: fval(f, 'gender'),
      };
      _profileCache[userId] = profile;
      return profile;
    } catch (e) {
      return { user_id: userId, name: userId, rating: 0, phone: '', email: '', gender: '' };
    }
  }

  /**
   * Load profiles for an array of user IDs. Returns array of profiles.
   * Fetches in parallel batches of 10.
   */
  async function loadProfiles(userIds) {
    userIds = [...new Set(userIds)]; // deduplicate
    const results = [];
    const toFetch = userIds.filter(id => !_profileCache[id]);
    const cached = userIds.filter(id => _profileCache[id]).map(id => _profileCache[id]);

    // Fetch in batches of 10
    for (let i = 0; i < toFetch.length; i += 10) {
      const batch = toFetch.slice(i, i + 10);
      const profiles = await Promise.all(batch.map(id => loadProfile(id)));
      results.push(...profiles);
    }

    return [...cached, ...results].sort((a, b) => b.rating - a.rating);
  }

  /**
   * Get Racket.ID link for a tournament
   */
  function tournamentUrl(productId) {
    return 'https://racket.id/events/' + productId;
  }

  return { loadTournaments, loadProfile, loadProfiles, tournamentUrl, GROUPS };
})();
