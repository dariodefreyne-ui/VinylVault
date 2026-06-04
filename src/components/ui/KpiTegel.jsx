import { useState } from 'react';
import { colors, radius } from '../../styles/tokens.js';

const accentMap = {
  red: colors.accentRed,
  blue: colors.accentBlue,
  green: colors.accentGreen,
  orange: colors.accentOrange,
};

export default function KpiTegel({ label, value, onClick, color }) {
  const [hovered, setHovered] = useState(false);

  const cardStyle = {
    backgroundColor: hovered && onClick ? colors.bgHover : colors.bgCard,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radius.md,
    padding: '16px 20px',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'background-color 0.15s ease',
    minWidth: '120px',
    flex: '1 1 0',
  };

  const labelStyle = {
    fontSize: '12px',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  };

  const valueStyle = {
    fontSize: '28px',
    fontWeight: 700,
    color: color && accentMap[color] ? accentMap[color] : colors.textPrimary,
    lineHeight: 1.1,
  };

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value}</div>
    </div>
  );
}
