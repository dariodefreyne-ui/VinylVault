import { useState, useRef } from 'react';
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
  const inFlight = useRef(false);
  const navigate = useNavigate();
  const showToast = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    if (inFlight.current) return;

    if (password !== confirmPassword) {
      showToast('Wachtwoorden komen niet overeen.', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Wachtwoord moet minstens 6 tekens bevatten.', 'error');
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    try {
      await registerUser(email, password, displayName);
      navigate('/pending');
    } catch (err) {
      console.error('Register error:', err.code, err.message);
      const msg = err.code === 'auth/email-already-in-use'
        ? 'Dit e-mailadres is al in gebruik. Probeer in te loggen of gebruik wachtwoord vergeten.'
        : 'Registratie is mislukt. Probeer het opnieuw of neem contact op met een beheerder.';
      showToast(msg, 'error');
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  const pageStyle = {
    minHeight: '100dvh',
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
    fontSize: '16px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
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
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
            Registreren
          </h1>
          <p style={{ fontSize: '13px', color: colors.textSecondary, margin: '6px 0 0' }}>
            Maak een account aan voor VinylVault
          </p>
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
