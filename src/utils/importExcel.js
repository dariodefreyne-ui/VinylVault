import * as XLSX from 'xlsx';

export const COLUMN_MAPPINGS = {
  artist: ['artist', 'artiest', 'artist name', 'band'],
  title: ['title', 'titel', 'album', 'albumtitel'],
  owner: ['owner', 'eigenaar', 'wie'],
  purchasePrice: ['price', 'prijs', 'aankoopprijs', 'cost'],
  label: ['label'],
  year: ['year', 'jaar', 'release year'],
  format: ['format', 'formaat', 'type'],
  barcode: ['barcode', 'ean'],
  notes: ['notes', 'notities', 'opmerkingen'],
};

/**
 * parseExcelFile(file)
 * Returns a Promise<array of row objects>.
 * Uses FileReader + XLSX.read() to parse .xlsx/.xls/.csv.
 * Returns array of raw row objects (header row as keys).
 */
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        resolve(rows);
      } catch (err) {
        reject(new Error('Kon bestand niet verwerken: ' + err.message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Bestand kon niet worden gelezen.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * sanitizeRow(row, mapping)
 * row: raw object from parseExcelFile
 * mapping: { artist: 'Artiest', title: 'Albumtitel', owner: 'Eigenaar', ... }
 * Returns cleaned record object.
 */
export function sanitizeRow(row, mapping) {
  function get(field) {
    const colName = mapping[field];
    if (!colName) return undefined;
    const val = row[colName];
    if (val === undefined || val === null) return undefined;
    const str = String(val).trim();
    return str === '' ? undefined : str;
  }

  const result = {};

  const artist = get('artist');
  if (artist) result.artist = artist;

  const title = get('title');
  if (title) result.title = title;

  const ownerRaw = get('owner');
  if (ownerRaw) {
    const ownerLower = ownerRaw.toLowerCase();
    if (ownerLower === 'dario') result.owner = 'Dario';
    else if (ownerLower === 'papa') result.owner = 'Papa';
    else result.owner = ownerRaw;
  }

  const priceRaw = get('purchasePrice');
  if (priceRaw !== undefined) {
    const parsed = parseFloat(String(priceRaw).replace(',', '.'));
    if (!isNaN(parsed)) result.purchasePrice = parsed;
  }

  const label = get('label');
  if (label) result.label = label;

  const yearRaw = get('year');
  if (yearRaw !== undefined) {
    const parsed = parseInt(yearRaw, 10);
    if (!isNaN(parsed)) result.year = parsed;
  }

  const format = get('format');
  if (format) result.format = format;

  const barcode = get('barcode');
  if (barcode) result.barcode = barcode;

  const notes = get('notes');
  if (notes) result.notes = notes;

  return result;
}

/**
 * exportToExcel(records, filename)
 * Exports an array of record objects to an .xlsx file and triggers download.
 */
export function exportToExcel(records, filename = 'vinylvault-export.xlsx') {
  const rows = records.map((r) => ({
    Artiest: r.artist || '',
    Titel: r.title || '',
    Eigenaar: r.owner || '',
    Aankoopprijs: r.purchasePrice != null ? r.purchasePrice : '',
    Label: r.label || '',
    Jaar: r.year || '',
    Format: r.format || '',
    Barcode: r.barcode || '',
    Catalogusnummer: r.catalogNumber || '',
    Conditie: r.condition || '',
    Land: r.country || '',
    Genres: Array.isArray(r.genres) ? r.genres.join(', ') : '',
    Aankoopdatum: r.purchaseDate || '',
    Notities: r.notes || '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Collectie');
  XLSX.writeFile(wb, filename);
}

/**
 * autoDetectMapping(headers)
 * headers: array of column name strings from the Excel file.
 * Returns mapping object: { artist: 'ActualColumnName', ... }
 * Matches by lowercased contains check against COLUMN_MAPPINGS.
 */
export function autoDetectMapping(headers) {
  const mapping = {};

  for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
    for (const header of headers) {
      const headerLower = header.toLowerCase().trim();
      const matched = aliases.some((alias) => headerLower.includes(alias));
      if (matched) {
        mapping[field] = header;
        break;
      }
    }
  }

  return mapping;
}
