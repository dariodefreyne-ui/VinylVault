import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithEmail } from '../firebase/auth.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { isActivated } from '../utils/roles.js';
import { colors, radius, buttonStyle } from '../styles/tokens.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { role } = useAuth();
  const showToast = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
      // role will update via onAuthChange; read fresh role from Firestore via redirect logic
      // We navigate based on current role after login — useAuth will refresh automatically
      // Use a small delay to let the auth state settle, but we rely on the router guards
      navigate('/');
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Ongeldig e-mailadres of wachtwoord.'
        : err.message || 'Inloggen mislukt.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  }

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

  const pageStyle = {
    minHeight: '100vh',
    backgroundColor: colors.bgPrimary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
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
          <h1 style={headingStyle}>Inloggen</h1>
          <p style={subStyle}>Welkom bij VinylVault</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              autoComplete="current-password"
              style={inputStyle}
              placeholder="••••••••"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            style={{ ...buttonStyle('primary'), width: '100%', justifyContent: 'center', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Bezig...' : 'Inloggen'}
          </button>
        </form>
        <p style={{ fontSize: '13px', color: colors.textSecondary, margin: 0, textAlign: 'center' }}>
          Nog geen account?{' '}
          <Link to="/register" style={linkStyle}>Registreer je hier</Link>
        </p>
      </div>
    </div>
  );
}
