// Bepaalt of een lp een originele persing is op basis van jaar (origineel) en
// uitgavejaar (deze persing).
//   - releaseYear ontbreekt of gelijk aan year  -> origineel (true)
//   - releaseYear verschilt van year            -> heruitgave (false)
//   - geen enkel jaar bekend                     -> onbekend (null)
export function isOriginalPressing(r) {
  const y = r && r.year != null && r.year !== '' ? Number(r.year) : null;
  const ry = r && r.releaseYear != null && r.releaseYear !== '' ? Number(r.releaseYear) : null;
  if (y == null && ry == null) return null;
  if (y != null && ry != null && y !== ry) return false;
  return true;
}

// 'Ja' | 'Nee' | null
export function originalLabel(r) {
  const v = isOriginalPressing(r);
  return v == null ? null : v ? 'Ja' : 'Nee';
}
