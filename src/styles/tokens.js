// ── VinylVault design tokens ──────────────────────────────────────────────
// Drie thema's, alle gebouwd rond hetzelfde gevoel: in een platenzaak staan.
// "Warm Hi-Fi" (standaard): warme houtskool-basis, messing/amber accent.
// "Crate Dig": overdag tussen de bakken, kraft-karton en stoflicht.
// "Backroom Wax": after-hours, het achterkamertje met neonverlichting.

const THEME_DEFS = {
  'warm-hifi': {
    label: 'Warm Hi-Fi',
    colors: {
      bgPrimary: '#141110',
      bgCard: '#1c1815',
      bgHover: '#262019',
      textPrimary: '#f2ebdd',
      textSecondary: '#a89a85',
      borderColor: '#312a22',
      brand: '#d9a05b',
      brandStrong: '#e7b06a',
      brandText: '#1a1512',
      accentRed: '#cf6a4c',
      accentBlue: '#6f8f9c',
      accentGreen: '#8aa46a',
      accentOrange: '#d9a05b',
      redDim: 'rgba(207,106,76,0.16)',
      blueDim: 'rgba(111,143,156,0.16)',
      greenDim: 'rgba(138,164,106,0.16)',
      orangeDim: 'rgba(217,160,91,0.16)',
      brandDim: 'rgba(217,160,91,0.14)',
    },
    ambient: {
      glowTop: 'rgba(217, 160, 91, 0.10)',
      glowBottom: 'rgba(207, 106, 76, 0.08)',
      selection: 'rgba(217, 160, 91, 0.30)',
      scrollbarThumb: '#3a3128',
      scrollbarThumbHover: '#4a4032',
      grain: '0.04',
    },
    glow: '0 10px 30px rgba(217,160,91,0.18)',
  },

  'crate-dig': {
    label: 'Crate Dig',
    colors: {
      bgPrimary: '#c7a572',
      bgCard: '#ddc499',
      bgHover: '#d3b685',
      textPrimary: '#241a0f',
      textSecondary: '#453522',
      borderColor: '#a98a5c',
      brand: '#b93a23',
      brandStrong: '#cf5640',
      brandText: '#fdf6ec',
      accentRed: '#b93a23',
      accentBlue: '#3d6b78',
      accentGreen: '#4f6b35',
      accentOrange: '#b9762a',
      redDim: 'rgba(185,58,35,0.18)',
      blueDim: 'rgba(61,107,120,0.18)',
      greenDim: 'rgba(79,107,53,0.18)',
      orangeDim: 'rgba(185,118,42,0.18)',
      brandDim: 'rgba(185,58,35,0.16)',
    },
    ambient: {
      glowTop: 'rgba(185, 58, 35, 0.08)',
      glowBottom: 'rgba(169, 138, 92, 0.12)',
      selection: 'rgba(185, 58, 35, 0.25)',
      scrollbarThumb: '#a98a5c',
      scrollbarThumbHover: '#8f7249',
      grain: '0.05',
    },
    glow: '0 10px 30px rgba(185,58,35,0.16)',
  },

  'backroom-wax': {
    label: 'Backroom Wax',
    colors: {
      bgPrimary: '#0f0e12',
      bgCard: '#17151b',
      bgHover: '#211e26',
      textPrimary: '#ece8f0',
      textSecondary: '#8d8794',
      borderColor: '#2a2630',
      brand: '#e8458f',
      brandStrong: '#f06aa8',
      brandText: '#190d14',
      accentRed: '#e8458f',
      accentBlue: '#4fa3d9',
      accentGreen: '#5bc99a',
      accentOrange: '#f0a830',
      redDim: 'rgba(232,69,143,0.16)',
      blueDim: 'rgba(79,163,217,0.16)',
      greenDim: 'rgba(91,201,154,0.16)',
      orangeDim: 'rgba(240,168,48,0.16)',
      brandDim: 'rgba(232,69,143,0.14)',
    },
    ambient: {
      glowTop: 'rgba(232, 69, 143, 0.12)',
      glowBottom: 'rgba(79, 163, 217, 0.08)',
      selection: 'rgba(232, 69, 143, 0.30)',
      scrollbarThumb: '#2a2630',
      scrollbarThumbHover: '#383241',
      grain: '0.06',
    },
    glow: '0 10px 30px rgba(232,69,143,0.20)',
  },
};

export const THEME_NAMES = Object.keys(THEME_DEFS);
export const THEME_LABELS = Object.fromEntries(
  THEME_NAMES.map((name) => [name, THEME_DEFS[name].label])
);

const DEFAULT_THEME = 'warm-hifi';
const STORAGE_KEY = 'vv-theme';

// `colors` en `shadows` zijn levende objecten: componenten lezen hun
// properties live bij elke render, dus thema's wisselen via mutatie in
// hetzelfde object (Object.assign) i.p.v. de export opnieuw te binden —
// zo hoeft geen van de ~20 consumers aangepast te worden.
export const colors = { ...THEME_DEFS[DEFAULT_THEME].colors };

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
  glow: THEME_DEFS[DEFAULT_THEME].glow,
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
    red: { bg: colors.redDim, text: colors.accentRed },
    blue: { bg: colors.blueDim, text: colors.accentBlue },
    green: { bg: colors.greenDim, text: colors.accentGreen },
    orange: { bg: colors.orangeDim, text: colors.accentOrange },
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
    justifyContent: 'center',
    minHeight: '44px',
    padding: '5px 13px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: active ? 600 : 500,
    backgroundColor: active ? colors.brandDim : 'transparent',
    color: active ? colors.brandStrong : colors.textSecondary,
    border: `1px solid ${active ? colors.brand : colors.borderColor}`,
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    boxSizing: 'border-box',
  };
}

export function buttonStyle(variant = 'primary') {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '9px 17px',
    minHeight: '44px',
    borderRadius: radius.md,
    fontSize: '14px',
    fontWeight: 600,
    border: '1px solid transparent',
    cursor: 'pointer',
    boxSizing: 'border-box',
    transition: 'transform 0.12s ease, background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
  };
  const variants = {
    primary: { backgroundColor: colors.brand, color: colors.brandText, boxShadow: shadows.glow },
    secondary: { backgroundColor: colors.bgCard, color: colors.textPrimary, border: `1px solid ${colors.borderColor}` },
    danger: { backgroundColor: colors.redDim, color: colors.accentRed, border: `1px solid ${colors.accentRed}` },
    ghost: { backgroundColor: 'transparent', color: colors.textSecondary },
  };
  return { ...base, ...(variants[variant] || variants.primary) };
}

// Stabiele owner-kleur, dynamisch afgeleid uit het label (geen hardcoded namen).
// Eenzelfde eigenaar krijgt altijd dezelfde kleur, op elk scherm.
const OWNER_COLOR_KEYS = ['red', 'blue', 'green', 'orange'];
export function ownerColor(label) {
  const key = (label || '').trim().toLowerCase();
  if (!key) return 'blue';
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return OWNER_COLOR_KEYS[hash % OWNER_COLOR_KEYS.length];
}

export function getStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return THEME_DEFS[stored] ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

// Past een thema toe: muteert de levende `colors`/`shadows` objecten,
// schrijft de CSS custom properties, en bewaart de keuze.
export function applyTheme(name) {
  const def = THEME_DEFS[name] ? THEME_DEFS[name] : THEME_DEFS[DEFAULT_THEME];
  const resolvedName = THEME_DEFS[name] ? name : DEFAULT_THEME;

  Object.assign(colors, def.colors);
  shadows.glow = def.glow;

  setupTokens(def);

  try {
    localStorage.setItem(STORAGE_KEY, resolvedName);
  } catch {
    // localStorage kan ontbreken (privémodus); thema werkt dan enkel voor deze sessie.
  }

  return resolvedName;
}

export function setupTokens(themeDef) {
  const def = themeDef || THEME_DEFS[getStoredTheme()];
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
  root.style.setProperty('--glow-top', def.ambient.glowTop);
  root.style.setProperty('--glow-bottom', def.ambient.glowBottom);
  root.style.setProperty('--selection-color', def.ambient.selection);
  root.style.setProperty('--scrollbar-thumb', def.ambient.scrollbarThumb);
  root.style.setProperty('--scrollbar-thumb-hover', def.ambient.scrollbarThumbHover);
  root.style.setProperty('--grain-opacity', def.ambient.grain);
}
