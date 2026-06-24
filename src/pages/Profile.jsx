import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useUsers, invalidateUsersCache } from '../hooks/useUsers.js';
import { useGrants, canViewCollection } from '../hooks/useGrants.js';
import { useToast } from '../components/ui/Toast.jsx';
import { ownerLabelOf } from '../utils/owners.js';
import { colors, radius, buttonStyle, badgeStyle, fonts, THEME_NAMES, THEME_LABELS } from '../styles/tokens.js';
import { useTheme } from '../hooks/useTheme.jsx';

const THEME_DESCRIPTIONS = {
  'warm-hifi': 'De standaard look: warme houtskool en messing-amber, rustig voor de ogen.',
  'crate-dig': 'Overdag tussen de bakken — kraft-karton en stoflicht.',
  'backroom-wax': 'Het achterkamertje na sluitingstijd — donker met neonlicht.',
};

const THEME_SWATCHES = {
  'warm-hifi': ['#141110', '#d9a05b', '#cf6a4c'],
  'crate-dig': ['#c7a572', '#b93a23', '#3d6b78'],
  'backroom-wax': ['#0f0e12', '#e8458f', '#4fa3d9'],
};

const pageStyle = {
  maxWidth: '900px',
  color: colors.textPrimary,
};

const headingStyle = {
  fontFamily: fonts.display,
  fontSize: '26px',
  fontWeight: 600,
  letterSpacing: '-0.01em',
  color: colors.textPrimary,
  marginBottom: '24px',
};

const cardStyle = {
  backgroundColor: colors.bgCard,
  border: `1px solid ${colors.borderColor}`,
  borderRadius: radius.md,
  padding: '24px',
  marginBottom: '24px',
};

const sectionTitleStyle = {
  fontSize: '16px',
  fontWeight: 700,
  color: colors.textPrimary,
  marginBottom: '4px',
};

const sectionSubStyle = {
  fontSize: '13px',
  color: colors.textSecondary,
  marginBottom: '18px',
};

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: colors.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  backgroundColor: colors.bgPrimary,
  border: `1px solid ${colors.borderColor}`,
  borderRadius: radius.sm,
  padding: '8px 12px',
  color: colors.textPrimary,
  fontSize: '16px',
  boxSizing: 'border-box',
  outline: 'none',
};

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  padding: '10px 0',
  borderBottom: `1px solid ${colors.borderColor}`,
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, userDoc } = useAuth();
  const { users } = useUsers();
  const { granted, received, grantAccess, revokeAccess } = useGrants();
  const showToast = useToast();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState('');
  const [collectionLabel, setCollectionLabel] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userDoc) {
      setDisplayName(userDoc.displayName || '');
      setCollectionLabel(userDoc.collectionLabel || userDoc.displayName || '');
      setVisibility(userDoc.collectionVisibility || 'public');
    }
  }, [userDoc]);

  const uid = user?.uid;
  const otherUsers = users.filter((u) => u.id !== uid);

  async function handleSave() {
    if (!collectionLabel.trim()) {
      showToast('Collectie-label mag niet leeg zijn.', 'error');
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', uid), {
        displayName: displayName.trim(),
        collectionLabel: collectionLabel.trim(),
        collectionVisibility: visibility,
      });
      invalidateUsersCache();
      showToast('Profiel opgeslagen.', 'success');
    } catch (err) {
      console.error('Profile: save failed', err);
      showToast('Fout bij opslaan profiel.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleGrant(targetUid, hasAccess) {
    try {
      if (hasAccess) await revokeAccess(targetUid);
      else await grantAccess(targetUid);
    } catch (err) {
      console.error('Profile: grant toggle failed', err);
      showToast('Fout bij wijzigen van toegang.', 'error');
    }
  }

  return (
    <div style={pageStyle}>
      <div style={headingStyle}>Mijn profiel</div>

      {/* Thema */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>Thema</div>
        <div style={sectionSubStyle}>Kies de sfeer waarin je je collectie bekijkt.</div>
        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {THEME_NAMES.map((name) => {
            const active = theme === name;
            return (
              <button
                key={name}
                onClick={() => setTheme(name)}
                style={{
                  textAlign: 'left',
                  backgroundColor: active ? colors.brandDim : colors.bgPrimary,
                  border: `1px solid ${active ? colors.brand : colors.borderColor}`,
                  borderRadius: radius.md,
                  padding: '14px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                  {THEME_SWATCHES[name].map((hex, i) => (
                    <span
                      key={i}
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: hex,
                        border: `1px solid ${colors.borderColor}`,
                      }}
                    />
                  ))}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary, marginBottom: '4px' }}>
                  {THEME_LABELS[name]}{active ? ' ✓' : ''}
                </div>
                <div style={{ fontSize: '12px', color: colors.textSecondary, lineHeight: 1.5 }}>
                  {THEME_DESCRIPTIONS[name]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Profiel + collectie-instellingen */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>Collectie-instellingen</div>
        <div style={sectionSubStyle}>
          Je collectie-label bepaalt welke lp's als "van jou" gelden.
        </div>

        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          <div>
            <label style={labelStyle}>Weergavenaam</label>
            <input
              style={inputStyle}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Jan Janssen"
            />
          </div>
          <div>
            <label style={labelStyle}>Collectie-label</label>
            <input
              style={inputStyle}
              value={collectionLabel}
              onChange={(e) => setCollectionLabel(e.target.value)}
              placeholder="bv. dario"
            />
          </div>
          <div>
            <label style={labelStyle}>Zichtbaarheid</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              <option value="public">Publiek — alle leden kunnen bladeren</option>
              <option value="private">Privé — enkel ikzelf en wie ik toegang geef</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button
            style={{ ...buttonStyle('primary'), opacity: saving ? 0.6 : 1 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Bezig...' : 'Opslaan'}
          </button>
        </div>
      </div>

      {/* Toegang tot mijn collectie (relevant bij privé) */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>Toegang tot mijn collectie</div>
        <div style={sectionSubStyle}>
          {visibility === 'private'
            ? 'Je collectie is privé. Enkel jij en de leden hieronder met toegang kunnen bladeren.'
            : 'Je collectie is publiek — iedereen kan bladeren. Toegang verlenen is enkel nodig bij een privé-collectie.'}
        </div>
        {otherUsers.length === 0 ? (
          <div style={{ fontSize: '13px', color: colors.textSecondary }}>
            Er zijn nog geen andere gebruikers.
          </div>
        ) : (
          otherUsers.map((u) => {
            const hasAccess = granted.some((g) => g.granteeUid === u.id);
            return (
              <div key={u.id} style={rowStyle}>
                <span style={{ fontSize: '14px' }}>{ownerLabelOf(u)}</span>
                <button
                  style={buttonStyle(hasAccess ? 'secondary' : 'primary')}
                  onClick={() => toggleGrant(u.id, hasAccess)}
                >
                  {hasAccess ? 'Toegang intrekken' : 'Toegang geven'}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Andere collecties bladeren */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>Andere collecties</div>
        <div style={sectionSubStyle}>
          Blader door de collectie van een ander lid.
        </div>
        {otherUsers.length === 0 ? (
          <div style={{ fontSize: '13px', color: colors.textSecondary }}>
            Er zijn nog geen andere gebruikers.
          </div>
        ) : (
          otherUsers.map((u) => {
            const canView = canViewCollection(u, uid, received);
            const isPrivate = (u.collectionVisibility || 'public') === 'private';
            return (
              <div key={u.id} style={rowStyle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                  {ownerLabelOf(u)}
                  {isPrivate && <span style={badgeStyle('orange')}>Privé</span>}
                </span>
                {canView ? (
                  <button
                    style={buttonStyle('secondary')}
                    onClick={() =>
                      navigate('/platen?owner=' + encodeURIComponent(ownerLabelOf(u)))
                    }
                  >
                    Bekijk collectie
                  </button>
                ) : (
                  <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                    Geen toegang
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
