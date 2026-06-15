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
    height: '100dvh',
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
    height: 'calc(56px + env(safe-area-inset-top))',
    minHeight: 'calc(56px + env(safe-area-inset-top))',
    backgroundColor: colors.bgCard,
    borderBottom: `1px solid ${colors.borderColor}`,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingTop: 'env(safe-area-inset-top)',
    paddingLeft: '16px',
    paddingRight: '16px',
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
    overflowX: 'hidden',
    overscrollBehavior: 'contain',
    WebkitOverflowScrolling: 'touch',
    padding: '24px',
    minWidth: 0,
  };

  return (
    <div style={shellStyle}>
      <Sidebar mobileOpen={mobileOpen} onClose={closeMobile} />
      <div style={mainWrapStyle}>
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
        <div id='vv-scroll' className='layout-content' style={contentStyle}>
          {children}
        </div>
      </div>
    </div>
  );
}
