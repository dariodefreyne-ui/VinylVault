import { useState, useRef } from 'react';
import { useOwnerOptions } from '../../hooks/useOwnerOptions.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useToast } from '../ui/Toast.jsx';
import { lookupRelease } from '../../firebase/lookup.js';
import BarcodeScanner from './BarcodeScanner.jsx';
import Icon from '../ui/Icon.jsx';
import { originalLabel } from '../../utils/records.js';
import { colors, radius, buttonStyle } from '../../styles/tokens.js';

const FORMAT_OPTIONS = ['LP', '7"', '10"', '12"', 'Box Set', 'Andere'];

const inputStyle = {
  width: '100%',
  backgroundColor: colors.bgCard,
  border: `1px solid ${colors.borderColor}`,
  borderRadius: radius.sm,
  padding: '8px 12px',
  color: colors.textPrimary,
  fontSize: '14px',
  boxSizing: 'border-box',
  outline: 'none',
};

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: colors.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '6px',
};

const sectionHeaderStyle = {
  fontSize: '15px',
  fontWeight: 600,
  color: colors.textPrimary,
  borderBottom: `1px solid ${colors.borderColor}`,
  paddingBottom: '8px',
  marginBottom: '16px',
  marginTop: '0',
};

const fieldGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: '16px',
  marginBottom: '16px',
};

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
};

function Field({ label, children }) {
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = 'text', ...rest }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      style={inputStyle}
      {...rest}
    />
  );
}

function Select({ value, onChange, children, ...rest }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{ ...inputStyle, cursor: 'pointer' }}
      {...rest}
    >
      {children}
    </select>
  );
}

function GenreTagInput({ genres, onChange }) {
  const [inputValue, setInputValue] = useState('');

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed && !genres.includes(trimmed)) {
        onChange([...genres, trimmed]);
      }
      setInputValue('');
    }
  }

  function removeGenre(genre) {
    onChange(genres.filter((g) => g !== genre));
  }

  const chipContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: genres.length > 0 ? '8px' : '0',
  };

  const chipStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: radius.sm,
    backgroundColor: 'rgba(229,57,53,0.15)',
    color: colors.accentRed,
    fontSize: '12px',
    fontWeight: 500,
  };

  const removeChipBtnStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: colors.accentRed,
    fontSize: '14px',
    lineHeight: 1,
    padding: '0',
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Typ genre en druk Enter"
        style={inputStyle}
      />
      {genres.length > 0 && (
        <div style={chipContainerStyle}>
          {genres.map((g) => (
            <span key={g} style={chipStyle}>
              {g}
              <button
                type="button"
                style={removeChipBtnStyle}
                onClick={() => removeGenre(g)}
                aria-label={`Verwijder ${g}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ImagePreview({ file, url }) {
  const src = file ? URL.createObjectURL(file) : url;
  if (!src) return null;
  return (
    <img
      src={src}
      alt="Preview"
      style={{
        marginTop: '8px',
        maxWidth: '160px',
        maxHeight: '160px',
        borderRadius: radius.sm,
        objectFit: 'cover',
        border: `1px solid ${colors.borderColor}`,
      }}
    />
  );
}

export default function RecordForm({ initialData = {}, onSubmit, onCancel, loading }) {
  const ownerOptions = useOwnerOptions();
  const { userDoc } = useAuth();
  // Standaard-eigenaar = de huidige gebruiker (geen hardcoded naam).
  const myOwnerLabel = userDoc?.collectionLabel || userDoc?.displayName || '';
  const [artist, setArtist] = useState(initialData.artist || '');
  const [title, setTitle] = useState(initialData.title || '');
  const [owner, setOwner] = useState(initialData.owner || myOwnerLabel);
  const [price, setPrice] = useState(
    initialData.purchasePrice != null ? String(initialData.purchasePrice) : ''
  );
  const [quantity, setQuantity] = useState(initialData.quantity != null ? String(initialData.quantity) : '1');
  const [purchaseDate, setPurchaseDate] = useState(initialData.purchaseDate || '');

  const [label, setLabel] = useState(initialData.label || '');
  const [year, setYear] = useState(initialData.year != null ? String(initialData.year) : '');
  const [releaseYear, setReleaseYear] = useState(
    initialData.releaseYear != null ? String(initialData.releaseYear) : ''
  );
  const [country, setCountry] = useState(initialData.country || '');
  const [format, setFormat] = useState(initialData.format || 'LP');
  const [genres, setGenres] = useState(initialData.genres || []);
  const [catalogNumber, setCatalogNumber] = useState(initialData.catalogNumber || '');
  const [barcode, setBarcode] = useState(initialData.barcode || '');
  const [condition, setCondition] = useState(initialData.condition || '');
  const [location, setLocation] = useState(initialData.location || '');
  const [tracklist, setTracklist] = useState(
    Array.isArray(initialData.tracklist) ? initialData.tracklist : []
  );

  const [coverFile, setCoverFile] = useState(null);
  const [coverImageUrl, setCoverImageUrl] = useState(initialData.coverImageUrl || null);
  const [coverError, setCoverError] = useState('');
  const [extraFiles, setExtraFiles] = useState([]);

  const [notes, setNotes] = useState(initialData.notes || '');

  const [looking, setLooking] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  const showToast = useToast();
  const coverInputRef = useRef(null);
  const extraInputRef = useRef(null);

  function applyResult(r) {
    if (!artist && r.artist) setArtist(r.artist);
    if (!title && r.title) setTitle(r.title);
    if (!label && r.label) setLabel(r.label);
    if (!year && r.year) setYear(String(r.year));
    if (!releaseYear && r.releaseYear) setReleaseYear(String(r.releaseYear));
    if (!country && r.country) setCountry(r.country);
    if (r.format && FORMAT_OPTIONS.includes(r.format)) setFormat(r.format);
    if (genres.length === 0 && Array.isArray(r.genres) && r.genres.length > 0) setGenres(r.genres);
    if (!catalogNumber && r.catalogNumber) setCatalogNumber(r.catalogNumber);
    if (!barcode && r.barcode) setBarcode(r.barcode);
    if (tracklist.length === 0 && Array.isArray(r.tracklist) && r.tracklist.length > 0) setTracklist(r.tracklist);
    if (!coverImageUrl && !coverFile && r.coverImageUrl) setCoverImageUrl(r.coverImageUrl);
  }

  async function doLookup(params) {
    setLooking(true);
    try {
      const res = await lookupRelease(params);
      if (res.found && res.result) {
        applyResult(res.result);
        const via = res.result.matchedBy ? ` op ${res.result.matchedBy}` : '';
        showToast(`Metadata gevonden via ${res.result.source}${via}.`, 'success');
      } else {
        showToast('Geen metadata gevonden. Vul de gegevens handmatig in.', 'error');
      }
    } catch (err) {
      console.error('RecordForm: lookup failed', err);
      const msg = err?.code === 'functions/internal' || err?.message === 'internal'
        ? 'Kon de metadata-service niet bereiken. Is de Cloud Function gedeployed? Probeer later opnieuw.'
        : 'Metadata-lookup mislukt. Probeer later opnieuw.';
      showToast(msg, 'error');
    } finally {
      setLooking(false);
    }
  }

  function handleLookup() {
    const base = barcode.trim()
      ? { barcode: barcode.trim() }
      : catalogNumber.trim()
      ? { catalogNumber: catalogNumber.trim() }
      : artist.trim() || title.trim()
      ? { query: `${artist} ${title}`.trim() }
      : null;
    if (!base) {
      showToast('Vul eerst een barcode, catalogusnummer of artiest/titel in.', 'error');
      return;
    }
    // Artiest/titel meesturen zodat de server ambigue matches (bv. korte catalogusnummers) kan verifiëren.
    doLookup({ ...base, artist: artist.trim(), title: title.trim() });
  }

  function handleScanResult(value) {
    setScanOpen(false);
    setBarcode(value);
    doLookup({ barcode: value, artist: artist.trim(), title: title.trim() });
  }

  function handleCoverChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setCoverError('Bestand is groter dan 5MB.');
      setCoverFile(null);
      return;
    }
    setCoverError('');
    setCoverFile(file);
  }

  function handleExtraChange(e) {
    const files = Array.from(e.target.files).slice(0, 3);
    setExtraFiles(files);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const matched = ownerOptions.find(
      (o) => o.label.toLowerCase() === owner.toLowerCase()
    );
    onSubmit({
      artist,
      title,
      owner,
      ownerUid: matched ? matched.uid : null,
      purchasePrice: price !== '' ? parseFloat(price) : null,
      quantity: quantity !== '' ? parseInt(quantity, 10) : 1,
      purchaseDate,
      label,
      year: year !== '' ? parseInt(year, 10) : null,
      releaseYear: releaseYear !== '' ? parseInt(releaseYear, 10) : null,
      country,
      format,
      genres,
      catalogNumber,
      barcode,
      condition,
      location,
      tracklist: tracklist.map((t) => t.trim()).filter(Boolean),
      coverFile,
      coverImageUrl,
      extraFiles,
      notes,
    });
  }

  const sectionWrapStyle = {
    marginBottom: '32px',
  };

  const actionBarStyle = {
    position: 'sticky',
    bottom: 0,
    backgroundColor: colors.bgCard,
    borderTop: `1px solid ${colors.borderColor}`,
    padding: '16px 0 12px',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '8px',
  };

  const fileInputLabelStyle = {
    display: 'inline-block',
    padding: '8px 14px',
    borderRadius: radius.sm,
    backgroundColor: colors.bgHover || '#242424',
    border: `1px solid ${colors.borderColor}`,
    color: colors.textSecondary,
    fontSize: '13px',
    cursor: 'pointer',
  };

  const lookupBarStyle = {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    alignItems: 'center',
    backgroundColor: colors.bgHover || '#242424',
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radius.md,
    padding: '12px 14px',
    marginBottom: '24px',
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Metadata-lookup (Phase 3) */}
      <div style={lookupBarStyle}>
        <span style={{ fontSize: '13px', color: colors.textSecondary, flex: '1 1 200px' }}>
          Vul automatisch aan via barcode of catalogusnummer.
        </span>
        <button
          type="button"
          style={buttonStyle('secondary')}
          onClick={handleLookup}
          disabled={looking}
        >
          {looking ? 'Zoeken…' : <><Icon name="search" size={15} /> Metadata ophalen</>}
        </button>
        <button
          type="button"
          style={buttonStyle('secondary')}
          onClick={() => setScanOpen(true)}
          disabled={looking}
        >
          <Icon name="camera" size={15} /> Scan barcode
        </button>
      </div>

      {/* Basisinfo */}
      <div style={sectionWrapStyle}>
        <h3 style={sectionHeaderStyle}>Basisinfo</h3>
        <div style={fieldGridStyle}>
          <Field label="Artiest *">
            <Input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              required
              placeholder="bijv. The Beatles"
            />
          </Field>
          <Field label="Albumtitel *">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="bijv. Abbey Road"
            />
          </Field>
          <Field label="Eigenaar *">
            <Select value={owner} onChange={(e) => setOwner(e.target.value)} required>
              {ownerOptions.length === 0 && <option value={owner}>{owner}</option>}
              {!ownerOptions.some((o) => o.label.toLowerCase() === owner.toLowerCase()) &&
                owner && <option value={owner}>{owner}</option>}
              {ownerOptions.map((o) => (
                <option key={o.label} value={o.label}>{o.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Aankoopprijs EUR">
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </Field>
          <Field label="Aantal">
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              placeholder="1"
            />
          </Field>
          <Field label="Aankoopdatum">
            <Input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Lp-details */}
      <div style={sectionWrapStyle}>
        <h3 style={sectionHeaderStyle}>Lp-details</h3>
        <div style={fieldGridStyle}>
          <Field label="Label">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="bijv. Apple Records"
            />
          </Field>
          <Field label="Jaar (origineel)">
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min="1900"
              max="2099"
              placeholder="bijv. 1969"
            />
          </Field>
          <Field label="Uitgavejaar (deze persing)">
            <Input
              type="number"
              value={releaseYear}
              onChange={(e) => setReleaseYear(e.target.value)}
              min="1900"
              max="2099"
              placeholder="bijv. 2015 (heruitgave)"
            />
          </Field>
          <Field label="Origineel (automatisch)">
            <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', color: colors.textSecondary, backgroundColor: colors.bgHover }}>
              {originalLabel({ year, releaseYear }) || '—'}
            </div>
          </Field>
          <Field label="Land">
            <Input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="bijv. UK"
            />
          </Field>
          <Field label="Format">
            <Select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="LP">LP</option>
              <option value='7"'>7"</option>
              <option value='10"'>10"</option>
              <option value='12"'>12"</option>
              <option value="Box Set">Box Set</option>
              <option value="Andere">Andere</option>
            </Select>
          </Field>
          <Field label="Catalogusnummer">
            <Input
              value={catalogNumber}
              onChange={(e) => setCatalogNumber(e.target.value)}
              placeholder="bijv. PCS 7088"
            />
          </Field>
          <Field label="Barcode">
            <Input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="bijv. 094638246824"
            />
          </Field>
          <Field label="Conditie">
            <Select value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value=""></option>
              <option value="Mint">Mint</option>
              <option value="Near Mint">Near Mint</option>
              <option value="VG+">VG+</option>
              <option value="VG">VG</option>
              <option value="Good">Good</option>
              <option value="Poor">Poor</option>
            </Select>
          </Field>
          <Field label="Locatie / kast">
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="bijv. Kast A — vak 3"
            />
          </Field>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <Field label="Genres">
            <GenreTagInput genres={genres} onChange={setGenres} />
          </Field>
        </div>
      </div>

      {/* Media */}
      <div style={sectionWrapStyle}>
        <h3 style={sectionHeaderStyle}>Media</h3>
        <div style={fieldGridStyle}>
          <Field label="Cover foto">
            <div>
              <label style={fileInputLabelStyle}>
                Kies bestand
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  style={{ display: 'none' }}
                />
              </label>
              {coverError && (
                <p style={{ color: colors.accentRed, fontSize: '12px', marginTop: '4px' }}>
                  {coverError}
                </p>
              )}
              {coverFile && (
                <ImagePreview file={coverFile} />
              )}
              {!coverFile && coverImageUrl && (
                <ImagePreview url={coverImageUrl} />
              )}
            </div>
          </Field>
          <Field label="Extra foto's (max 3)">
            <div>
              <label style={fileInputLabelStyle}>
                Kies bestanden
                <input
                  ref={extraInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleExtraChange}
                  style={{ display: 'none' }}
                />
              </label>
              {extraFiles.length > 0 && (
                <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '6px' }}>
                  {extraFiles.length} bestand(en) geselecteerd
                </p>
              )}
            </div>
          </Field>
        </div>
      </div>

      {/* Tracklist */}
      <div style={sectionWrapStyle}>
        <h3 style={sectionHeaderStyle}>Tracklist</h3>
        <textarea
          value={tracklist.join('\n')}
          onChange={(e) => setTracklist(e.target.value.split('\n'))}
          rows={6}
          placeholder={'Eén nummer per lijn — wordt automatisch ingevuld via "Metadata ophalen"'}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>

      {/* Notities */}
      <div style={sectionWrapStyle}>
        <h3 style={sectionHeaderStyle}>Notities</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Opmerkingen over de lp..."
          style={{
            ...inputStyle,
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <div style={actionBarStyle}>
        <button
          type="button"
          style={buttonStyle('secondary')}
          onClick={onCancel}
          disabled={loading}
        >
          Annuleer
        </button>
        <button
          type="submit"
          style={{
            ...buttonStyle('primary'),
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          disabled={loading}
        >
          {loading ? 'Bezig...' : 'Opslaan'}
        </button>
      </div>

      <BarcodeScanner
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onResult={handleScanResult}
      />
    </form>
  );
}
