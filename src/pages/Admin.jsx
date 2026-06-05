import { useState } from 'react';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { invalidateRecordsCache } from '../hooks/useRecords.js';
import { useAdmin } from '../hooks/useAdmin.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { isAdmin, isBeheerder } from '../utils/roles.js';
import UserTable from '../components/admin/UserTable.jsx';
import ImportModal from '../components/ImportModal.jsx';
import Icon from '../components/ui/Icon.jsx';
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
  const [wipeText, setWipeText] = useState('');
  const [wiping, setWiping] = useState(false);

  async function wipeAllRecords() {
    setWiping(true);
    try {
      const snap = await getDocs(collection(db, 'records'));
      const docs = snap.docs;
      const CHUNK = 400;
      for (let i = 0; i < docs.length; i += CHUNK) {
        const batch = writeBatch(db);
        docs.slice(i, i + CHUNK).forEach((d) => batch.delete(doc(db, 'records', d.id)));
        await batch.commit();
      }
      invalidateRecordsCache();
      setWipeText('');
      showToast(`${docs.length} lp's verwijderd. Je kunt nu opnieuw importeren.`, 'success');
    } catch (err) {
      console.error('Admin: wipe records failed', err);
      showToast('Fout bij verwijderen van lp\'s.', 'error');
    } finally {
      setWiping(false);
    }
  }

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
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Icon name="alert" size={16} /> {pendingCount} gebruiker(s) wachten op activatie.
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
            <Icon name="download" size={15} /> Importeer collectie
          </button>
        </div>
      )}

      {/* Gevarenzone — alle lp's wissen (voor een schone herstart) */}
      {isAdmin(role) && (
        <div
          style={{
            marginTop: '36px',
            border: `1px solid ${colors.accentRed}`,
            borderRadius: radius.md,
            padding: '20px',
            backgroundColor: 'rgba(207,106,76,0.06)',
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: 700, color: colors.accentRed, marginBottom: '6px' }}>
            Gevarenzone — alle lp's verwijderen
          </div>
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '14px', lineHeight: 1.6 }}>
            Verwijdert <strong>alle</strong> lp's uit de collectie (gebruikers en instellingen
            blijven). Handig om bij dubbele data schoon te herbeginnen en daarna je Excel
            opnieuw te importeren. Dit kan niet ongedaan gemaakt worden. Typ <strong>VERWIJDER</strong>
            om te bevestigen.
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              value={wipeText}
              onChange={(e) => setWipeText(e.target.value)}
              placeholder="VERWIJDER"
              style={{
                backgroundColor: colors.bgPrimary,
                border: `1px solid ${colors.borderColor}`,
                borderRadius: radius.sm,
                padding: '8px 12px',
                color: colors.textPrimary,
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <button
              style={{
                ...buttonStyle('danger'),
                opacity: wipeText === 'VERWIJDER' && !wiping ? 1 : 0.5,
                cursor: wipeText === 'VERWIJDER' && !wiping ? 'pointer' : 'not-allowed',
              }}
              onClick={wipeAllRecords}
              disabled={wipeText !== 'VERWIJDER' || wiping}
            >
              {wiping ? 'Bezig met verwijderen…' : 'Verwijder alle lp\'s'}
            </button>
          </div>
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
