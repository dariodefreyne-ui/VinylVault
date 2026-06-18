import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config.js';
import { logout } from '../../firebase/auth.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useToast } from '../ui/Toast.jsx';
import Icon from '../ui/Icon.jsx';
import { colors, radius, buttonStyle } from '../../styles/tokens.js';

const INACTIVITY_MS = 600000; // 10 minutes
const MAX_ATTEMPTS = 5;
const PIN_LENGTH = 4;

async function hashPin(pin) {
  const data = new TextEncoder().encode(pin + 'vinylvault-2025');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function isHashFormat(value) {
  return /^[0-9a-f]{64}$/.test(value);
}

function PinInput({ value, onChange, onSubmit, label, disabled }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && value.length === PIN_LENGTH) {
      onSubmit();
    }
  }

  function handleChange(e) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH);
    onChange(raw);
  }

  const boxesStyle = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '24px',
  };

  const digitBoxStyle = (filled) => ({
    width: '52px',
    height: '64px',
    borderRadius: radius.md,
    border: `2px solid ${filled ? colors.accentRed : colors.borderColor}`,
    backgroundColor: colors.bgPrimary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    fontWeight: 700,
    color: colors.textPrimary,
    transition: 'border-color 0.15s ease',
    position: 'relative',
  });

  const hiddenInputStyle = {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
    pointerEvents: 'none',
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '20px', fontSize: '14px', color: colors.textSecondary }}>
        {label}
      </div>
      {/* Invisible input to capture typing */}
      <input
        ref={inputRef}
        type='tel'
        inputMode='numeric'
        pattern='[0-9]*'
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label={label}
        style={hiddenInputStyle}
        autoComplete='off'
      />
      {/* Visual digit boxes — clicking focuses the hidden input */}
      <div
        style={boxesStyle}
        onClick={() => inputRef.current && inputRef.current.focus()}
      >
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div key={i} style={digitBoxStyle(i < value.length)}>
            {value[i] ? '•' : ''}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PincodeLock() {
  const { user, userDoc } = useAuth();
  const showToast = useToast();

  const [locked, setLocked] = useState(false);
  const [phase, setPhase] = useState('enter'); // 'enter' | 'setup' | 'confirm'
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [setupPin, setSetupPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [busy, setBusy] = useState(false);

  const timerRef = useRef(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setLocked(true);
    }, INACTIVITY_MS);
  }, []);

  // Set up activity listeners
  useEffect(() => {
    if (!user) return;

    const events = ['mousemove', 'keydown', 'click', 'touchstart'];

    function handleActivity() {
      if (!locked) {
        resetTimer();
      }
    }

    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, locked, resetTimer]);

  // When overlay becomes active, determine phase based on stored pincode
  useEffect(() => {
    if (locked) {
      const stored = userDoc?.pincode;
      // Only treat as set if it's the new SHA-256 format (64 hex chars); old btoa pins force re-setup
      const hasPincode = stored != null && stored !== '' && isHashFormat(stored);
      setPhase(hasPincode ? 'enter' : 'setup');
      setPin('');
      setPinConfirm('');
      setSetupPin('');
      setAttempts(0);
    }
  }, [locked, userDoc]);

  if (!locked) return null;

  // --- Handlers ---

  async function handleEnterSubmit() {
    if (pin.length !== PIN_LENGTH) return;
    const stored = userDoc?.pincode;
    if (await hashPin(pin) === stored) {
      setLocked(false);
      setPin('');
      setAttempts(0);
      resetTimer();
    } else {
      const next = attempts + 1;
      setAttempts(next);
      setPin('');
      if (next >= MAX_ATTEMPTS) {
        showToast('Te veel foutieve pogingen. Je wordt uitgelogd.', 'error');
        await logout();
      } else {
        showToast(`Verkeerde pincode. Nog ${MAX_ATTEMPTS - next} poging(en).`, 'error');
      }
    }
  }

  function handleSetupNext() {
    if (pin.length !== PIN_LENGTH) return;
    setSetupPin(pin);
    setPin('');
    setPhase('confirm');
  }

  async function handleConfirmSubmit() {
    if (pinConfirm.length !== PIN_LENGTH) return;
    if (pinConfirm !== setupPin) {
      showToast('Pincodes komen niet overeen. Probeer opnieuw.', 'error');
      setPinConfirm('');
      setSetupPin('');
      setPin('');
      setPhase('setup');
      return;
    }
    setBusy(true);
    try {
      const ref = doc(db, 'users', user.uid);
      await updateDoc(ref, { pincode: await hashPin(pinConfirm) });
      setLocked(false);
      setPin('');
      setPinConfirm('');
      setSetupPin('');
      resetTimer();
      showToast('Pincode opgeslagen!', 'success');
    } catch {
      showToast('Fout bij opslaan pincode. Probeer opnieuw.', 'error');
    } finally {
      setBusy(false);
    }
  }

  // --- Styles ---

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    zIndex: 9000,
    backgroundColor: 'rgba(0,0,0,0.92)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)',
    paddingLeft: 'env(safe-area-inset-left)',
    paddingRight: 'env(safe-area-inset-right)',
  };

  const cardStyle = {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: '40px 36px 32px',
    width: '100%',
    maxWidth: '360px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
    textAlign: 'center',
  };

  const headingStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '9px',
    fontSize: '20px',
    fontWeight: 700,
    color: colors.textPrimary,
    marginBottom: '8px',
  };

  const subStyle = {
    fontSize: '13px',
    color: colors.textSecondary,
    marginBottom: '32px',
    lineHeight: 1.5,
  };

  const attemptsStyle = {
    fontSize: '12px',
    color: colors.accentRed,
    marginTop: '-12px',
    marginBottom: '16px',
  };

  const submitBtnStyle = {
    ...buttonStyle('primary'),
    width: '100%',
    justifyContent: 'center',
    padding: '12px',
    fontSize: '15px',
  };

  const disabledBtnStyle = {
    ...submitBtnStyle,
    opacity: 0.5,
    cursor: 'not-allowed',
  };

  // --- Render phases ---

  if (phase === 'enter') {
    return (
      <div style={overlayStyle} role='dialog' aria-modal='true' aria-label='Pincode vergrendeld'>
        <div style={cardStyle}>
          <div style={headingStyle}><Icon name="lock" size={20} /> Scherm vergrendeld</div>
          <div style={subStyle}>
            Voer je pincode in om door te gaan.
          </div>
          <PinInput
            value={pin}
            onChange={setPin}
            onSubmit={handleEnterSubmit}
            label='Voer pincode in'
            disabled={busy}
          />
          {attempts > 0 && (
            <div style={attemptsStyle}>
              Onjuiste pincode. Nog {MAX_ATTEMPTS - attempts} poging(en).
            </div>
          )}
          <button
            style={pin.length === PIN_LENGTH && !busy ? submitBtnStyle : disabledBtnStyle}
            onClick={handleEnterSubmit}
            disabled={pin.length !== PIN_LENGTH || busy}
          >
            Ontgrendelen
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div style={overlayStyle} role='dialog' aria-modal='true' aria-label='Pincode instellen'>
        <div style={cardStyle}>
          <div style={headingStyle}><Icon name="key" size={20} /> Stel pincode in</div>
          <div style={subStyle}>
            Je hebt nog geen pincode. Kies een 4-cijferige pincode om je account te beveiligen.
          </div>
          <PinInput
            value={pin}
            onChange={setPin}
            onSubmit={handleSetupNext}
            label='Kies een pincode (4 cijfers)'
            disabled={busy}
          />
          <button
            style={pin.length === PIN_LENGTH && !busy ? submitBtnStyle : disabledBtnStyle}
            onClick={handleSetupNext}
            disabled={pin.length !== PIN_LENGTH || busy}
          >
            Volgende
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'confirm') {
    return (
      <div style={overlayStyle} role='dialog' aria-modal='true' aria-label='Pincode bevestigen'>
        <div style={cardStyle}>
          <div style={headingStyle}><Icon name="key" size={20} /> Bevestig pincode</div>
          <div style={subStyle}>
            Voer de pincode nogmaals in ter bevestiging.
          </div>
          <PinInput
            value={pinConfirm}
            onChange={setPinConfirm}
            onSubmit={handleConfirmSubmit}
            label='Herhaal pincode'
            disabled={busy}
          />
          <button
            style={pinConfirm.length === PIN_LENGTH && !busy ? submitBtnStyle : disabledBtnStyle}
            onClick={handleConfirmSubmit}
            disabled={pinConfirm.length !== PIN_LENGTH || busy}
          >
            Pincode opslaan
          </button>
          <button
            style={{
              ...buttonStyle('ghost'),
              width: '100%',
              justifyContent: 'center',
              marginTop: '8px',
              fontSize: '13px',
            }}
            onClick={() => {
              setPhase('setup');
              setPin('');
              setPinConfirm('');
              setSetupPin('');
            }}
            disabled={busy}
          >
            Terug
          </button>
        </div>
      </div>
    );
  }

  return null;
}
