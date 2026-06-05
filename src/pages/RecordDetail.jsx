import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useRecords } from '../hooks/useRecords.js';
import { useToast } from '../components/ui/Toast.jsx';
import { isBeheerder } from '../utils/roles.js';
import DetailModal from '../components/ui/DetailModal.jsx';
import RecordForm from '../components/records/RecordForm.jsx';
import Icon from '../components/ui/Icon.jsx';
import { originalLabel } from '../utils/records.js';
import { colors, radius, buttonStyle, badgeStyle, ownerColor } from '../styles/tokens.js';

async function uploadFile(file, path) {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

function Spinner() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: `3px solid ${colors.borderColor}`,
          borderTopColor: colors.accentRed,
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '11px', fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      <span style={{ fontSize: '14px', color: colors.textPrimary }}>{value}</span>
    </div>
  );
}

// Inklapbare sectie (accordion), standaard ingeklapt.
function Section({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: `1px solid ${colors.borderColor}`, borderRadius: radius.md, marginBottom: '12px', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '10px', padding: '14px 16px', backgroundColor: colors.bgCard, border: 'none',
          cursor: 'pointer', color: colors.textPrimary, fontSize: '15px', fontWeight: 600,
          fontFamily: 'inherit', textAlign: 'left',
        }}
      >
        <span>{title}</span>
        <span style={{ display: 'flex', color: colors.textSecondary, transition: 'transform 0.2s ease', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          <Icon name="forward" size={18} />
        </span>
      </button>
      {open && <div style={{ padding: '4px 16px 18px' }}>{children}</div>}
    </div>
  );
}

export default function RecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { updateRecord, deleteRecord } = useRecords();
  const showToast = useToast();

  const [record, setRecord] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const canEdit = isBeheerder(role);

  const loadRecord = useCallback(async () => {
    setPageLoading(true);
    try {
      const snap = await getDoc(doc(db, 'records', id));
      if (!snap.exists()) {
        setNotFound(true);
      } else {
        setRecord({ id: snap.id, ...snap.data() });
      }
    } catch (err) {
      console.error('RecordDetail: failed to load record', err);
      setNotFound(true);
    } finally {
      setPageLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  async function handleSave(formData) {
    const { coverFile, extraFiles, ...rest } = formData;
    setSaveLoading(true);
    try {
      // rest.coverImageUrl kan via metadata-lookup gewijzigd zijn; een geüploade
      // file heeft voorrang.
      let coverImageUrl = rest.coverImageUrl || record.coverImageUrl || null;
      if (coverFile) {
        coverImageUrl = await uploadFile(coverFile, `records/${id}/cover_${Date.now()}.jpg`);
      }

      const userPhotos = record.userPhotos || [];
      if (extraFiles && extraFiles.length > 0) {
        for (const file of extraFiles) {
          const url = await uploadFile(file, `records/${id}/photo_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`);
          userPhotos.push(url);
        }
      }

      const updates = { ...rest, coverImageUrl, userPhotos };
      await updateRecord(id, updates);
      setEditOpen(false);
      await loadRecord();
      showToast('Lp bijgewerkt!', 'success');
    } catch (err) {
      console.error('RecordDetail: failed to update record', err);
      showToast('Er is iets misgegaan bij het opslaan.', 'error');
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await deleteRecord(id);
      showToast('Lp verwijderd.', 'success');
      navigate('/platen');
    } catch (err) {
      console.error('RecordDetail: failed to delete record', err);
      showToast('Er is iets misgegaan bij het verwijderen.', 'error');
      setDeleteLoading(false);
    }
  }

  const pageStyle = {
    minHeight: '100vh',
    backgroundColor: colors.bgPrimary,
    padding: '24px',
  };

  const headerSectionStyle = {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start',
    marginBottom: '28px',
    flexWrap: 'wrap',
  };

  const coverStyle = {
    width: '200px',
    height: '200px',
    borderRadius: radius.md,
    objectFit: 'cover',
    border: `1px solid ${colors.borderColor}`,
    flexShrink: 0,
  };

  const coverPlaceholderStyle = {
    width: '200px',
    height: '200px',
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.borderColor}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '80px',
    flexShrink: 0,
  };

  const artistStyle = {
    fontSize: '28px',
    fontWeight: 700,
    color: colors.textPrimary,
    margin: '0 0 6px',
    lineHeight: 1.2,
  };

  const albumTitleStyle = {
    fontSize: '20px',
    fontWeight: 400,
    color: colors.textSecondary,
    margin: '0 0 12px',
  };

  const sublineStyle = {
    fontSize: '13px',
    color: colors.textSecondary,
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center',
  };

  const infoGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  };

  const photoGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '12px',
  };

  if (pageLoading) {
    return (
      <div style={pageStyle}>
        <Spinner />
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={pageStyle}>
        <p style={{ color: colors.textSecondary, fontSize: '16px' }}>Lp niet gevonden.</p>
        <button style={buttonStyle('secondary')} onClick={() => navigate('/platen')}>
          ← Terug naar lp's
        </button>
      </div>
    );
  }

  const ownerBadge = ownerColor(record.owner);
  const sublineParts = [
    record.year,
    record.format,
    record.purchasePrice != null ? `€${parseFloat(record.purchasePrice).toFixed(2)}` : null,
  ].filter(Boolean);

  const formInitialData = {
    artist: record.artist || '',
    title: record.title || '',
    owner: record.owner || 'Dario',
    purchasePrice: record.purchasePrice != null ? record.purchasePrice : '',
    quantity: record.quantity != null ? record.quantity : 1,
    purchaseDate: record.purchaseDate || '',
    label: record.label || '',
    year: record.year != null ? record.year : '',
    releaseYear: record.releaseYear != null ? record.releaseYear : '',
    country: record.country || '',
    format: record.format || 'LP',
    genres: record.genres || [],
    catalogNumber: record.catalogNumber || '',
    barcode: record.barcode || '',
    condition: record.condition || '',
    tracklist: Array.isArray(record.tracklist) ? record.tracklist : [],
    notes: record.notes || '',
    coverImageUrl: record.coverImageUrl || null,
  };

  function formatDate(val) {
    if (!val) return null;
    if (val && typeof val.toDate === 'function') {
      return val.toDate().toLocaleDateString('nl-BE');
    }
    if (val instanceof Date) return val.toLocaleDateString('nl-BE');
    if (typeof val === 'string') return val;
    return null;
  }

  const actionBarStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    flexWrap: 'wrap',
    backgroundColor: colors.bgPrimary,
    borderBottom: `1px solid ${colors.borderColor}`,
    padding: '12px 0',
    marginBottom: '20px',
  };

  return (
    <div style={pageStyle}>
      {/* Sticky actiebalk: terug links, bewerken + verwijderen naast elkaar rechts */}
      <div style={actionBarStyle}>
        <button style={buttonStyle('ghost')} onClick={() => navigate('/platen')}>
          <Icon name="back" size={16} /> Terug
        </button>
        {canEdit && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={buttonStyle('primary')} onClick={() => setEditOpen(true)}>
              <Icon name="edit" size={15} /> Bewerken
            </button>
            <button style={buttonStyle('danger')} onClick={() => setConfirmDelete(true)}>
              <Icon name="trash" size={15} /> Verwijderen
            </button>
          </div>
        )}
      </div>

      {/* Header section */}
      <div style={headerSectionStyle}>
        {record.coverImageUrl ? (
          <img src={record.coverImageUrl} alt={record.title} style={coverStyle} />
        ) : (
          <div style={{ ...coverPlaceholderStyle, color: colors.brand }}>
            <Icon name="disc" size={86} strokeWidth={1.2} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h1 style={artistStyle}>{record.artist}</h1>
          <h2 style={albumTitleStyle}>{record.title}</h2>
          <div style={{ marginBottom: '12px' }}>
            <span style={badgeStyle(ownerBadge)}>{record.owner}</span>
          </div>
          {sublineParts.length > 0 && (
            <div style={sublineStyle}>
              {sublineParts.map((part, i) => (
                <span key={i}>{part}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alle info (zoals in 'Bewerken') in inklapbare secties, standaard ingeklapt */}
      <Section title="Algemeen">
        <div style={infoGridStyle}>
          <InfoRow label="Artiest" value={record.artist} />
          <InfoRow label="Titel" value={record.title} />
          <InfoRow label="Eigenaar" value={record.owner} />
          <InfoRow label="Aantal" value={record.quantity} />
        </div>
        {record.genres && record.genres.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Genres
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {record.genres.map((g) => (
                <span key={g} style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: '999px', backgroundColor: colors.brandDim, color: colors.brandStrong, fontSize: '12px', fontWeight: 500 }}>
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title="Lp-details (persing & uitgave)">
        <div style={infoGridStyle}>
          <InfoRow label="Label" value={record.label} />
          <InfoRow label="Catalogusnummer" value={record.catalogNumber} />
          <InfoRow label="Barcode" value={record.barcode} />
          <InfoRow label="Land" value={record.country} />
          <InfoRow label="Jaar (origineel)" value={record.year} />
          <InfoRow
            label="Uitgavejaar"
            value={
              record.releaseYear
                ? record.releaseYear +
                  (record.year && record.releaseYear !== record.year ? ' (heruitgave)' : '')
                : null
            }
          />
          <InfoRow label="Origineel" value={originalLabel(record)} />
          <InfoRow label="Format" value={record.format} />
          <InfoRow label="Conditie" value={record.condition} />
        </div>
      </Section>

      <Section title="Aankoop">
        <div style={infoGridStyle}>
          <InfoRow label="Aankoopprijs" value={record.purchasePrice != null && record.purchasePrice !== '' ? `€${parseFloat(record.purchasePrice).toFixed(2)}` : null} />
          <InfoRow label="Aankoopdatum" value={record.purchaseDate} />
          <InfoRow label="Toegevoegd op" value={formatDate(record.dateAdded)} />
        </div>
      </Section>

      <Section title="Tracklist">
        {record.tracklist && record.tracklist.length > 0 ? (
          <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {record.tracklist.map((track, i) => (
              <li key={i} style={{ fontSize: '14px', color: colors.textPrimary, lineHeight: 1.5 }}>
                {track}
              </li>
            ))}
          </ol>
        ) : (
          <p style={{ color: colors.textSecondary, fontSize: '14px' }}>Geen tracklist beschikbaar.</p>
        )}
      </Section>

      <Section title="Foto's">
        {record.userPhotos && record.userPhotos.length > 0 ? (
          <div style={photoGridStyle}>
            {record.userPhotos.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <img
                  src={url}
                  alt={`Foto ${i + 1}`}
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: radius.sm, border: `1px solid ${colors.borderColor}`, display: 'block' }}
                />
              </a>
            ))}
          </div>
        ) : (
          <p style={{ color: colors.textSecondary, fontSize: '14px' }}>Geen foto's beschikbaar.</p>
        )}
      </Section>

      <Section title="Notities">
        {record.notes && record.notes.trim() ? (
          <p style={{ color: colors.textPrimary, fontSize: '15px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {record.notes}
          </p>
        ) : (
          <p style={{ color: colors.textSecondary, fontSize: '14px' }}>Geen notities.</p>
        )}
      </Section>

      {/* Bevestiging bij verwijderen */}
      {confirmDelete && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
          onClick={() => !deleteLoading && setConfirmDelete(false)}
        >
          <div
            style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.borderColor}`, borderRadius: radius.lg, padding: '28px', width: '100%', maxWidth: '400px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '18px', fontWeight: 700, color: colors.textPrimary, marginBottom: '8px' }}>
              Lp verwijderen?
            </div>
            <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '24px' }}>
              “{record.artist} — {record.title}” wordt definitief verwijderd. Dit kan niet ongedaan gemaakt worden.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button style={buttonStyle('secondary')} onClick={() => setConfirmDelete(false)} disabled={deleteLoading}>
                Annuleer
              </button>
              <button
                style={{ ...buttonStyle('danger'), opacity: deleteLoading ? 0.6 : 1, cursor: deleteLoading ? 'not-allowed' : 'pointer' }}
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Bezig...' : 'Ja, verwijder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      <DetailModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Lp bewerken"
      >
        <RecordForm
          initialData={formInitialData}
          onSubmit={handleSave}
          onCancel={() => setEditOpen(false)}
          loading={saveLoading}
        />
      </DetailModal>
    </div>
  );
}
