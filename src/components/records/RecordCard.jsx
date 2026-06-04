import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, radius, badgeStyle, chipStyle } from '../../styles/tokens.js';

export default function RecordCard({ record }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const {
    id,
    artist,
    title,
    year,
    format,
    label: recordLabel,
    price,
    condition,
    genres,
    coverImageUrl,
    owner,
  } = record;

  const ownerLower = (owner || '').toLowerCase();
  const ownerColor = ownerLower === 'dario' ? 'red' : 'blue';
  const ownerLabel = ownerLower === 'dario' ? 'Dario' : ownerLower === 'papa' ? 'Papa' : owner;

  const visibleGenres = Array.isArray(genres) ? genres.slice(0, 2) : [];

  const subParts = [year, format, recordLabel].filter(Boolean);

  const cardStyle = {
    backgroundColor: colors.bgCard,
    border: `1px solid ${hovered ? colors.accentRed : colors.borderColor}`,
    borderRadius: radius.md,
    padding: '16px',
    cursor: 'pointer',
    transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
    transition: 'border-color 0.15s ease, transform 0.15s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  };

  const topRowStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  };

  const thumbStyle = {
    width: '60px',
    height: '60px',
    borderRadius: radius.sm,
    objectFit: 'cover',
    flexShrink: 0,
    backgroundColor: colors.bgHover,
  };

  const placeholderStyle = {
    width: '60px',
    height: '60px',
    borderRadius: radius.sm,
    backgroundColor: colors.bgHover,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    flexShrink: 0,
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
            <span role="img" aria-label="vinyl">🎵</span>
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
            <span style={badgeStyle(ownerColor)}>{ownerLabel}</span>
          </div>
        )}
      </div>

      {/* Bottom row: price + condition + genre chips */}
      <div style={bottomRowStyle}>
        {price != null && price !== '' ? (
          <span style={priceStyle}>€ {parseFloat(price).toFixed(2)}</span>
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
