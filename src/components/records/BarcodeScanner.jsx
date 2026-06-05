import { useEffect, useRef, useState } from 'react';
import { colors, radius, buttonStyle } from '../../styles/tokens.js';

// Gebruikt de browser-native BarcodeDetector API (geen externe dependency).
// Beschikbaar op o.a. Android Chrome. Niet ondersteund op iOS Safari — daar
// blijft handmatige invoer beschikbaar.

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];

export default function BarcodeScanner({ open, onClose, onResult }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [error, setError] = useState('');
  const supported = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  useEffect(() => {
    if (!open) return undefined;
    if (!supported) {
      setError('Barcode-scannen wordt niet ondersteund op dit toestel. Voer de barcode handmatig in.');
      return undefined;
    }

    let cancelled = false;
    const detector = new window.BarcodeDetector({ formats: FORMATS });

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        scan();
      } catch (err) {
        console.error('BarcodeScanner: camera error', err);
        setError('Geen toegang tot de camera. Controleer de permissies of voer de barcode handmatig in.');
      }
    }

    async function scan() {
      if (cancelled || !videoRef.current) return;
      try {
        const codes = await detector.detect(videoRef.current);
        if (codes && codes.length > 0) {
          const value = codes[0].rawValue;
          if (value) {
            stop();
            onResult(value);
            return;
          }
        }
      } catch {
        // detect() faalt soms tussen frames — gewoon doorgaan
      }
      rafRef.current = requestAnimationFrame(scan);
    }

    function stop() {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    }

    start();
    return () => stop();
  }, [open, supported, onResult]);

  if (!open) return null;

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    zIndex: 9500,
    backgroundColor: 'rgba(0,0,0,0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  };

  const cardStyle = {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: '20px',
    width: '100%',
    maxWidth: '420px',
    textAlign: 'center',
  };

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label="Barcode scannen">
      <div style={cardStyle}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary, marginBottom: '12px' }}>
          📷 Scan barcode
        </div>
        {error ? (
          <p style={{ fontSize: '14px', color: colors.accentRed, lineHeight: 1.5 }}>{error}</p>
        ) : (
          <>
            <video
              ref={videoRef}
              style={{
                width: '100%',
                borderRadius: radius.md,
                backgroundColor: '#000',
                aspectRatio: '4 / 3',
                objectFit: 'cover',
              }}
              muted
              playsInline
            />
            <p style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '10px' }}>
              Houd de barcode voor de camera.
            </p>
          </>
        )}
        <button
          style={{ ...buttonStyle('secondary'), width: '100%', justifyContent: 'center', marginTop: '12px' }}
          onClick={onClose}
        >
          Sluiten
        </button>
      </div>
    </div>
  );
}
