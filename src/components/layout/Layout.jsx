import { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import { colors } from '../../styles/tokens.js';

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function openMobile() {
    setMobileOpen(true);
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  const shellStyle = {
    display: 'flex',
    height: '100vh',
    width: '100%',
    backgroundColor: colors.bgPrimary,
    overflow: 'hidden',
  };

  const mainWrapStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overflow: 'hidden',
  };

  const topBarStyle = {
    height: '56px',
    minHeight: '56px',
    backgroundColor: colors.bgCard,
    borderBottom: `1px solid ${colors.borderColor}`,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 16px',
  };

  const hamburgerStyle = {
    background: 'none',
    border: 'none',
    color: colors.textPrimary,
    fontSize: '22px',
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: '6px',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const topBarTitleStyle = {
    fontSize: '16px',
    fontWeight: 700,
    color: colors.textPrimary,
    letterSpacing: '-0.01em',
  };

  const contentStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
  };

  return (
    <>
      <style>{`
        .layout-topbar {
          display: none;
        }
        @media (max-width: 767px) {
          .layout-topbar {
            display: flex !important;
          }
          .layout-content {
            padding: 16px !important;
          }
        }
      `}</style>

      <div style={shellStyle}>
        <Sidebar mobileOpen={mobileOpen} onClose={closeMobile} />

        <div style={mainWrapStyle}>
          {/* Mobile top bar */}
          <div className='layout-topbar' style={topBarStyle}>
            <button
              style={hamburgerStyle}
              onClick={openMobile}
              aria-label='Menu openen'
            >
              ☰
            </button>
            <span style={topBarTitleStyle}>VinylVault</span>
          </div>

          {/* Page content */}
          <div className='layout-content' style={contentStyle}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
