import { colors, buttonStyle, radius } from '../../styles/tokens.js';
import Icon from './Icon.jsx';

export default function UpdateBanner({ onUpdate, onDismiss }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(80px + env(safe-area-inset-bottom))',
        left: '16px',
        right: '16px',
        zIndex: 9998,
        backgroundColor: colors.bgCard,
        border: `1px solid ${colors.brand}`,
        borderRadius: radius.lg,
        padding: '14px 16px 14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(217,160,91,0.15)',
        animation: 'vv-fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}
      role="status"
      aria-live="polite"
    >
      <span style={{ color: colors.brand, display: 'flex', flexShrink: 0 }}>
        <Icon name="disc" size={20} strokeWidth={1.6} />
      </span>

      <span style={{ fontSize: '14px', color: colors.textPrimary, flex: 1 }}>
        Nieuwe versie beschikbaar
      </span>

      <button
        style={{
          ...buttonStyle('primary'),
          padding: '7px 16px',
          fontSize: '13px',
          flexShrink: 0,
        }}
        onClick={onUpdate}
      >
        Bijwerken
      </button>

      <button
        onClick={onDismiss}
        aria-label="Sluiten"
        style={{
          background: 'none',
          border: 'none',
          color: colors.textSecondary,
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          borderRadius: radius.sm,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = colors.textPrimary; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = colors.textSecondary; }}
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
