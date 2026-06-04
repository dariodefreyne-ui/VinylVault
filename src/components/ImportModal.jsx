import { colors, radius, buttonStyle } from '../styles/tokens.js';

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const cardStyle = {
  backgroundColor: colors.bgCard,
  border: `1px solid ${colors.borderColor}`,
  borderRadius: radius.lg,
  padding: '28px 32px',
  width: '100%',
  maxWidth: '440px',
};

const headingStyle = {
  fontSize: '18px',
  fontWeight: 700,
  color: colors.textPrimary,
  marginBottom: '8px',
};

const subStyle = {
  fontSize: '14px',
  color: colors.textSecondary,
  marginBottom: '20px',
};

export default function ImportModal({ onClose }) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headingStyle}>Collectie importeren</div>
        <div style={subStyle}>
          Importeer platen vanuit een Excel- of CSV-bestand.
        </div>
        <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '20px' }}>
          Functie wordt binnenkort beschikbaar gesteld.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button style={buttonStyle('secondary')} onClick={onClose}>
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
}
