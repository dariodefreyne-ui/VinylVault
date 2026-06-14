import { useState } from 'react';
import { colors, chipStyle } from '../../styles/tokens.js';

export default function Chip({ label, active, onClick }) {
  const [hovered, setHovered] = useState(false);

  const base = chipStyle(active);
  const style = {
    ...base,
    backgroundColor:
      !active && hovered ? colors.bgHover : base.backgroundColor,
  };

  return (
    <button
      type="button"
      style={{ ...style, fontFamily: 'inherit' }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
