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
import { colors, radius, buttonStyle, badgeStyle, chipStyle } from '../styles/tokens.js';

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

export default function RecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { updateRecord, deleteRecord } = useRecords();
  const showToast = useToast();

  const [record, setRecord] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeTab, setActiveTab] = useState('info');
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
      let coverImageUrl = record.coverImageUrl || null;
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
      showToast('Plaat bijgewerkt!', 'success');
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
      showToast('Plaat verwijderd.', 'success');
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

  const topBarStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
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

  const tabBarStyle = {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: `1px solid ${colors.borderColor}`,
    paddingBottom: '12px',
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

  const deleteZoneStyle = {
    marginTop: '40px',
    paddingTop: '24px',
    borderTop: `1px solid ${colors.borderColor}`,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
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
        <p style={{ color: colors.textSecondary, fontSize: '16px' }}>Plaat niet gevonden.</p>
        <button style={buttonStyle('secondary')} onClick={() => navigate('/platen')}>
          ← Terug naar platen
        </button>
      </div>
    );
  }

  const ownerColor = record.owner === 'Papa' ? 'blue' : 'orange';
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
    country: record.country || '',
    format: record.format || 'LP',
    genres: record.genres || [],
    catalogNumber: record.catalogNumber || '',
    barcode: record.barcode || '',
    condition: record.condition || '',
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

  return (
    <div style={pageStyle}>
      {/* Top bar */}
      <div style={topBarStyle}>
        <button style={buttonStyle('ghost')} onClick={() => navigate('/platen')}>
          ← Terug
        </button>
        {canEdit && (
          <button style={buttonStyle('primary')} onClick={() => setEditOpen(true)}>
            ✏️ Bewerken
          </button>
        )}
      </div>

      {/* Header section */}
      <div style={headerSectionStyle}>
        {record.coverImageUrl ? (
          <img src={record.coverImageUrl} alt={record.title} style={coverStyle} />
        ) : (
          <div style={coverPlaceholderStyle}>🎵</div>
        )}
        <div style={{ flex: 1 }}>
          <h1 style={artistStyle}>{record.artist}</h1>
          <h2 style={albumTitleStyle}>{record.title}</h2>
          <div style={{ marginBottom: '12px' }}>
            <span style={badgeStyle(ownerColor)}>{record.owner}</span>
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

      {/* Tabs */}
      <div style={tabBarStyle}>
        {['info', 'tracklist', 'fotos', 'notities'].map((tab) => (
          <button
            key={tab}
            style={chipStyle(activeTab === tab)}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'info' ? 'Info' : tab === 'tracklist' ? 'Tracklist' : tab === 'fotos' ? "Foto's" : 'Notities'}
          </button>
        ))}
      </div>

      {/* Tab: Info */}
      {activeTab === 'info' && (
        <div style={infoGridStyle}>
          <InfoRow label="Label" value={record.label} />
          <InfoRow label="Catalogusnummer" value={record.catalogNumber} />
          <InfoRow label="Barcode" value={record.barcode} />
          <InfoRow label="Land" value={record.country} />
          <InfoRow label="Jaar" value={record.year} />
          <InfoRow label="Format" value={record.format} />
          <InfoRow label="Conditie" value={record.condition} />
          <InfoRow label="Aankoopprijs" value={record.purchasePrice != null ? `€${parseFloat(record.purchasePrice).toFixed(2)}` : null} />
          <InfoRow label="Aankoopdatum" value={record.purchaseDate} />
          <InfoRow label="Toegevoegd op" value={formatDate(record.dateAdded)} />
          {record.genres && record.genres.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Genres
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {record.genres.map((g) => (
                  <span
                    key={g}
                    style={{
                      display: 'inline-flex',
                      padding: '2px 8px',
                      borderRadius: radius.sm,
                      backgroundColor: 'rgba(229,57,53,0.15)',
                      color: colors.accentRed,
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Tracklist */}
      {activeTab === 'tracklist' && (
        <div>
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
        </div>
      )}

      {/* Tab: Foto's */}
      {activeTab === 'fotos' && (
        <div>
          {record.userPhotos && record.userPhotos.length > 0 ? (
            <div style={photoGridStyle}>
              {record.userPhotos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={url}
                    alt={`Foto ${i + 1}`}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      objectFit: 'cover',
                      borderRadius: radius.sm,
                      border: `1px solid ${colors.borderColor}`,
                      display: 'block',
                    }}
                  />
                </a>
              ))}
            </div>
          ) : (
            <p style={{ color: colors.textSecondary, fontSize: '14px' }}>Geen foto's beschikbaar.</p>
          )}
        </div>
      )}

      {/* Tab: Notities */}
      {activeTab === 'notities' && (
        <div>
          {record.notes && record.notes.trim() ? (
            <p style={{ color: colors.textPrimary, fontSize: '15px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {record.notes}
            </p>
          ) : (
            <p style={{ color: colors.textSecondary, fontSize: '14px' }}>Geen notities.</p>
          )}
        </div>
      )}

      {/* Delete zone */}
      {canEdit && (
        <div style={deleteZoneStyle}>
          {!confirmDelete ? (
            <button
              style={buttonStyle('danger')}
              onClick={() => setConfirmDelete(true)}
            >
              🗑️ Verwijderen
            </button>
          ) : (
            <>
              <span style={{ color: colors.textSecondary, fontSize: '14px' }}>
                Weet je het zeker?
              </span>
              <button
                style={{
                  ...buttonStyle('danger'),
                  opacity: deleteLoading ? 0.6 : 1,
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                }}
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Bezig...' : 'Ja, verwijder'}
              </button>
              <button
                style={buttonStyle('secondary')}
                onClick={() => setConfirmDelete(false)}
                disabled={deleteLoading}
              >
                Annuleer
              </button>
            </>
          )}
        </div>
      )}

      {/* Edit modal */}
      <DetailModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Plaat bewerken"
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
