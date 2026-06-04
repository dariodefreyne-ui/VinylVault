import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { colors, radius } from '../../styles/tokens.js';

const ToastContext = createContext(null);

function ToastItem({ toast, onRemove }) {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onRemove(toast.id);
    }, 4000);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, onRemove]);

  const typeColors = {
    success: colors.accentGreen,
    error: colors.accentRed,
    info: colors.accentBlue,
  };

  const accent = typeColors[toast.type] || typeColors.info;

  const style = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    border: `1px solid ${accent}`,
    color: colors.textPrimary,
    fontSize: '14px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    minWidth: '260px',
    maxWidth: '380px',
    cursor: 'pointer',
  };

  const dotStyle = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: accent,
    flexShrink: 0,
  };

  return (
    <div style={style} onClick={() => onRemove(toast.id)} role="alert">
      <span style={dotStyle} />
      <span>{toast.message}</span>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const containerStyle = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    zIndex: 9999,
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={containerStyle} aria-live="polite">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside a ToastProvider');
  }
  return ctx.showToast;
}
