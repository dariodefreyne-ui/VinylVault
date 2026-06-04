import { useNavigate } from 'react-router-dom';
import { logout } from '../firebase/auth.js';
import { colors, radius, buttonStyle } from '../styles/tokens.js';

export default function Pending() {
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const pageStyle = {
    minHeight: '100vh',
    backgroundColor: colors.bgPrimary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  };

  const cardStyle = {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radius.lg,
    padding: '48px 36px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    textAlign: 'center',
  };

  const iconStyle = {
    fontSize: '48px',
    lineHeight: 1,
  };

  const headingStyle = {
    fontSize: '20px',
    fontWeight: 700,
    color: colors.textPrimary,
    margin: 0,
  };

  const bodyStyle = {
    fontSize: '15px',
    color: colors.textSecondary,
    margin: 0,
    lineHeight: 1.6,
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={iconStyle}>&#128336;</div>
        <h1 style={headingStyle}>Account wordt geverifieerd</h1>
        <p style={bodyStyle}>
          Je account wacht op activatie. De beheerder is verwittigd.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          style={buttonStyle('secondary')}
        >
          Uitloggen
        </button>
      </div>
    </div>
  );
}
