import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config.js';
import { useRecords } from '../hooks/useRecords.js';
import { useToast } from '../components/ui/Toast.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import RecordForm from '../components/records/RecordForm.jsx';
import { colors, buttonStyle } from '../styles/tokens.js';

async function uploadFile(file, path) {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export default function RecordAdd() {
  const navigate = useNavigate();
  const { addRecord } = useRecords();
  const showToast = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

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
    try {
      let coverImageUrl = null;
      if (coverFile) {
        const filename = `${Date.now()}_${coverFile.name}`;
        coverImageUrl = await uploadFile(coverFile, `records/temp/${filename}`);
      }

      const userPhotos = [];
      if (extraFiles && extraFiles.length > 0) {
        for (const file of extraFiles) {
          const filename = `${Date.now()}_${file.name}`;
          const url = await uploadFile(file, `records/temp/${filename}`);
          userPhotos.push(url);
        }
      }

      const newId = await addRecord({
        ...rest,
        artist: artist.trim(),
        title: title.trim(),
        owner,
        coverImageUrl,
        userPhotos,
        addedBy: user ? user.uid : null,
      });

      showToast('Plaat toegevoegd!', 'success');
      navigate(`/platen/${newId}`);
    } catch (err) {
      console.error('RecordAdd: failed to add record', err);
      showToast('Er is iets misgegaan bij het toevoegen.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const pageStyle = {
    minHeight: '100vh',
    backgroundColor: colors.bgPrimary,
    padding: '24px',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '32px',
  };

  const pageTitleStyle = {
    fontSize: '24px',
    fontWeight: 700,
    color: colors.textPrimary,
    margin: 0,
  };

  const cardStyle = {
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: '10px',
    padding: '24px',
    maxWidth: '960px',
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <button
          style={buttonStyle('ghost')}
          onClick={() => navigate('/platen')}
        >
          ← Terug naar platen
        </button>
        <h1 style={pageTitleStyle}>Plaat toevoegen</h1>
      </div>
      <div style={cardStyle}>
        <RecordForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/platen')}
          loading={loading}
        />
      </div>
    </div>
  );
}
