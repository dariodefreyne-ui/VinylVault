// Helpers rond het "collectie-eigenaar" model.
//
// Een collectie wordt geïdentificeerd door een LABEL (string, bv. 'dario', 'papa',
// of de displayName van een nieuwe gebruiker) en optioneel een UID (Firebase uid).
//
// Records dragen:
//   owner:    label-string (legacy + nieuw)
//   ownerUid: Firebase uid of null (null voor geïmporteerde/legacy records)
//
// Zo blijven bestaande records werken zonder destructieve migratie, terwijl
// nieuwe gebruikers hun eigen collectie kunnen beheren.

/** Het label dat bij een gebruiker hoort (voor weergave en owner-matching). */
export function ownerLabelOf(user) {
  if (!user) return '';
  return user.collectionLabel || user.displayName || user.email || '';
}

/**
 * Bepaalt of een record bij een gegeven gebruiker hoort.
 * Matcht op ownerUid (nieuw) OF op owner-label === collectionLabel (legacy).
 */
export function isOwnRecord(record, uid, collectionLabel) {
  if (!record) return false;
  if (uid && record.ownerUid && record.ownerUid === uid) return true;
  if (collectionLabel) {
    const label = (record.owner || '').toLowerCase();
    if (label && label === collectionLabel.toLowerCase()) return true;
  }
  return false;
}

/**
 * Bouwt de lijst van selecteerbare eigenaren op uit geregistreerde gebruikers
 * gecombineerd met legacy owner-labels die in records voorkomen.
 *
 * Resultaat: [{ label, uid }] — uid is null voor legacy labels zonder account.
 * Gededupliceerd op lowercased label; een match mét uid wint van een legacy label.
 */
export function buildOwnerOptions(users = [], records = []) {
  const byKey = new Map();

  for (const u of users) {
    const label = ownerLabelOf(u);
    if (!label) continue;
    const key = label.toLowerCase();
    byKey.set(key, { label, uid: u.id || u.uid || null });
  }

  for (const r of records) {
    const label = (r.owner || '').trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (!byKey.has(key)) {
      byKey.set(key, { label, uid: null });
    }
  }

  return [...byKey.values()].sort((a, b) =>
    a.label.localeCompare(b.label, 'nl', { sensitivity: 'base' })
  );
}
