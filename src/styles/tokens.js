export const colors = {
  bgPrimary: '#0f0f0f',
  bgCard: '#1a1a1a',
  bgHover: '#242424',
  textPrimary: '#f0f0f0',
  textSecondary: '#a0a0a0',
  borderColor: '#2a2a2a',
  accentRed: '#e53935',
  accentBlue: '#1e88e5',
  accentGreen: '#43a047',
  accentOrange: '#fb8c00',
  redDim: 'rgba(229,57,53,0.15)',
  blueDim: 'rgba(30,136,229,0.15)',
  greenDim: 'rgba(67,160,71,0.15)',
  orangeDim: 'rgba(251,140,0,0.15)',
};

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
};

export const C = {
  red: colors.accentRed,
  blue: colors.accentBlue,
  green: colors.accentGreen,
  orange: colors.accentOrange,
  redDim: colors.redDim,
  blueDim: colors.blueDim,
  greenDim: colors.greenDim,
  orangeDim: colors.orangeDim,
};

export const pageLayout = {
  padding: '32px',
  maxWidth: '1100px',
  margin: '0 auto',
};

export const pageHeading = {
  fontSize: '26px',
  fontWeight: 700,
  color: colors.textPrimary,
  marginBottom: '28px',
};

export function badgeStyle(color) {
  const map = {
    red: { bg: C.redDim, text: C.red },
    blue: { bg: C.blueDim, text: C.blue },
    green: { bg: C.greenDim, text: C.green },
    orange: { bg: C.orangeDim, text: C.orange },
  };
  const t = map[color] || map.blue;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: radius.sm,
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: t.bg,
    color: t.text,
  };
}

export function chipStyle(active) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    borderRadius: radius.sm,
    fontSize: '13px',
    fontWeight: active ? 600 : 400,
    backgroundColor: active ? colors.accentRed : colors.bgCard,
    color: active ? '#fff' : colors.textSecondary,
    border: `1px solid ${active ? colors.accentRed : colors.borderColor}`,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };
}

export function buttonStyle(variant = 'primary') {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: radius.md,
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };
  const variants = {
    primary: { backgroundColor: colors.accentRed, color: '#fff' },
    secondary: { backgroundColor: colors.bgCard, color: colors.textPrimary, border: `1px solid ${colors.borderColor}` },
    danger: { backgroundColor: 'rgba(229,57,53,0.2)', color: colors.accentRed, border: `1px solid ${colors.accentRed}` },
    ghost: { backgroundColor: 'transparent', color: colors.textSecondary },
  };
  return { ...base, ...(variants[variant] || variants.primary) };
}

export function setupTokens() {
  const root = document.documentElement;
  root.style.setProperty('--bg-primary', colors.bgPrimary);
  root.style.setProperty('--bg-card', colors.bgCard);
  root.style.setProperty('--bg-hover', colors.bgHover);
  root.style.setProperty('--text-primary', colors.textPrimary);
  root.style.setProperty('--text-secondary', colors.textSecondary);
  root.style.setProperty('--border-color', colors.borderColor);
  root.style.setProperty('--accent-red', colors.accentRed);
  root.style.setProperty('--accent-blue', colors.accentBlue);
  root.style.setProperty('--accent-green', colors.accentGreen);
  root.style.setProperty('--accent-orange', colors.accentOrange);
  root.style.setProperty('--radius-sm', radius.sm);
  root.style.setProperty('--radius-md', radius.md);
  root.style.setProperty('--radius-lg', radius.lg);
}
