import { useState } from 'react';
import { colors, radius, buttonStyle } from '../../styles/tokens.js';

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

export default function WishlistForm({ initialData = {}, onSubmit, onCancel, loading }) {
  const [artist, setArtist] = useState(initialData.artist || '');
  const [title, setTitle] = useState(initialData.title || '');
  const [owner, setOwner] = useState(initialData.owner || 'Dario');
  const [priority, setPriority] = useState(initialData.priority || 'normaal');
  const [targetPrice, setTargetPrice] = useState(
    initialData.targetPrice != null ? String(initialData.targetPrice) : ''
  );
  const [status, setStatus] = useState(initialData.status || 'actief');
  const [notes, setNotes] = useState(initialData.notes || '');

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      artist,
      title,
      owner,
      priority,
      targetPrice: targetPrice !== '' ? parseFloat(targetPrice) : null,
      status,
      notes,
    });
  }

  const sectionWrapStyle = {
    marginBottom: '24px',
  };

  const actionBarStyle = {
    position: 'sticky',
    bottom: 0,
    backgroundColor: colors.bgCard,
    borderTop: `1px solid ${colors.borderColor}`,
    padding: '16px 0 0',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '8px',
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={sectionWrapStyle}>
        <h3 style={sectionHeaderStyle}>Wishlist item</h3>
        <div style={fieldGridStyle}>
          <Field label="Artiest *">
            <Input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              required
              placeholder="bijv. The Beatles"
            />
          </Field>
          <Field label="Titel">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="bijv. Abbey Road"
            />
          </Field>
          <Field label="Eigenaar *">
            <Select value={owner} onChange={(e) => setOwner(e.target.value)} required>
              <option value="Dario">Dario</option>
              <option value="Papa">Papa</option>
            </Select>
          </Field>
          <Field label="Prioriteit">
            <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="hoog">Hoog</option>
              <option value="normaal">Normaal</option>
              <option value="laag">Laag</option>
            </Select>
          </Field>
          <Field label="Doelprijs EUR">
            <Input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="actief">Actief</option>
              <option value="gevonden">Gevonden</option>
              <option value="gekocht">Gekocht</option>
            </Select>
          </Field>
        </div>
        <Field label="Notities">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Opmerkingen..."
            style={{
              ...inputStyle,
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </Field>
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
    </form>
  );
}
