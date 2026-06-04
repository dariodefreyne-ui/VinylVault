import { useState } from 'react';
import { useAdmin } from '../hooks/useAdmin.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { isAdmin, isBeheerder } from '../utils/roles.js';
import UserTable from '../components/admin/UserTable.jsx';
import ImportModal from '../components/ImportModal.jsx';
import { colors, radius, buttonStyle } from '../styles/tokens.js';

const pageStyle = {
  padding: '32px',
  maxWidth: '1100px',
  margin: '0 auto',
};

const headingStyle = {
  fontSize: '26px',
  fontWeight: 700,
  color: colors.textPrimary,
  marginBottom: '28px',
};

const statCardStyle = {
  backgroundColor: colors.bgCard,
  border: `1px solid ${colors.borderColor}`,
  borderRadius: radius.md,
  padding: '12px 20px',
  minWidth: '130px',
};

const statLabelStyle = {
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: colors.textSecondary,
  marginBottom: '4px',
};

const statValueStyle = (color) => ({
  fontSize: '24px',
  fontWeight: 700,
  color: color || colors.textPrimary,
});

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalCardStyle = {
  backgroundColor: colors.bgCard,
  border: `1px solid ${colors.borderColor}`,
  borderRadius: radius.lg,
  padding: '28px 32px',
  width: '100%',
  maxWidth: '400px',
};

export default function Admin() {
  const { role } = useAuth();
  const { users, loading, updateUserRole, deleteUser } = useAdmin();
  const showToast = useToast();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  const pendingCount = users.filter((u) => u.role === 'pending').length;
  const lidCount = users.filter((u) => u.role === 'lid').length;
  const beheerderCount = users.filter(
    (u) => u.role === 'beheerder' || u.role === 'admin'
  ).length;

  async function handleRoleChange(uid, newRole) {
    try {
      await updateUserRole(uid, newRole);
      showToast('Rol bijgewerkt.', 'success');
    } catch {
      showToast('Fout bij bijwerken van rol.', 'error');
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirm) return;
    try {
      await deleteUser(deleteConfirm);
      showToast('Gebruiker verwijderd.', 'success');
    } catch {
      showToast('Fout bij verwijderen van gebruiker.', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  }

  return (
    <div style={pageStyle}>
      {/* Page header */}
      <div style={headingStyle}>Admin — Gebruikersbeheer</div>

      {/* Stats strip */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '24px',
        }}
      >
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Totaal gebruikers</div>
          <div style={statValueStyle()}>{users.length}</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Pending</div>
          <div style={statValueStyle(pendingCount > 0 ? colors.accentRed : undefined)}>
            {pendingCount}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Leden</div>
          <div style={statValueStyle(colors.accentBlue)}>{lidCount}</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Beheerders</div>
          <div style={statValueStyle(colors.accentGreen)}>{beheerderCount}</div>
        </div>
      </div>

      {/* Pending banner */}
      {pendingCount > 0 && (
        <div
          style={{
            backgroundColor: colors.orangeDim,
            border: `1px solid ${colors.accentOrange}`,
            borderRadius: radius.md,
            padding: '12px 16px',
            marginBottom: '24px',
            fontSize: '14px',
            color: colors.accentOrange,
          }}
        >
          ⚠️ {pendingCount} gebruiker(s) wachten op activatie.
        </div>
      )}

      {/* User table */}
      {loading ? (
        <div style={{ color: colors.textSecondary, fontSize: '14px' }}>
          Gebruikers laden...
        </div>
      ) : (
        <UserTable
          users={users}
          onRoleChange={handleRoleChange}
          onDelete={(uid) => setDeleteConfirm(uid)}
        />
      )}

      {/* Import button */}
      {isBeheerder(role) && (
        <div style={{ marginTop: '28px' }}>
          <button
            style={buttonStyle('secondary')}
            onClick={() => setImportOpen(true)}
          >
            📥 Importeer collectie
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm !== null && (
        <div style={overlayStyle} onClick={() => setDeleteConfirm(null)}>
          <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: colors.textPrimary,
                marginBottom: '8px',
              }}
            >
              Gebruiker verwijderen?
            </div>
            <div
              style={{
                fontSize: '14px',
                color: colors.textSecondary,
                marginBottom: '24px',
              }}
            >
              Dit kan niet ongedaan worden.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                style={buttonStyle('secondary')}
                onClick={() => setDeleteConfirm(null)}
              >
                Annuleer
              </button>
              <button style={buttonStyle('danger')} onClick={handleDeleteConfirm}>
                Verwijder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import modal */}
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
