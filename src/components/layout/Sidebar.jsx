import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { logout } from '../../firebase/auth.js';
import { isAdmin, isBeheerder } from '../../utils/roles.js';
import { colors, radius, badgeStyle, buttonStyle } from '../../styles/tokens.js';

const SIDEBAR_WIDTH = 260;

function roleLabel(role) {
  const map = {
    admin: 'Admin',
    beheerder: 'Beheerder',
    lid: 'Lid',
    pending: 'In afwachting',
  };
  return map[role] || role || '';
}

function roleBadgeColor(role) {
  const map = {
    admin: 'red',
    beheerder: 'orange',
    lid: 'green',
    pending: 'blue',
  };
  return map[role] || 'blue';
}

function GroupLabel({ children }) {
  return (
    <div
      style={{
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: colors.textSecondary,
        padding: '16px 16px 4px',
      }}
    >
      {children}
    </div>
  );
}

function NavItem({ to, icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        borderRadius: radius.md,
        fontSize: '14px',
        fontWeight: isActive ? 600 : 400,
        color: isActive ? colors.accentRed : colors.textPrimary,
        backgroundColor: 'transparent',
        textDecoration: 'none',
        transition: 'background-color 0.15s ease, color 0.15s ease',
        cursor: 'pointer',
      })}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.bgHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <span style={{ fontSize: '16px', flexShrink: 0 }}>{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, userDoc, role } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch {
      // ignore
    }
  }

  const displayName = userDoc?.displayName || user?.email || 'Gebruiker';

  const sidebarStyle = {
    width: `${SIDEBAR_WIDTH}px`,
    minWidth: `${SIDEBAR_WIDTH}px`,
    height: '100vh',
    backgroundColor: colors.bgCard,
    borderRight: `1px solid ${colors.borderColor}`,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    overflowY: 'auto',
    position: 'relative',
    zIndex: 10,
  };

  // Mobile: overlay mode
  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    zIndex: 200,
    display: 'flex',
  };

  const backdropStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 200,
  };

  const mobileSidebarStyle = {
    ...sidebarStyle,
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 201,
    boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
  };

  function SidebarContent({ style }) {
    return (
      <div style={style}>
        {/* Logo / App title */}
        <div
          style={{
            padding: '20px 16px 12px',
            borderBottom: `1px solid ${colors.borderColor}`,
          }}
        >
          <div
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: colors.textPrimary,
              letterSpacing: '-0.01em',
            }}
          >
            🎵 VinylVault
          </div>
        </div>

        {/* Nav groups */}
        <nav style={{ flex: 1, padding: '8px' }}>
          {/* Groep 1 — Collectie */}
          <GroupLabel>Collectie</GroupLabel>
          <NavItem to='/' end icon='🏠' label='Home' />
          <NavItem to='/platen' icon='🎵' label='Alle Platen' />
          <NavItem to='/wishlist' icon='❤️' label='Wishlist' />
          <NavItem to='/statistieken' icon='📊' label='Statistieken' />

          {/* Groep 2 — Beheer */}
          {isBeheerder(role) && (
            <>
              <GroupLabel>Beheer</GroupLabel>
              <NavItem to='/platen/nieuw' icon='➕' label='Plaat toevoegen' />
            </>
          )}

          {/* Groep 3 — Admin */}
          {isAdmin(role) && (
            <>
              <GroupLabel>Admin</GroupLabel>
              <NavItem to='/admin' icon='👤' label='Gebruikers' />
            </>
          )}
        </nav>

        {/* Footer: user info + logout */}
        <div
          style={{
            borderTop: `1px solid ${colors.borderColor}`,
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: colors.textPrimary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayName}
            </span>
            {role && (
              <span style={badgeStyle(roleBadgeColor(role))}>{roleLabel(role)}</span>
            )}
          </div>
          <button
            onClick={handleLogout}
            style={{
              ...buttonStyle('ghost'),
              fontSize: '13px',
              padding: '6px 0',
              justifyContent: 'flex-start',
              color: colors.textSecondary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = colors.accentRed;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = colors.textSecondary;
            }}
          >
            🚪 Uitloggen
          </button>
        </div>
      </div>
    );
  }

  // Desktop: always visible as sidebar column
  // Mobile: hidden unless mobileOpen
  return (
    <>
      {/* Desktop sidebar */}
      <div
        className='sidebar-desktop'
        style={{
          ...sidebarStyle,
          display: 'none', // overridden by media query in index.css / or handled inline via JS
        }}
      >
        <SidebarContent style={{ display: 'flex', flexDirection: 'column', height: '100%' }} />
      </div>

      {/* We use a style tag trick for desktop visibility */}
      <style>{`
        @media (min-width: 768px) {
          .sidebar-desktop { display: flex !important; flex-direction: column; }
          .sidebar-mobile-overlay { display: none !important; }
        }
        @media (max-width: 767px) {
          .sidebar-desktop { display: none !important; }
        }
      `}</style>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className='sidebar-mobile-overlay' style={overlayStyle}>
          <div style={backdropStyle} onClick={onClose} aria-hidden='true' />
          <SidebarContent style={mobileSidebarStyle} />
        </div>
      )}
    </>
  );
}
