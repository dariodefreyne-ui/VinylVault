import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config.js';
import { useRecords } from '../hooks/useRecords.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { useToast } from '../components/ui/Toast.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import RecordForm from '../components/records/RecordForm.jsx';
import { colors, radius, buttonStyle } from '../styles/tokens.js';

function normalize(text) {
  return (text || '').trim().toLowerCase();
}

// Zoekt een actief/gevonden wishlist-item dat overeenkomt op artiest + titel.
// Een wishlist-item zonder titel telt al als match op artiest alleen.
function findWishlistMatch(items, artist, title) {
  const a = normalize(artist);
  const t = normalize(title);
  if (!a) return null;
  return items.find((i) => {
    if (i.status === 'gekocht') return false;
    if (normalize(i.artist) !== a) return false;
    const it = normalize(i.title);
    return !it || it === t;
  }) || null;
}

async function uploadFile(file, path) {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export default function RecordAdd() {
  const navigate = useNavigate();
  const { addRecord, updateRecord, deleteRecord } = useRecords();
  const { items: wishlistItems, deleteWishlistItem } = useWishlist();
  const showToast = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [wishlistMatch, setWishlistMatch] = useState(null); // { item, newId }
  const [wishlistActionLoading, setWishlistActionLoading] = useState(false);

  async function handleSubmit(formData) {
    const { artist, title, owner, coverFile, extraFiles, ...rest } = formData;

    if (!artist || !artist.trim()) {
      showToast('Artiest is verplicht.', 'error');
      return;
    }
    if (!title || !title.trim()) {
      showToast('Albumtitel is verplicht.', 'error');
      return;
    }
    if (!owner) {
      showToast('Eigenaar is verplicht.', 'error');
      return;
    }

    setLoading(true);
    let newId = null;
    try {
      newId = await addRecord({
        ...rest,
        artist: artist.trim(),
        title: title.trim(),
        owner,
        // coverImageUrl kan al ingevuld zijn via metadata-lookup (Discogs/MusicBrainz)
        coverImageUrl: rest.coverImageUrl || null,
        userPhotos: [],
        addedBy: user ? user.uid : null,
      });

      const updates = {};

      if (coverFile) {
        updates.coverImageUrl = await uploadFile(coverFile, `records/${newId}/cover_${Date.now()}.jpg`);
      }

      if (extraFiles && extraFiles.length > 0) {
        const results = await Promise.allSettled(
          extraFiles.map((file, i) => uploadFile(file, `records/${newId}/photo_${Date.now()}_${i}.jpg`))
        );
        const userPhotos = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
        if (userPhotos.length > 0) updates.userPhotos = userPhotos;
        if (userPhotos.length < extraFiles.length) {
          showToast('Niet alle extra foto\'s konden geüpload worden.', 'error');
        }
      }

      if (Object.keys(updates).length > 0) {
        await updateRecord(newId, updates);
      }

      showToast('Lp toegevoegd!', 'success');

      const match = findWishlistMatch(wishlistItems, artist, title);
      if (match) {
        setWishlistMatch({ item: match, newId });
      } else {
        navigate(`/platen/${newId}`);
      }
    } catch (err) {
      console.error('RecordAdd: failed to add record', err);
      if (newId) {
        try {
          await deleteRecord(newId);
        } catch (cleanupErr) {
          console.error('RecordAdd: failed to roll back partially created record', cleanupErr);
        }
      }
      showToast('Er is iets misgegaan bij het toevoegen.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmWishlistRemove() {
    setWishlistActionLoading(true);
    try {
      await deleteWishlistItem(wishlistMatch.item.id);
      showToast('Van wishlist verwijderd.', 'success');
    } catch (err) {
      console.error('RecordAdd: failed to remove wishlist item', err);
      showToast('Verwijderen van wishlist mislukt.', 'error');
    } finally {
      setWishlistActionLoading(false);
      navigate(`/platen/${wishlistMatch.newId}`);
    }
  }

  function handleSkipWishlistRemove() {
    navigate(`/platen/${wishlistMatch.newId}`);
  }

  const pageStyle = {
    color: colors.textPrimary,
    maxWidth: '960px',
  };

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button
          style={buttonStyle('ghost')}
          onClick={() => navigate('/platen')}
        >
          ← Terug naar lp's
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
          Lp toevoegen
        </h1>
      </div>
      <div style={{
        backgroundColor: colors.bgCard,
        border: `1px solid ${colors.borderColor}`,
        borderRadius: '10px',
        padding: '24px',
      }}>
        <RecordForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/platen')}
          loading={loading}
        />
      </div>

      {/* Match gevonden met wishlist-item */}
      {wishlistMatch && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
        >
          <div
            style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.borderColor}`, borderRadius: radius.lg, padding: '28px', width: '100%', maxWidth: '420px' }}
          >
            <div style={{ fontSize: '18px', fontWeight: 700, color: colors.textPrimary, marginBottom: '8px' }}>
              Op de wishlist gevonden
            </div>
            <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '24px' }}>
              “{wishlistMatch.item.artist}{wishlistMatch.item.title ? ` — ${wishlistMatch.item.title}` : ''}” staat nog op de wishlist. Verwijderen nu dat je deze lp hebt toegevoegd?
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button style={buttonStyle('secondary')} onClick={handleSkipWishlistRemove} disabled={wishlistActionLoading}>
                Niet nu
              </button>
              <button
                style={{ ...buttonStyle('primary'), opacity: wishlistActionLoading ? 0.6 : 1, cursor: wishlistActionLoading ? 'not-allowed' : 'pointer' }}
                onClick={handleConfirmWishlistRemove}
                disabled={wishlistActionLoading}
              >
                {wishlistActionLoading ? 'Bezig...' : 'Ja, verwijder van wishlist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
