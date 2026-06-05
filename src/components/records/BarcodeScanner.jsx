import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { colors, radius, buttonStyle } from '../../styles/tokens.js';

// Barcode-scanner op basis van ZXing (@zxing/browser). Werkt cross-device —
// óók op iOS Safari en desktop Firefox, in tegenstelling tot de browser-native
// BarcodeDetector API. De library wordt lazy geïmporteerd zodat ze niet in de
// initiële bundle zit; ze laadt pas wanneer de scanner geopend wordt.
//
// Vereist HTTPS voor cameratoegang (productie draait op Firebase Hosting = HTTPS).

export default function BarcodeScanner({ open, onClose, onResult }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'scanning' | 'error'
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    setStatus('loading');
    setError('');

    async function start() {
      try {
        const [{ BrowserMultiFormatReader }, { DecodeHintType, BarcodeFormat }] =
          await Promise.all([import('@zxing/browser'), import('@zxing/library')]);

        if (cancelled) return;

        // Beperk tot retail-barcodes (EAN/UPC) voor snelheid en nauwkeurigheid.
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
        ]);

        const reader = new BrowserMultiFormatReader(hints);
        const constraints = { video: { facingMode: { ideal: 'environment' } } };

        const controls = await reader.decodeFromConstraints(
          constraints,
          videoRef.current,
          (result, err, ctrls) => {
            if (cancelled) return;
            if (result) {
              const text = result.getText();
              if (text) {
                ctrls.stop();
                onResult(text);
              }
            }
            // err is normaal per frame (geen barcode gevonden) — negeren.
          }
        );

        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setStatus('scanning');
      } catch (err) {
        console.error('BarcodeScanner: kon scanner niet starten', err);
        if (cancelled) return;
        const name = err?.name || '';
        setError(
          name === 'NotAllowedError'
            ? 'Geen toegang tot de camera. Geef cameratoestemming en probeer opnieuw, of voer de barcode handmatig in.'
            : name === 'NotFoundError'
            ? 'Geen camera gevonden op dit toestel. Voer de barcode handmatig in.'
            : 'Kon de scanner niet starten. Voer de barcode handmatig in.'
        );
        setStatus('error');
      }
    }

    start();

    return () => {
      cancelled = true;
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    };
  }, [open, onResult]);

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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '16px',
            fontWeight: 700,
            color: colors.textPrimary,
            marginBottom: '12px',
          }}
        >
          <Icon name="camera" size={18} /> Scan barcode
        </div>

        {status === 'error' ? (
          <p style={{ fontSize: '14px', color: colors.accentRed, lineHeight: 1.5 }}>{error}</p>
        ) : (
          <>
            <div style={{ position: 'relative' }}>
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
              {/* Richtkader */}
              <div
                style={{
                  position: 'absolute',
                  inset: '22% 12%',
                  border: `2px solid ${colors.brand}`,
                  borderRadius: radius.sm,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.25)',
                  pointerEvents: 'none',
                }}
              />
            </div>
            <p style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '10px' }}>
              {status === 'loading'
                ? 'Scanner laden…'
                : 'Houd de barcode in het kader.'}
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
