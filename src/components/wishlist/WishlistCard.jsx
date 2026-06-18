import { useState } from 'react';
import { colors, radius, badgeStyle, buttonStyle, ownerColor } from '../../styles/tokens.js';
import Icon from '../ui/Icon.jsx';

function priorityBadgeStyle(priority) {
  if (priority === 'hoog') return badgeStyle('red');
  if (priority === 'normaal') return badgeStyle('orange');
  return {
    ...badgeStyle('blue'),
    backgroundColor: colors.bgHover,
    color: colors.textSecondary,
  };
}

function statusBadgeStyle(status) {
  if (status === 'actief') return badgeStyle('blue');
  if (status === 'gevonden') return badgeStyle('green');
  return {
    ...badgeStyle('blue'),
    backgroundColor: colors.bgHover,
    color: colors.textSecondary,
  };
}

const PRIORITY_LABELS = {
  hoog: 'Hoog',
  normaal: 'Normaal',
  laag: 'Laag',
};

const STATUS_LABELS = {
  actief: 'Actief',
  gevonden: 'Gevonden',
  gekocht: 'Gekocht',
};

export default function WishlistCard({ item, onEdit, onClick, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const {
    artist,
    title,
    owner,
    priority,
    status,
    targetPrice,
    notes,
  } = item;

  const ownerBadge = ownerColor(owner);
  const ownerLabel = owner;

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
    justifyContent: 'space-between',
    gap: '8px',
  };

  const artistStyle = {
    fontSize: '16px',
    fontWeight: 600,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const subtitleStyle = {
    fontSize: '14px',
    color: colors.textSecondary,
  };

  const subtitleItalicStyle = {
    fontSize: '14px',
    color: colors.textSecondary,
    fontStyle: 'italic',
  };

  const badgeRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  };

  const targetPriceStyle = {
    fontSize: '13px',
    fontWeight: 700,
    color: colors.accentGreen,
  };

  const notesStyle = {
    fontSize: '12px',
    color: colors.textSecondary,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  };

  const bottomRowStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: '2px',
  };

  const editBtnStyle = {
    ...buttonStyle('ghost'),
    fontSize: '12px',
    padding: '10px 12px',
    minHeight: '36px',
  };

  const deleteBtnStyle = {
    ...buttonStyle('danger'),
    fontSize: '12px',
    padding: '10px 12px',
    minHeight: '36px',
  };

  function handleEditClick(e) {
    e.stopPropagation();
    onEdit(item);
  }

  function handleDeleteClick(e) {
    e.stopPropagation();
    setConfirmingDelete(true);
  }

  function handleConfirmDelete(e) {
    e.stopPropagation();
    onDelete(item);
    setConfirmingDelete(false);
  }

  function handleCancelDelete(e) {
    e.stopPropagation();
    setConfirmingDelete(false);
  }

  return (
    <div
      style={cardStyle}
      onClick={() => onClick(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top row: artist + owner badge */}
      <div style={topRowStyle}>
        <div style={artistStyle}>{artist || 'Onbekende artiest'}</div>
        {owner && (
          <span style={{ flexShrink: 0, ...badgeStyle(ownerBadge) }}>
            {ownerLabel}
          </span>
        )}
      </div>

      {/* Subtitle: title */}
      {title ? (
        <div style={subtitleStyle}>{title}</div>
      ) : (
        <div style={subtitleItalicStyle}>Titel onbekend</div>
      )}

      {/* Badge row: priority + status */}
      <div style={badgeRowStyle}>
        {priority && (
          <span style={priorityBadgeStyle(priority)}>
            {PRIORITY_LABELS[priority] || priority}
          </span>
        )}
        {status && (
          <span style={statusBadgeStyle(status)}>
            {STATUS_LABELS[status] || status}
          </span>
        )}
      </div>

      {/* Target price */}
      {targetPrice != null && targetPrice !== '' && (
        <div style={targetPriceStyle}>
          Doel: &euro;{parseFloat(targetPrice).toFixed(2)}
        </div>
      )}

      {/* Notes */}
      {notes && notes.trim() && (
        <div style={notesStyle}>{notes}</div>
      )}

      {/* Bottom: edit + delete */}
      <div style={bottomRowStyle}>
        {confirmingDelete ? (
          <>
            <span style={{ fontSize: '12px', color: colors.accentRed, marginRight: '8px' }}>
              Verwijderen?
            </span>
            <button
              type="button"
              style={{ ...deleteBtnStyle, marginRight: '8px' }}
              onClick={handleConfirmDelete}
            >
              Ja
            </button>
            <button
              type="button"
              style={editBtnStyle}
              onClick={handleCancelDelete}
            >
              Annuleer
            </button>
          </>
        ) : (
          <>
            {onDelete && (
              <button
                type="button"
                style={{ ...deleteBtnStyle, marginRight: '8px' }}
                onClick={handleDeleteClick}
                aria-label="Verwijderen"
              >
                <Icon name="trash" size={14} /> Verwijderen
              </button>
            )}
            <button
              type="button"
              style={editBtnStyle}
              onClick={handleEditClick}
              aria-label="Bewerken"
            >
              <Icon name="edit" size={14} /> Bewerken
            </button>
          </>
        )}
      </div>
    </div>
  );
}
