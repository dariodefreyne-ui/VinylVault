import { useState } from 'react';
import { colors, radius, buttonStyle } from '../../styles/tokens.js';
import RoleBadge from './RoleBadge.jsx';

const ROLES = ['pending', 'lid', 'beheerder', 'admin'];

function sortUsers(items) {
  return [...items].sort((a, b) => {
    const aPending = a.role === 'pending' ? 0 : 1;
    const bPending = b.role === 'pending' ? 0 : 1;
    if (aPending !== bPending) return aPending - bPending;
    const aTime =
      a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
    const bTime =
      b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
    return aTime - bTime;
  });
}

function formatDate(ts) {
  if (!ts) return '—';
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('nl-BE');
  } catch {
    return '—';
  }
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  backgroundColor: colors.bgCard,
  borderRadius: radius.md,
  overflow: 'hidden',
};

const thStyle = {
  backgroundColor: colors.bgHover,
  fontSize: '12px',
  textTransform: 'uppercase',
  color: colors.textSecondary,
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: 600,
  letterSpacing: '0.5px',
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: '14px',
  color: colors.textPrimary,
  borderBottom: `1px solid ${colors.borderColor}`,
};

const selectStyle = {
  backgroundColor: colors.bgHover,
  color: colors.textPrimary,
  border: `1px solid ${colors.borderColor}`,
  borderRadius: radius.sm,
  padding: '4px 8px',
  fontSize: '13px',
  cursor: 'pointer',
  marginRight: '8px',
};

export default function UserTable({ users, onRoleChange, onDelete }) {
  const [hovered, setHovered] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [pendingRole, setPendingRole] = useState(null);
  const sorted = sortUsers(users);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Naam</th>
            <th style={thStyle}>E-mail</th>
            <th style={thStyle}>Rol</th>
            <th style={thStyle}>Geregistreerd</th>
            <th style={thStyle}>Acties</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((user) => (
            <tr
              key={user.id}
              style={{
                backgroundColor: hovered === user.id ? colors.bgHover : 'transparent',
                transition: 'background-color 0.1s ease',
              }}
              onMouseEnter={() => setHovered(user.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <td style={tdStyle}>{user.displayName || user.name || '—'}</td>
              <td style={tdStyle}>{user.email || '—'}</td>
              <td style={tdStyle}>
                <RoleBadge role={user.role} />
              </td>
              <td style={{ ...tdStyle, color: colors.textSecondary }}>
                {formatDate(user.createdAt)}
              </td>
              <td style={tdStyle}>
                <select
                  style={selectStyle}
                  value={pendingRole?.userId === user.id ? pendingRole.newRole : (user.role || 'pending')}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    if (newRole === (user.role || 'pending')) {
                      setPendingRole(null);
                      return;
                    }
                    setPendingRole({ userId: user.id, newRole });
                  }}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
                {pendingRole?.userId === user.id && (
                  <>
                    <span style={{ fontSize: '12px', color: colors.accentRed, marginRight: '6px' }}>
                      Rol wijzigen naar {pendingRole.newRole}?
                    </span>
                    <button
                      style={{ ...buttonStyle('danger'), padding: '4px 10px', fontSize: '12px', marginRight: '6px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRoleChange(user.id, pendingRole.newRole);
                        setPendingRole(null);
                      }}
                    >
                      Ja, wijzig rol
                    </button>
                    <button
                      style={{ ...buttonStyle('ghost'), padding: '4px 10px', fontSize: '12px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingRole(null);
                      }}
                    >
                      Annuleren
                    </button>
                  </>
                )}
                {confirmDelete === user.id ? (
                  <>
                    <span style={{ fontSize: '12px', color: colors.accentRed, marginRight: '6px' }}>Zeker?</span>
                    <button
                      style={{ ...buttonStyle('danger'), padding: '4px 10px', fontSize: '12px', marginRight: '6px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(null);
                        onDelete(user.id);
                      }}
                    >
                      Ja, verwijder
                    </button>
                    <button
                      style={{ ...buttonStyle('ghost'), padding: '4px 10px', fontSize: '12px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(null);
                      }}
                    >
                      Annuleren
                    </button>
                  </>
                ) : (
                  <button
                    style={{
                      ...buttonStyle('danger'),
                      padding: '4px 10px',
                      fontSize: '12px',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(user.id);
                    }}
                  >
                    Verwijder
                  </button>
                )}
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td
                colSpan={5}
                style={{ ...tdStyle, textAlign: 'center', color: colors.textSecondary }}
              >
                Geen gebruikers gevonden.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
