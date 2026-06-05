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
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c0-3.2 2.7-4.8 6-4.8s6 1.6 6 4.8" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 6M17.5 14.4c2.2.5 3.5 1.9 3.5 4.6" />
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
  download: <path d="M12 4v12M7 11l5 5 5-5M5 20h14" />,
  back: <path d="M14 6l-6 6 6 6" />,
  forward: <path d="M10 6l6 6-6 6" />,
  screen: (
    <>
      <rect x="3" y="4" width="18" height="12.5" rx="1.6" />
      <path d="M8.5 20h7M12 16.5V20" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="3.5" />
      <path d="m10.5 12.5 8-8M16 7l2 2M14 9l1.5 1.5" />
    </>
  ),
  alert: <path d="M12 4 2.5 20h19L12 4ZM12 10v5M12 17.5v.01" />,
  check: <path d="M5 12.5 10 17 19 7" />,
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
