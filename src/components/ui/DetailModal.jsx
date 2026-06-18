import { useEffect } from 'react';
import { colors, radius } from '../../styles/tokens.js';

export default function DetailModal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'flex-end',
  };

  const sheetStyle = {
    width: '100%',
    // dvh i.p.v. vh + safe-area-padding zodat de onderkant (Opslaan/Annuleer)
    // niet achter de mobiele browserbalk/home-indicator valt.
    maxHeight: '90dvh',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    WebkitOverflowScrolling: 'touch',
    paddingBottom: 'env(safe-area-inset-bottom)',
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px 16px',
    borderBottom: `1px solid ${colors.borderColor}`,
    position: 'sticky',
    top: 0,
    backgroundColor: colors.bgCard,
    zIndex: 1,
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: 600,
    color: colors.textPrimary,
    margin: 0,
  };

  const closeBtnStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: colors.textSecondary,
    fontSize: '20px',
    lineHeight: 1,
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    transition: 'color 0.15s ease',
  };

  const bodyStyle = {
    padding: '24px',
  };

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div style={sheetStyle} role="dialog" aria-modal="true" aria-label={title}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>{title}</h2>
          <button
            style={closeBtnStyle}
            onClick={onClose}
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>
        <div style={bodyStyle}>{children}</div>
      </div>
    </div>
  );
}
