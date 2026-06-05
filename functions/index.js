const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

initializeApp();

exports.notifyAdminOnNewUser = onDocumentCreated('users/{uid}', async (event) => {
  const db = getFirestore();
  const data = event.data.data();

  const name = data.displayName || 'Onbekend';
  const email = data.email || 'Geen e-mail';

  const configDoc = await db.collection('config').doc('app').get();
  const adminEmail = configDoc.data()?.adminEmail || 'dario.de.freyne@gmail.com';

  await db.collection('mail').add({
    to: adminEmail,
    message: {
      subject: 'VinylVault — Nieuwe gebruiker wacht op activatie',
      html: `
        <p>Nieuwe gebruiker geregistreerd:</p>
        <p><strong>Naam:</strong> ${name}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <p>Log in als admin om de rol toe te wijzen.</p>
      `,
    },
  });
});

exports.deleteAuthUser = onCall(async (request) => {
  const callerUid = request.auth?.uid;
  if (!callerUid) throw new HttpsError('unauthenticated', 'Niet geauthenticeerd');

  const db = getFirestore();
  const callerDoc = await db.collection('users').doc(callerUid).get();
  if (callerDoc.data()?.role !== 'admin') throw new HttpsError('permission-denied', 'Geen toegang');

  await getAuth().deleteUser(request.data.uid);
  return { success: true };
});

// ── Phase 3: metadata-lookup (Discogs met MusicBrainz/Cover Art Archive fallback) ──

const USER_AGENT = 'VinylVault/1.0 (https://vinylvault-7b7f5.web.app)';

async function fetchJson(url, headers = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, ...headers } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status} voor ${url}`);
  return res.json();
}

function cleanArtistName(name) {
  return (name || '').replace(/\s*\(\d+\)\s*$/, '').trim();
}

function pickFormat(descriptions = [], fallback = '') {
  const set = descriptions.map((d) => String(d).toLowerCase());
  if (set.some((d) => d.includes('lp'))) return 'LP';
  if (set.some((d) => d.includes('box'))) return 'Box Set';
  for (const size of ['7"', '10"', '12"']) {
    if (set.some((d) => d.includes(size.replace('"', '')))) return size;
  }
  return fallback || '';
}

function yearFromDate(value) {
  if (!value) return null;
  const m = String(value).match(/\d{4}/);
  return m ? parseInt(m[0], 10) : null;
}

// ── Verificatie-helpers: voorkomt dat een korte/ambigue catalogusnummer (bv. 88562)
// aan een verkeerde release gelinkt wordt. We checken of de artiest overeenkomt. ──
function normText(s) {
  return (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
function tokenSet(s) {
  return new Set(normText(s).split(' ').filter((t) => t.length > 1));
}
// Aandeel van de verwachte tokens dat in de tekst voorkomt (0..1).
function tokenOverlap(expected, text) {
  const e = tokenSet(expected);
  if (!e.size) return 1; // niets te verifiëren
  const c = tokenSet(text);
  let hit = 0;
  for (const t of e) if (c.has(t)) hit += 1;
  return hit / e.size;
}
// Escapet Lucene-speciale tekens voor MusicBrainz (titels met :, -, (), / …).
function luceneEscape(s) {
  return String(s).replace(/([+\-!(){}[\]^"~*?:\\/]|&&|\|\|)/g, ' ').replace(/\s+/g, ' ').trim();
}

const ARTIST_MATCH_THRESHOLD = 0.5;

function normalizeDiscogs(rel, masterYear) {
  const artist = (rel.artists || []).map((a) => cleanArtistName(a.name)).join(', ');
  const firstLabel = (rel.labels || [])[0] || {};
  const genres = [...new Set([...(rel.genres || []), ...(rel.styles || [])])];
  const barcodeId = (rel.identifiers || []).find(
    (i) => (i.type || '').toLowerCase() === 'barcode'
  );
  const firstFormat = (rel.formats || [])[0] || {};
  const releaseYear = yearFromDate(rel.released) || rel.year || null;
  return {
    source: 'discogs',
    artist: artist || (rel.title || '').split(' - ')[0] || '',
    title: rel.title || '',
    label: firstLabel.name || '',
    catalogNumber: firstLabel.catno || '',
    year: masterYear || rel.year || null,
    releaseYear,
    country: rel.country || '',
    format: pickFormat(firstFormat.descriptions, firstFormat.name),
    genres,
    coverImageUrl: (rel.images || [])[0]?.uri || null,
    barcode: barcodeId ? barcodeId.value : '',
    tracklist: (rel.tracklist || [])
      .map((t) => [t.position, t.title].filter(Boolean).join(' ').trim())
      .filter(Boolean),
  };
}

async function tryDiscogsResults(results, token) {
  for (const candidate of results) {
    const sep = candidate.resource_url.includes('?') ? '&' : '?';
    const rel = await fetchJson(`${candidate.resource_url}${sep}token=${encodeURIComponent(token)}`);
    if (!rel) {
      console.log(`lookupDiscogs: 404 op ${candidate.resource_url}, volgende proberen`);
      continue;
    }

    let masterYear = null;
    if (rel.master_id) {
      try {
        const master = await fetchJson(
          `https://api.discogs.com/masters/${rel.master_id}?token=${encodeURIComponent(token)}`
        );
        masterYear = master?.year || null;
      } catch {
        // master niet ophaalbaar — geen probleem
      }
    }
    return normalizeDiscogs(rel, masterYear);
  }
  return null;
}

async function lookupDiscogs({ barcode, catalogNumber, query, artist, title }, token) {
  const base = { token, per_page: '10' };

  // Zoekopdrachten in volgorde van nauwkeurigheid.
  // Bij catalogusnummer: eerst catno + artiest (sterk), dan catno alleen, dan brede q.
  const searches = [];
  if (barcode) searches.push({ ...base, barcode });
  if (catalogNumber) {
    if (artist) searches.push({ ...base, catno: catalogNumber, artist });
    searches.push({ ...base, catno: catalogNumber });
    searches.push({ ...base, q: catalogNumber });
  }
  if (query) searches.push({ ...base, q: query });

  for (const searchParams of searches) {
    // Barcode is uniek → vertrouwen. catno/q is ambigu → verifiëren op artiest.
    const ambiguous = !searchParams.barcode;
    const params = new URLSearchParams(searchParams);
    const search = await fetchJson(`https://api.discogs.com/database/search?${params}`);
    if (!search) continue;

    let results = (search.results || []).filter((r) => r.resource_url);
    if (!results.length) continue;

    // Pre-filter op artiest (zoekresultaat-titel = "Artiest - Album").
    if (ambiguous && artist) {
      const matching = results.filter((r) => tokenOverlap(artist, r.title) >= ARTIST_MATCH_THRESHOLD);
      if (!matching.length) continue; // geen kandidaat met juiste artiest → niet gokken
      results = matching;
    }

    const found = await tryDiscogsResults(results, token);
    if (!found) continue;

    // Eindverificatie: bij ambigue zoek moet de artiest van de release kloppen.
    if (ambiguous && artist && tokenOverlap(artist, found.artist) < ARTIST_MATCH_THRESHOLD) {
      continue;
    }
    return found;
  }

  return null;
}

async function lookupMusicBrainz({ barcode, catalogNumber, query, artist }) {
  const ambiguous = !barcode;
  const artistClause = artist ? ` AND artist:(${luceneEscape(artist)})` : '';
  let q;
  if (barcode) q = `barcode:${luceneEscape(barcode)}`;
  else if (catalogNumber) q = `catno:${luceneEscape(catalogNumber)}${artistClause}`;
  else if (query) q = `${luceneEscape(query)}${artistClause}`;
  else return null;

  const search = await fetchJson(
    `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(q)}&fmt=json&limit=5`
  );
  if (!search) return null;

  // Bij ambigue zoek: kies de eerste release waarvan de artiest klopt.
  const releases = search.releases || [];
  const first = ambiguous && artist
    ? releases.find((rl) => {
        const credit = (rl['artist-credit'] || []).map((c) => c.name || (c.artist && c.artist.name) || '').join(' ');
        return tokenOverlap(artist, credit) >= ARTIST_MATCH_THRESHOLD;
      })
    : releases[0];
  if (!first) return null;

  const rel = await fetchJson(
    `https://musicbrainz.org/ws/2/release/${first.id}?inc=artist-credits+labels+recordings&fmt=json`
  );
  if (!rel) return null;

  const artistName = (rel['artist-credit'] || [])
    .map((c) => (typeof c === 'string' ? c : c.name + (c.joinphrase || '')))
    .join('')
    .trim();
  const labelInfo = (rel['label-info'] || [])[0] || {};
  const media = (rel.media || [])[0] || {};
  const tracklist = (media.tracks || [])
    .map((t) => [t.number, t.title].filter(Boolean).join(' ').trim())
    .filter(Boolean);

  return {
    source: 'musicbrainz',
    artist: artistName,
    title: rel.title || '',
    label: labelInfo.label?.name || '',
    catalogNumber: labelInfo['catalog-number'] || '',
    year: rel.date ? parseInt(String(rel.date).slice(0, 4), 10) || null : null,
    releaseYear: rel.date ? parseInt(String(rel.date).slice(0, 4), 10) || null : null,
    country: rel.country || '',
    format: media.format || '',
    genres: (rel.genres || []).map((g) => g.name),
    coverImageUrl: `https://coverartarchive.org/release/${first.id}/front-500`,
    barcode: rel.barcode || barcode || '',
    tracklist,
  };
}

exports.lookupRelease = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Niet geauthenticeerd');

  const barcode = (request.data?.barcode || '').toString().trim();
  const catalogNumber = (request.data?.catalogNumber || '').toString().trim();
  const query = (request.data?.query || '').toString().trim();
  const artist = (request.data?.artist || '').toString().trim();
  const title = (request.data?.title || '').toString().trim();
  if (!barcode && !catalogNumber && !query) {
    throw new HttpsError('invalid-argument', 'Geef een barcode, catalogusnummer of zoekterm.');
  }

  const params = { barcode, catalogNumber, query, artist, title };
  const token = process.env.DISCOGS_TOKEN;
  const matchedBy = barcode ? 'barcode' : catalogNumber ? 'catalogusnummer' : 'artiest + titel';

  // Bronnen apart en veilig: een fout bij één lp mag niet als "internal" naar de
  // client (dat lijkt op een deploy-probleem). Geen match → found:false.
  if (token) {
    try {
      const discogs = await lookupDiscogs(params, token);
      if (discogs) return { found: true, result: { ...discogs, matchedBy } };
    } catch (err) {
      console.error('lookupRelease Discogs error:', err.message);
    }
  }
  try {
    const mb = await lookupMusicBrainz(params);
    if (mb) return { found: true, result: { ...mb, matchedBy } };
  } catch (err) {
    console.error('lookupRelease MusicBrainz error:', err.message);
  }
  return { found: false };
});
