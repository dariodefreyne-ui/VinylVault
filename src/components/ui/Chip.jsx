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
    <span
      style={style}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </span>
  );
}
