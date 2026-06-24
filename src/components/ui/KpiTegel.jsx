import { useState } from 'react';
import { colors, radius, fonts, shadows } from '../../styles/tokens.js';

const accentMap = {
  red: colors.accentRed,
  blue: colors.accentBlue,
  green: colors.accentGreen,
  orange: colors.accentOrange,
};

export default function KpiTegel({ label, value, onClick, color }) {
  const [hovered, setHovered] = useState(false);

  const cardStyle = {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    fontFamily: 'inherit',
    backgroundColor: hovered && onClick ? colors.bgHover : colors.bgCard,
    border: `1px solid ${hovered && onClick ? colors.brand : colors.borderColor}`,
    borderRadius: radius.md,
    padding: '15px 20px',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'background-color 0.18s ease, border-color 0.18s ease, transform 0.18s ease',
    transform: hovered && onClick ? 'translateY(-2px)' : 'translateY(0)',
    boxShadow: shadows.card,
    minWidth: '80px',
    flex: '1 1 0',
  };

  const Tag = onClick ? 'button' : 'div';

  const labelStyle = {
    fontSize: '11px',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '8px',
  };

  const valueStyle = {
    fontFamily: fonts.display,
    fontSize: 'clamp(20px, 5vw, 32px)',
    fontWeight: 600,
    color: color && accentMap[color] ? accentMap[color] : colors.textPrimary,
    lineHeight: 1.05,
  };

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value}</div>
    </Tag>
  );
}
