import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../firebase/auth.js';
import { useToast } from '../components/ui/Toast.jsx';
import { colors, radius, buttonStyle } from '../styles/tokens.js';

export default function Register() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const showToast = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast('Wachtwoorden komen niet overeen.', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Wachtwoord moet minstens 6 tekens bevatten.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await registerUser(email, password, displayName);
      navigate('/pending');
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'Dit e-mailadres is al in gebruik.'
        : err.message || 'Registratie mislukt.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
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
    maxWidth: '400px',
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radius.lg,
    padding: '36px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  };

  const labelStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '13px',
    color: colors.textSecondary,
    fontWeight: 500,
  };

  const inputStyle = {
    padding: '10px 12px',
    borderRadius: radius.md,
    border: `1px solid ${colors.borderColor}`,
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  const headingStyle = {
    fontSize: '22px',
    fontWeight: 700,
    color: colors.textPrimary,
    margin: 0,
  };

  const subStyle = {
    fontSize: '13px',
    color: colors.textSecondary,
    margin: 0,
  };

  const linkStyle = {
    color: colors.accentRed,
    textDecoration: 'none',
    fontWeight: 500,
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div>
          <h1 style={headingStyle}>Registreren</h1>
          <p style={subStyle}>Maak een account aan voor VinylVault</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={labelStyle}>
            Naam
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoComplete="name"
              style={inputStyle}
              placeholder="Jan Janssen"
            />
          </label>
          <label style={labelStyle}>
            E-mailadres
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={inputStyle}
              placeholder="jouw@email.be"
            />
          </label>
          <label style={labelStyle}>
            Wachtwoord
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              style={inputStyle}
              placeholder="••••••••"
            />
          </label>
          <label style={labelStyle}>
            Bevestig wachtwoord
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              style={inputStyle}
              placeholder="••••••••"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            style={{ ...buttonStyle('primary'), width: '100%', justifyContent: 'center', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Bezig...' : 'Account aanmaken'}
          </button>
        </form>
        <p style={{ fontSize: '13px', color: colors.textSecondary, margin: 0, textAlign: 'center' }}>
          Al een account?{' '}
          <Link to="/login" style={linkStyle}>Log hier in</Link>
        </p>
      </div>
    </div>
  );
}
