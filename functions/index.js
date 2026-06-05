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

async function lookupDiscogs({ barcode, catalogNumber, query }, token) {
  const base = { token, per_page: '5' };

  // Zoekopdrachten in volgorde van nauwkeurigheid.
  // Bij catalogusnummer: eerst exacte catno-search, dan brede q-search als fallback.
  // Zo vinden we ook oude platen zonder barcode waarbij Discogs catno inconsistent indexeert.
  const searches = [];
  if (barcode) searches.push({ ...base, barcode });
  if (catalogNumber) {
    searches.push({ ...base, catno: catalogNumber });
    searches.push({ ...base, q: catalogNumber }); // brede fallback voor inconsistente indexering
  }
  if (query) searches.push({ ...base, q: query });

  for (const searchParams of searches) {
    const params = new URLSearchParams(searchParams);
    const search = await fetchJson(`https://api.discogs.com/database/search?${params}`);
    if (!search) continue;

    const results = (search.results || []).filter((r) => r.resource_url);
    if (!results.length) continue; // geen resultaten — volgende zoekopdracht proberen

    const found = await tryDiscogsResults(results, token);
    if (found) return found;

    // Alle resource_urls waren 404 — minimale fallback op zoekresultaat zelf
    const first = results[0];
    console.log('lookupDiscogs: alle resource_urls faalden, fallback op zoekresultaat');
    return normalizeDiscogs({
      title: first.title,
      year: first.year,
      country: first.country,
      genres: first.genre,
      styles: first.style,
      labels: first.label ? [{ name: first.label[0], catno: first.catno }] : [],
      formats: first.format ? [{ descriptions: first.format }] : [],
      images: first.cover_image ? [{ uri: first.cover_image }] : [],
    }, null);
  }

  return null;
}

async function lookupMusicBrainz({ barcode, catalogNumber, query }) {
  let q;
  if (barcode) q = `barcode:${barcode}`;
  else if (catalogNumber) q = `catno:${catalogNumber}`;
  else if (query) q = `release:${query}`;
  else return null;

  const search = await fetchJson(
    `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(q)}&fmt=json&limit=5`
  );
  if (!search) return null;

  const first = (search.releases || [])[0];
  if (!first) return null;

  const rel = await fetchJson(
    `https://musicbrainz.org/ws/2/release/${first.id}?inc=artist-credits+labels+recordings&fmt=json`
  );
  if (!rel) return null;

  const artist = (rel['artist-credit'] || [])
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
    artist,
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
  if (!barcode && !catalogNumber && !query) {
    throw new HttpsError('invalid-argument', 'Geef een barcode, catalogusnummer of zoekterm.');
  }

  const params = { barcode, catalogNumber, query };
  const token = process.env.DISCOGS_TOKEN;
  const matchedBy = barcode ? 'barcode' : catalogNumber ? 'catalogusnummer' : 'artiest + titel';

  try {
    if (token) {
      const discogs = await lookupDiscogs(params, token);
      if (discogs) return { found: true, result: { ...discogs, matchedBy } };
    }
    const mb = await lookupMusicBrainz(params);
    if (mb) return { found: true, result: { ...mb, matchedBy } };
    return { found: false };
  } catch (err) {
    console.error('lookupRelease error:', err.message);
    if (token) {
      try {
        const mb = await lookupMusicBrainz(params);
        if (mb) return { found: true, result: { ...mb, matchedBy } };
      } catch (err2) {
        console.error('lookupRelease MusicBrainz fallback error:', err2.message);
      }
    }
    throw new HttpsError('internal', 'Metadata-lookup mislukt. Probeer later opnieuw.');
  }
});
