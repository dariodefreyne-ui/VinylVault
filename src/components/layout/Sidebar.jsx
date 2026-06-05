import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { logout } from '../../firebase/auth.js';
import { isAdmin, isBeheerder } from '../../utils/roles.js';
import { colors, radius, fonts, badgeStyle, buttonStyle } from '../../styles/tokens.js';
import Icon from '../ui/Icon.jsx';

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
        color: isActive ? colors.brand : colors.textPrimary,
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
      <Icon name={icon} size={18} />
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
          className='vv-logo'
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '11px',
            padding: '20px 16px 14px',
            borderBottom: `1px solid ${colors.borderColor}`,
          }}
        >
          <span className='vv-logo-disc' style={{ color: colors.brand, display: 'flex' }}>
            <Icon name='disc' size={26} strokeWidth={1.5} />
          </span>
          <div
            style={{
              fontFamily: fonts.display,
              fontSize: '21px',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              color: colors.textPrimary,
            }}
          >
            Vinyl<span style={{ color: colors.brand }}>Vault</span>
          </div>
        </div>

        {/* Nav groups */}
        {/* Op mobiel: sluit de overlay zodra op een item geklikt wordt. */}
        <nav style={{ flex: 1, padding: '8px' }} onClick={onClose}>
          {/* Groep 1 — Collectie */}
          <GroupLabel>Collectie</GroupLabel>
          <NavItem to='/' end icon='home' label='Home' />
          <NavItem to='/platen' icon='disc' label="Alle Lp's" />
          <NavItem to='/wishlist' icon='heart' label='Wishlist' />
          <NavItem to='/statistieken' icon='chart' label='Statistieken' />
          <NavItem to='/profiel' icon='user' label='Profiel' />

          {/* Groep 2 — Beheer */}
          {isBeheerder(role) && (
            <>
              <GroupLabel>Beheer</GroupLabel>
              <NavItem to='/platen/nieuw' icon='plus' label='Lp toevoegen' />
            </>
          )}

          {/* Groep 3 — Admin */}
          {isAdmin(role) && (
            <>
              <GroupLabel>Admin</GroupLabel>
              <NavItem to='/admin' icon='shield' label='Gebruikers' />
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
            <Icon name='logout' size={16} /> Uitloggen
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
        .vv-logo-disc { transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1); }
        .vv-logo:hover .vv-logo-disc { transform: rotate(360deg); }
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
