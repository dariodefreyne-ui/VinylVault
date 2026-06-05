// ── VinylVault design tokens — "Warm Hi-Fi" ──────────────────────────────
// Warme houtskool-basis met messing/amber als hoofdaccent en terracotta als
// scherpe pop. Crèmekleurige tekst. Bedoeld voor dark mode, rustig voor de ogen.

export const colors = {
  bgPrimary: '#141110',   // warme bijna-zwart
  bgCard: '#1c1815',      // warm houtskool
  bgHover: '#262019',
  textPrimary: '#f2ebdd', // warme crème
  textSecondary: '#a89a85', // taupe
  borderColor: '#312a22',

  // Merk-accent: messing/amber (dominant, warm)
  brand: '#d9a05b',
  brandStrong: '#e7b06a',
  brandText: '#1a1512',   // donkere tekst op amber knoppen

  // Accent-slots (namen behouden voor compatibiliteit met bestaande code)
  accentRed: '#cf6a4c',    // terracotta / oxblood
  accentBlue: '#6f8f9c',   // dof staal-teal (niet koud-neon)
  accentGreen: '#8aa46a',  // olijf/salie
  accentOrange: '#d9a05b', // amber (= brand)

  redDim: 'rgba(207,106,76,0.16)',
  blueDim: 'rgba(111,143,156,0.16)',
  greenDim: 'rgba(138,164,106,0.16)',
  orangeDim: 'rgba(217,160,91,0.16)',
  brandDim: 'rgba(217,160,91,0.14)',
};

export const fonts = {
  display: "'Fraunces', Georgia, 'Times New Roman', serif",
  body: "'Hanken Grotesk', system-ui, -apple-system, sans-serif",
};

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
};

export const shadows = {
  card: '0 1px 2px rgba(0,0,0,0.4)',
  raised: '0 6px 22px rgba(0,0,0,0.45)',
  glow: '0 10px 30px rgba(217,160,91,0.18)',
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
  fontFamily: fonts.display,
  fontSize: '30px',
  fontWeight: 600,
  letterSpacing: '-0.01em',
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
    padding: '2px 9px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.02em',
    backgroundColor: t.bg,
    color: t.text,
    border: `1px solid ${t.text}33`,
  };
}

export function chipStyle(active) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 13px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: active ? 600 : 500,
    backgroundColor: active ? colors.brandDim : 'transparent',
    color: active ? colors.brandStrong : colors.textSecondary,
    border: `1px solid ${active ? colors.brand : colors.borderColor}`,
    cursor: 'pointer',
    transition: 'all 0.18s ease',
  };
}

export function buttonStyle(variant = 'primary') {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '9px 17px',
    borderRadius: radius.md,
    fontSize: '14px',
    fontWeight: 600,
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: 'transform 0.12s ease, background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
  };
  const variants = {
    primary: { backgroundColor: colors.brand, color: colors.brandText, boxShadow: shadows.glow },
    secondary: { backgroundColor: colors.bgCard, color: colors.textPrimary, border: `1px solid ${colors.borderColor}` },
    danger: { backgroundColor: 'rgba(207,106,76,0.16)', color: colors.accentRed, border: `1px solid ${colors.accentRed}` },
    ghost: { backgroundColor: 'transparent', color: colors.textSecondary },
  };
  return { ...base, ...(variants[variant] || variants.primary) };
}

// Stabiele owner-kleur (één bron van waarheid — voorheen verschilde dit per scherm).
const OWNER_COLOR_KEYS = ['red', 'blue', 'green', 'orange'];
const KNOWN_OWNERS = { dario: 'red', papa: 'blue' };
export function ownerColor(label) {
  const key = (label || '').trim().toLowerCase();
  if (!key) return 'blue';
  if (KNOWN_OWNERS[key]) return KNOWN_OWNERS[key];
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return OWNER_COLOR_KEYS[hash % OWNER_COLOR_KEYS.length];
}

export function setupTokens() {
  const root = document.documentElement;
  root.style.setProperty('--bg-primary', colors.bgPrimary);
  root.style.setProperty('--bg-card', colors.bgCard);
  root.style.setProperty('--bg-hover', colors.bgHover);
  root.style.setProperty('--text-primary', colors.textPrimary);
  root.style.setProperty('--text-secondary', colors.textSecondary);
  root.style.setProperty('--border-color', colors.borderColor);
  root.style.setProperty('--brand', colors.brand);
  root.style.setProperty('--accent-red', colors.accentRed);
  root.style.setProperty('--accent-blue', colors.accentBlue);
  root.style.setProperty('--accent-green', colors.accentGreen);
  root.style.setProperty('--accent-orange', colors.accentOrange);
  root.style.setProperty('--font-display', fonts.display);
  root.style.setProperty('--font-body', fonts.body);
  root.style.setProperty('--radius-sm', radius.sm);
  root.style.setProperty('--radius-md', radius.md);
  root.style.setProperty('--radius-lg', radius.lg);
}
