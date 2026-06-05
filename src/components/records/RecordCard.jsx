import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, radius, shadows, badgeStyle, chipStyle, ownerColor } from '../../styles/tokens.js';
import Icon from '../ui/Icon.jsx';

export default function RecordCard({ record }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const {
    id,
    artist,
    title,
    year,
    releaseYear,
    format,
    label: recordLabel,
    purchasePrice,
    condition,
    genres,
    coverImageUrl,
    owner,
  } = record;

  const ownerBadge = ownerColor(owner);
  const ownerLabel = owner;

  const visibleGenres = Array.isArray(genres) ? genres.slice(0, 2) : [];

  const yearPart =
    releaseYear && year && releaseYear !== year
      ? `${year} · ↻${releaseYear}`
      : releaseYear || year;
  const subParts = [yearPart, format, recordLabel].filter(Boolean);

  const cardStyle = {
    backgroundColor: colors.bgCard,
    border: `1px solid ${hovered ? colors.brand : colors.borderColor}`,
    borderRadius: radius.md,
    padding: '16px',
    cursor: 'pointer',
    transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
    boxShadow: hovered ? shadows.glow : shadows.card,
    transition: 'border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  };

  const topRowStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
  };

  const thumbStyle = {
    width: '76px',
    height: '76px',
    borderRadius: radius.sm,
    objectFit: 'cover',
    flexShrink: 0,
    backgroundColor: colors.bgHover,
    boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
  };

  const placeholderStyle = {
    width: '76px',
    height: '76px',
    borderRadius: radius.sm,
    background: `radial-gradient(circle at 50% 50%, ${colors.bgHover} 0%, #100d0b 72%, ${colors.bgHover} 73%, #100d0b 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.brand,
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
  };

  const infoStyle = {
    flex: 1,
    minWidth: 0,
  };

  const ownerWrapStyle = {
    flexShrink: 0,
    alignSelf: 'flex-start',
  };

  const artistStyle = {
    fontSize: '16px',
    fontWeight: 600,
    color: colors.textPrimary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const titleStyle = {
    fontSize: '14px',
    color: colors.textSecondary,
    marginTop: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const subStyle = {
    fontSize: '12px',
    color: colors.textSecondary,
    opacity: 0.75,
  };

  const bottomRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  };

  const priceStyle = {
    fontSize: '13px',
    fontWeight: 700,
    color: colors.accentGreen,
    marginRight: 'auto',
  };

  function handleClick() {
    navigate('/platen/' + id);
  }

  return (
    <div
      style={cardStyle}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top row: thumbnail + info + owner badge */}
      <div style={topRowStyle}>
        {coverImageUrl ? (
          <img src={coverImageUrl} alt={title} style={thumbStyle} />
        ) : (
          <div style={placeholderStyle}>
            <Icon name="disc" size={30} strokeWidth={1.4} />
          </div>
        )}

        <div style={infoStyle}>
          <div style={artistStyle}>{artist}</div>
          <div style={titleStyle}>{title}</div>
          {subParts.length > 0 && (
            <div style={{ ...subStyle, marginTop: '4px' }}>
              {subParts.join(' · ')}
            </div>
          )}
        </div>

        {owner && (
          <div style={ownerWrapStyle}>
            <span style={badgeStyle(ownerBadge)}>{ownerLabel}</span>
          </div>
        )}
      </div>

      {/* Bottom row: price + condition + genre chips */}
      <div style={bottomRowStyle}>
        {purchasePrice != null && purchasePrice !== '' ? (
          <span style={priceStyle}>€ {parseFloat(purchasePrice).toFixed(2)}</span>
        ) : (
          <span style={{ ...priceStyle, color: colors.textSecondary, fontWeight: 400 }}>
            —
          </span>
        )}

        {condition && (
          <span style={badgeStyle('orange')}>{condition}</span>
        )}

        {visibleGenres.map((g) => (
          <span key={g} style={{ ...chipStyle(false), fontSize: '11px', padding: '2px 8px' }}>
            {g}
          </span>
        ))}
      </div>
    </div>
  );
}
