export function filterRecords(records, { search, owner, genre } = {}) {
  let list = records;

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (r) =>
        (r.artist || '').toLowerCase().includes(q) ||
        (r.title || '').toLowerCase().includes(q)
    );
  }

  if (owner) {
    list = list.filter((r) => (r.owner || '').toLowerCase() === owner.toLowerCase());
  }

  if (genre) {
    list = list.filter((r) => Array.isArray(r.genres) && r.genres.includes(genre));
  }

  return list;
}
