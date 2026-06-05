import { originalLabel } from './records.js';

// xlsx wordt dynamisch geladen (lazy) zodat de grote library niet in de
// initiële bundle zit — enkel bij effectief importeren/exporteren.
let xlsxPromise = null;
function getXLSX() {
  if (!xlsxPromise) xlsxPromise = import('xlsx');
  return xlsxPromise;
}

export const COLUMN_MAPPINGS = {
  artist: ['artist', 'artiest', 'artist name', 'band', 'uitvoerder'],
  title: ['title', 'titel', 'album', 'albumtitel'],
  owner: ['owner', 'eigenaar', 'wie', 'username', 'gebruiker'],
  purchasePrice: ['price', 'prijs', 'aankoopprijs', 'cost', 'waarde'],
  label: ['label', 'platenlabel'],
  year: ['year', 'jaar', 'release year', 'releasejaar'],
  releaseYear: ['uitgavejaar', 'persing', 'pressing', 'reissue', 'heruitgave'],
  country: ['country', 'land'],
  format: ['format', 'formaat', 'type'],
  catalogNumber: ['catalog', 'catalogus', 'catalogusnummer', 'catalog number', 'catno', 'cat no', 'cat. no', 'cat nr', 'catalognumber', 'labelnummer'],
  barcode: ['barcode', 'ean', 'upc', 'streepjescode', 'bar code', 'ean13', 'ean-13'],
  condition: ['condition', 'conditie', 'staat'],
  location: ['locatie', 'kast', 'location', 'plek', 'vak'],
  notes: ['notes', 'notities', 'opmerkingen', 'commentaar'],
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

    reader.onload = async (e) => {
      try {
        const XLSX = await getXLSX();
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

  // Eigenaar wordt overgenomen zoals in het bestand (geen hardcoded namen).
  const ownerRaw = get('owner');
  if (ownerRaw) result.owner = ownerRaw;

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

  const releaseYearRaw = get('releaseYear');
  if (releaseYearRaw !== undefined) {
    const parsed = parseInt(releaseYearRaw, 10);
    if (!isNaN(parsed)) result.releaseYear = parsed;
  }

  const country = get('country');
  if (country) result.country = country;

  const catalogNumber = get('catalogNumber');
  if (catalogNumber) result.catalogNumber = catalogNumber;

  const condition = get('condition');
  if (condition) result.condition = condition;

  const location = get('location');
  if (location) result.location = location;

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
export async function exportToExcel(records, filename = 'vinylvault-export.xlsx') {
  const XLSX = await getXLSX();
  const rows = records.map((r) => ({
    Artiest: r.artist || '',
    Titel: r.title || '',
    Eigenaar: r.owner || '',
    Aankoopprijs: r.purchasePrice != null ? r.purchasePrice : '',
    Label: r.label || '',
    Jaar: r.year || '',
    Uitgavejaar: r.releaseYear || '',
    Origineel: originalLabel(r) || '',
    Format: r.format || '',
    Barcode: r.barcode || '',
    Catalogusnummer: r.catalogNumber || '',
    Conditie: r.condition || '',
    'Locatie / kast': r.location || '',
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
