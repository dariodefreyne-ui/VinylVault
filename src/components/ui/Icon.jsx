// Lichte line-icon set (stroke = currentColor) — vervangt emoji voor een
// samenhangende, "designed" uitstraling. Geen externe dependency.

const PATHS = {
  home: <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9.5 21v-6h5v6" />,
  disc: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  heart: <path d="M12 20s-7-4.35-9.2-8.3C1.3 9 2.4 5.8 5.5 5.2 7.3 4.85 9 5.7 12 8.5c3-2.8 4.7-3.65 6.5-3.3 3.1.6 4.2 3.8 2.7 6.5C19 15.65 12 20 12 20Z" />,
  chart: <path d="M4 20V4M4 20h16M8 20v-6M12 20V9M16 20v-9M20 20v-4" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  shield: <path d="M12 3l7 3v5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6l7-3Z" />,
  logout: <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 8l-4 4 4 4M6 12h11" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5h3l1.4-2h7.2L18 8.5h2a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.2" />
    </>
  ),
  edit: <path d="M14.5 5.5 18.5 9.5M4 20l1-4L16 5a1.5 1.5 0 0 1 2 0l1 1a1.5 1.5 0 0 1 0 2L8 19l-4 1Z" />,
  trash: <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6" />,
  upload: <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />,
  back: <path d="M14 6l-6 6 6 6" />,
};

export default function Icon({ name, size = 18, strokeWidth = 1.6, style, ...rest }) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block', ...style }}
      aria-hidden="true"
      {...rest}
    >
      {path}
    </svg>
  );
}
