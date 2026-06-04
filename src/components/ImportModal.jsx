import { useState, useCallback, useEffect } from 'react';
import {
  writeBatch,
  doc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { parseExcelFile, sanitizeRow, autoDetectMapping, COLUMN_MAPPINGS } from '../utils/importExcel.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from './ui/Toast.jsx';
import DetailModal from './ui/DetailModal.jsx';
import { colors, radius, buttonStyle } from '../styles/tokens.js';

const FIELD_LABELS = {
  artist: 'Artiest *',
  title: 'Titel',
  owner: 'Eigenaar *',
  purchasePrice: 'Aankoopprijs',
  label: 'Label',
  year: 'Jaar',
  format: 'Format',
  barcode: 'Barcode',
  notes: 'Notities',
};

const REQUIRED_FIELDS = ['artist', 'owner'];

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------
function StepIndicator({ currentStep, totalSteps }) {
  const wrapStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
  };

  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div style={wrapStyle}>
      {steps.map((step, idx) => {
        const isActive = step === currentStep;
        const isDone = step < currentStep;

        const circleStyle = {
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: 700,
          backgroundColor: isActive
            ? colors.accentRed
            : isDone
            ? 'rgba(229,57,53,0.25)'
            : colors.bgHover,
          color: isActive ? '#fff' : isDone ? colors.accentRed : colors.textSecondary,
          border: isActive
            ? '2px solid ' + colors.accentRed
            : isDone
            ? '2px solid rgba(229,57,53,0.4)'
            : '2px solid ' + colors.borderColor,
          flexShrink: 0,
          transition: 'all 0.2s ease',
        };

        const lineStyle = {
          width: '32px',
          height: '2px',
          backgroundColor: isDone ? 'rgba(229,57,53,0.4)' : colors.borderColor,
          margin: '0 4px',
        };

        return (
          <span key={step} style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span style={circleStyle}>{isDone ? '✓' : step}</span>
            {idx < totalSteps - 1 && <span style={lineStyle} />}
          </span>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Bestand kiezen
// ---------------------------------------------------------------------------
function StepFileSelect({ onParsed }) {
  const [dragging, setDragging] = useState(false);
  const [parsedRows, setParsedRows] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [parsing, setParsing] = useState(false);

  async function processFile(file) {
    if (!file) return;
    setParsing(true);
    setError('');
    try {
      const rows = await parseExcelFile(file);
      setFileName(file.name);
      setParsedRows(rows);
    } catch (err) {
      setError(err.message);
      setParsedRows(null);
    } finally {
      setParsing(false);
    }
  }

  function handleFileInput(e) {
    const file = e.target.files[0];
    if (file) processFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  const dropZoneStyle = {
    border: '2px dashed ' + (dragging ? colors.accentRed : colors.borderColor),
    borderRadius: radius.md,
    padding: '32px',
    textAlign: 'center',
    backgroundColor: dragging ? 'rgba(229,57,53,0.06)' : colors.bgHover,
    transition: 'border-color 0.15s ease, background-color 0.15s ease',
    marginBottom: '16px',
  };

  const previewTableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
  };

  const thStyle = {
    padding: '6px 10px',
    backgroundColor: colors.bgHover,
    color: colors.textSecondary,
    textAlign: 'left',
    fontWeight: 600,
    borderBottom: '1px solid ' + colors.borderColor,
    whiteSpace: 'nowrap',
  };

  const tdStyle = {
    padding: '6px 10px',
    color: colors.textPrimary,
    borderBottom: '1px solid ' + colors.borderColor,
    whiteSpace: 'nowrap',
    maxWidth: '160px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const previewRows = parsedRows ? parsedRows.slice(0, 5) : [];
  const previewHeaders = previewRows.length > 0 ? Object.keys(previewRows[0]) : [];

  return (
    <div>
      <div
        style={dropZoneStyle}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📂</div>
        <p style={{ color: colors.textSecondary, fontSize: '14px', margin: '0 0 12px 0' }}>
          Sleep een bestand hierheen of klik om te kiezen
        </p>
        <label style={{ ...buttonStyle('secondary'), cursor: 'pointer', display: 'inline-flex' }}>
          Bestand kiezen
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
        </label>
        <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '8px', marginBottom: 0 }}>
          .xlsx, .xls, .csv
        </p>
      </div>

      {parsing && (
        <p style={{ color: colors.textSecondary, fontSize: '14px' }}>Bestand verwerken...</p>
      )}

      {error && (
        <p style={{ color: colors.accentRed, fontSize: '14px' }}>{error}</p>
      )}

      {parsedRows && (
        <div>
          <p style={{ fontSize: '13px', color: colors.accentGreen, marginBottom: '8px' }}>
            {fileName} — {parsedRows.length} rijen geladen
          </p>
          {previewHeaders.length > 0 && (
            <div style={{ overflowX: 'auto', border: '1px solid ' + colors.borderColor, borderRadius: radius.sm }}>
              <table style={previewTableStyle}>
                <thead>
                  <tr>
                    {previewHeaders.map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i}>
                      {previewHeaders.map((h) => (
                        <td key={h} style={tdStyle}>{String(row[h])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {parsedRows.length > 5 && (
            <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
              ...en nog {parsedRows.length - 5} rijen
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              style={buttonStyle('primary')}
              onClick={() => onParsed(parsedRows, previewHeaders)}
            >
              Volgende
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Kolommen mappen
// ---------------------------------------------------------------------------
function StepMapping({ headers, initialMapping, onNext, onBack }) {
  const [mapping, setMapping] = useState(initialMapping || {});

  const selectInputStyle = {
    width: '100%',
    backgroundColor: colors.bgCard,
    border: '1px solid ' + colors.borderColor,
    borderRadius: radius.sm,
    padding: '6px 10px',
    color: colors.textPrimary,
    fontSize: '13px',
    boxSizing: 'border-box',
    cursor: 'pointer',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '4px',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  };

  function updateMapping(field, colName) {
    setMapping((prev) => {
      if (colName === '') {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return { ...prev, [field]: colName };
    });
  }

  const requiredMissing = REQUIRED_FIELDS.some((f) => !mapping[f]);

  return (
    <div>
      <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '16px' }}>
        Koppel elke VinylVault kolom aan een kolom uit jouw bestand.
      </p>
      <div style={gridStyle}>
        {Object.keys(FIELD_LABELS).map((field) => (
          <div key={field}>
            <label style={labelStyle}>{FIELD_LABELS[field]}</label>
            <select
              style={selectInputStyle}
              value={mapping[field] || ''}
              onChange={(e) => updateMapping(field, e.target.value)}
            >
              <option value="">— Niet mappen —</option>
              {headers.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      {requiredMissing && (
        <p style={{ fontSize: '13px', color: colors.accentRed, marginBottom: '12px' }}>
          Artiest en Eigenaar zijn verplicht om te mappen.
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        <button style={buttonStyle('secondary')} onClick={onBack}>
          Vorige
        </button>
        <button
          style={{
            ...buttonStyle('primary'),
            opacity: requiredMissing ? 0.5 : 1,
            cursor: requiredMissing ? 'not-allowed' : 'pointer',
          }}
          onClick={() => { if (!requiredMissing) onNext(mapping); }}
          disabled={requiredMissing}
        >
          Volgende
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Preview + validatie
// ---------------------------------------------------------------------------
function StepPreview({ rows, mapping, onNext, onBack }) {
  const [skipErrors, setSkipErrors] = useState(true);

  const sanitized = rows.map((raw) => {
    const record = sanitizeRow(raw, mapping);
    const hasError = !record.artist || !record.owner;
    return { record, hasError };
  });

  const totalRows = sanitized.length;
  const errorCount = sanitized.filter((r) => r.hasError).length;
  const validCount = totalRows - errorCount;
  const importableCount = skipErrors ? validCount : totalRows;

  const VISIBLE_FIELDS = ['artist', 'title', 'owner', 'purchasePrice', 'label', 'year', 'format'];

  const thStyle = {
    padding: '6px 8px',
    backgroundColor: colors.bgHover,
    color: colors.textSecondary,
    textAlign: 'left',
    fontWeight: 600,
    borderBottom: '1px solid ' + colors.borderColor,
    whiteSpace: 'nowrap',
    fontSize: '12px',
  };

  function tdStyle(hasError) {
    return {
      padding: '6px 8px',
      color: colors.textPrimary,
      borderBottom: '1px solid ' + colors.borderColor,
      backgroundColor: hasError ? 'rgba(229,57,53,0.12)' : 'transparent',
      whiteSpace: 'nowrap',
      maxWidth: '140px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontSize: '12px',
    };
  }

  const checkboxLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: colors.textSecondary,
    cursor: 'pointer',
    margin: '12px 0',
  };

  return (
    <div>
      <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px' }}>
        {totalRows} rijen &middot; {errorCount} fout{errorCount !== 1 ? 'en' : ''}
      </p>

      <label style={checkboxLabelStyle}>
        <input
          type="checkbox"
          checked={skipErrors}
          onChange={(e) => setSkipErrors(e.target.checked)}
        />
        Sla foute rijen over
      </label>

      <div style={{
        overflowX: 'auto',
        maxHeight: '280px',
        overflowY: 'auto',
        border: '1px solid ' + colors.borderColor,
        borderRadius: radius.sm,
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}></th>
              {VISIBLE_FIELDS.map((f) => (
                <th key={f} style={thStyle}>{f}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sanitized.map(({ record, hasError }, i) => {
              if (skipErrors && hasError) return null;
              return (
                <tr key={i}>
                  <td style={{ ...tdStyle(hasError), color: hasError ? colors.accentRed : colors.accentGreen }}>
                    {hasError ? '✗' : '✓'}
                  </td>
                  {VISIBLE_FIELDS.map((f) => (
                    <td key={f} style={tdStyle(hasError)}>
                      {record[f] != null ? String(record[f]) : '—'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', alignItems: 'center' }}>
        <button style={buttonStyle('secondary')} onClick={onBack}>
          Vorige
        </button>
        <button
          style={{
            ...buttonStyle('primary'),
            opacity: importableCount === 0 ? 0.5 : 1,
            cursor: importableCount === 0 ? 'not-allowed' : 'pointer',
          }}
          onClick={() => { if (importableCount > 0) onNext(sanitized, skipErrors); }}
          disabled={importableCount === 0}
        >
          Importeer ({importableCount} rijen)
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Importeren
// ---------------------------------------------------------------------------
function StepImporting({ sanitizedRows, skipErrors, user, onDone, onError }) {
  const [done, setDone] = useState(0);
  const [started, setStarted] = useState(false);

  const rowsToImport = skipErrors
    ? sanitizedRows.filter((r) => !r.hasError)
    : sanitizedRows;

  const total = rowsToImport.length;

  const runImport = useCallback(async () => {
    try {
      const BATCH_SIZE = 500;
      let processed = 0;

      while (processed < rowsToImport.length) {
        const chunk = rowsToImport.slice(processed, processed + BATCH_SIZE);
        const batch = writeBatch(db);

        for (const { record } of chunk) {
          const artistText = record.artist || '';
          const titleText = record.title || '';
          const text = (artistText + ' ' + titleText).toLowerCase();
          const searchKeywords = [...new Set(text.split(/\s+/).filter((w) => w.length > 0))];

          const ref = doc(collection(db, 'records'));
          batch.set(ref, {
            ...record,
            searchKeywords,
            dateAdded: serverTimestamp(),
            addedBy: user ? user.uid : null,
          });
        }

        await batch.commit();
        processed += chunk.length;
        setDone(processed);
      }

      onDone();
    } catch (err) {
      onError(err);
    }
  }, [rowsToImport, user, onDone, onError]);

  useEffect(() => {
    if (!started) {
      setStarted(true);
      runImport();
    }
  }, [started, runImport]);

  const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;

  const progressBarBgStyle = {
    width: '100%',
    height: '8px',
    backgroundColor: colors.bgHover,
    borderRadius: radius.sm,
    overflow: 'hidden',
    marginTop: '12px',
    marginBottom: '8px',
  };

  const progressBarFillStyle = {
    height: '100%',
    width: progressPct + '%',
    backgroundColor: colors.accentRed,
    borderRadius: radius.sm,
    transition: 'width 0.3s ease',
  };

  return (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <p style={{ fontSize: '16px', fontWeight: 600, color: colors.textPrimary, marginBottom: '8px' }}>
        {done < total ? 'Importeren...' : 'Voltooid!'}
      </p>
      <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
        {done} van {total} rijen
      </p>
      <div style={progressBarBgStyle}>
        <div style={progressBarFillStyle} />
      </div>
      <p style={{ fontSize: '12px', color: colors.textSecondary }}>{progressPct}%</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ImportModal
// ---------------------------------------------------------------------------
export default function ImportModal({ open, onClose }) {
  const { user } = useAuth();
  const showToast = useToast();

  const [step, setStep] = useState(1);
  const [parsedRows, setParsedRows] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [sanitizedRows, setSanitizedRows] = useState(null);
  const [skipErrors, setSkipErrors] = useState(true);

  function reset() {
    setStep(1);
    setParsedRows(null);
    setHeaders([]);
    setMapping({});
    setSanitizedRows(null);
    setSkipErrors(true);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleParsed(rows, hdrs) {
    setParsedRows(rows);
    setHeaders(hdrs);
    const detected = autoDetectMapping(hdrs);
    setMapping(detected);
    setStep(2);
  }

  function handleMappingNext(finalMapping) {
    setMapping(finalMapping);
    setStep(3);
  }

  function handlePreviewNext(rows, skip) {
    setSanitizedRows(rows);
    setSkipErrors(skip);
    setStep(4);
  }

  function handleImportDone() {
    showToast('Import voltooid!', 'success');
    handleClose();
  }

  function handleImportError(err) {
    showToast(err.message || 'Import mislukt.', 'error');
    setStep(3);
  }

  const STEP_TITLES = [
    'Bestand kiezen',
    'Kolommen mappen',
    'Preview & validatie',
    'Importeren',
  ];

  return (
    <DetailModal open={open} onClose={handleClose} title={STEP_TITLES[step - 1]}>
      <StepIndicator currentStep={step} totalSteps={4} />

      {step === 1 && (
        <StepFileSelect onParsed={handleParsed} />
      )}

      {step === 2 && (
        <StepMapping
          headers={headers}
          initialMapping={mapping}
          onNext={handleMappingNext}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && parsedRows && (
        <StepPreview
          rows={parsedRows}
          mapping={mapping}
          onNext={handlePreviewNext}
          onBack={() => setStep(2)}
        />
      )}

      {step === 4 && sanitizedRows && (
        <StepImporting
          sanitizedRows={sanitizedRows}
          skipErrors={skipErrors}
          user={user}
          onDone={handleImportDone}
          onError={handleImportError}
        />
      )}
    </DetailModal>
  );
}
