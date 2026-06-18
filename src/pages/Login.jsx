import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithEmail, resetPassword } from '../firebase/auth.js';
import { useToast } from '../components/ui/Toast.jsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { isActivated } from '../utils/roles.js';
import { colors, radius, buttonStyle } from '../styles/tokens.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSending, setResetSending] = useState(false);
  const navigate = useNavigate();
  const showToast = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const credential = await loginWithEmail(email, password);
      const uid = credential.user.uid;
      const snap = await getDoc(doc(db, 'users', uid));
      const role = snap.exists() ? snap.data().role || null : null;
      if (!isActivated(role)) {
        navigate('/pending');
      } else {
        navigate('/');
      }
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Ongeldig e-mailadres of wachtwoord.'
        : err.message || 'Inloggen mislukt.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setResetSending(true);
    try {
      await resetPassword(resetEmail);
      showToast('Als dit e-mailadres bekend is, ontvang je een reset-link.', 'success');
      setForgotMode(false);
      setResetEmail('');
    } catch (err) {
      const msg = err.message || 'Versturen mislukt.';
      showToast(msg, 'error');
    } finally {
      setResetSending(false);
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

  if (forgotMode) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
              Wachtwoord vergeten
            </h1>
            <p style={{ fontSize: '13px', color: colors.textSecondary, margin: '6px 0 0' }}>
              Vul je e-mailadres in en we sturen je een reset-link.
            </p>
          </div>
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={labelStyle}>
              E-mailadres
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                autoFocus
                style={inputStyle}
                placeholder="jouw@email.be"
              />
            </label>
            <button
              type="submit"
              disabled={resetSending}
              style={{ ...buttonStyle('primary'), width: '100%', justifyContent: 'center', opacity: resetSending ? 0.7 : 1 }}
            >
              {resetSending ? 'Bezig...' : 'Stuur reset-link'}
            </button>
          </form>
          <button
            onClick={() => setForgotMode(false)}
            style={{ ...buttonStyle('ghost'), fontSize: '13px', padding: 0, color: colors.textSecondary }}
          >
            ← Terug naar inloggen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
            Inloggen
          </h1>
          <p style={{ fontSize: '13px', color: colors.textSecondary, margin: '6px 0 0' }}>
            Welkom bij VinylVault
          </p>
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
            <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Wachtwoord
              <button
                type="button"
                onClick={() => { setForgotMode(true); setResetEmail(email); }}
                style={{ ...buttonStyle('ghost'), fontSize: '12px', padding: 0, color: colors.accentRed }}
              >
                Wachtwoord vergeten?
              </button>
            </span>
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
