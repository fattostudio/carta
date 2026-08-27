import { useState, useEffect, useCallback } from 'react';
import { Btn } from '../components/ui';
import { getSources } from '../api';
import { saveSources, saveDisabledSources, markOnboarded } from '../store';
import { incrementalFetch } from '../hooks/useFetch';

// ── Indeterminate bar keyframes (injected once, matches ui.jsx pattern) ───────
const STYLE_ID = 'carta-onboarding-styles';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = `
    @keyframes carta-scan {
      0%   { left: -40%; width: 40%; }
      50%  { width: 55%; }
      100% { left: 100%; width: 40%; }
    }
  `;
  document.head.appendChild(el);
}

const STEPS = ['Scan', 'Review', 'Compose'];

function Frame({ step, children }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: 'var(--white)',
      padding: '40px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontFamily: 'var(--font-sign)', fontSize: 26, fontWeight: 800,
            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10,
          }}>Carta</div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, color: '#2a9a5a',
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            ✓ Gmail connected
          </div>
        </div>

        <div style={{ borderTop: '2px solid var(--black)', paddingTop: 14, marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 18, justifyContent: 'center' }}>
            {STEPS.map((s, i) => (
              <span key={s} style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: i === step ? 'var(--black)' : 'var(--grey-light)',
                fontWeight: i === step ? 700 : 400,
              }}>
                {String(i + 1).padStart(2, '0')} {s}
              </span>
            ))}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

function ScanBar() {
  return (
    <div style={{ position: 'relative', height: 2, background: 'var(--grey-rule)', overflow: 'hidden', margin: '28px 0' }}>
      <div style={{ position: 'absolute', top: 0, height: '100%', background: 'var(--black)', animation: 'carta-scan 1.1s ease-in-out infinite' }} />
    </div>
  );
}

function Heading({ children }) {
  return (
    <h1 style={{
      fontFamily: 'var(--font-sign)', fontSize: 28, fontWeight: 800,
      letterSpacing: '0.02em', textTransform: 'uppercase', textAlign: 'center',
      margin: '0 0 10px', color: 'var(--black)',
    }}>
      {children}
    </h1>
  );
}

function Note({ children }) {
  return (
    <p style={{
      fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--grey-mid)',
      letterSpacing: '0.04em', lineHeight: 1.7, textAlign: 'center', margin: 0,
    }}>
      {children}
    </p>
  );
}

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0); // 0 scan · 1 review · 2 compose
  const [senders, setSenders] = useState([]);
  const [off, setOff] = useState(() => new Set());
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(null);

  const finish = useCallback(() => {
    markOnboarded();
    onComplete();
  }, [onComplete]);

  // Step 0 — scan the inbox for newsletter senders. Promise-chain style (like
  // App's auth check) so state only moves inside the async callbacks.
  const runScan = useCallback(() => {
    getSources()
      .then(result => { setSenders(result); setOff(new Set()); setStep(1); })
      .catch(err => setError(err.message || 'Something went wrong'));
  }, []);

  const retryScan = useCallback(() => { setError(null); runScan(); }, [runScan]);

  useEffect(() => { runScan(); }, [runScan]);

  function toggle(email) {
    setOff(prev => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  }

  // Step 1 → 2 — persist the reviewed allowlist, then compose the first digest.
  async function build() {
    saveSources(senders);
    saveDisabledSources([...off]);
    setStep(2);
    try {
      const { added: n } = await incrementalFetch();
      setAdded(n);
    } catch {
      setAdded(0); // digest can still be fetched later from Digests
    }
  }

  // ── Step 0: scanning ──────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <Frame step={0}>
        {error ? (
          <>
            <Heading>Couldn’t reach Gmail</Heading>
            <div style={{ marginBottom: 20 }}>
              <Note>{error}</Note>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <Btn primary onClick={retryScan}>Try again</Btn>
              <Btn onClick={finish}>Skip for now</Btn>
            </div>
          </>
        ) : (
          <>
            <Heading>Reading your inbox</Heading>
            <Note>Finding newsletters by their list-unsubscribe signature.<br />This can take up to a minute on a large mailbox.</Note>
            <ScanBar />
          </>
        )}
      </Frame>
    );
  }

  // ── Step 1: review detected senders ──────────────────────────────────────
  if (step === 1) {
    const keptCount = senders.length - off.size;
    if (!senders.length) {
      return (
        <Frame step={1}>
          <Heading>No newsletters spotted</Heading>
          <div style={{ marginBottom: 24 }}>
            <Note>Carta couldn’t pick out any newsletters automatically. You can point it at a Gmail label later in Sources.</Note>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <Btn primary onClick={retryScan}>Scan again</Btn>
            <Btn onClick={finish}>Continue</Btn>
          </div>
        </Frame>
      );
    }
    return (
      <Frame step={1}>
        <Heading>{senders.length} {senders.length === 1 ? 'sender' : 'senders'} found</Heading>
        <div style={{ marginBottom: 18 }}>
          <Note>Switch off anything that isn’t a newsletter. You can change this later in Sources.</Note>
        </div>

        <div style={{
          border: '2px solid var(--black)', maxHeight: '44vh', overflowY: 'auto',
          marginBottom: 18,
        }}>
          {senders.map((src, i) => {
            const on = !off.has(src.email);
            return (
              <div key={src.email} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 12, padding: '10px 14px',
                borderBottom: i === senders.length - 1 ? 'none' : '1px solid var(--grey-rule)',
              }}>
                <div style={{ flex: 1, minWidth: 0, opacity: on ? 1 : 0.4, transition: 'opacity 0.15s' }}>
                  <div style={{
                    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                    color: 'var(--black)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {src.name}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)',
                    marginTop: 2, letterSpacing: '0.04em',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {src.email} · {src.count} {src.count === 1 ? 'issue' : 'issues'}
                  </div>
                </div>
                <div
                  onClick={() => toggle(src.email)}
                  style={{
                    width: 34, height: 20, flexShrink: 0, cursor: 'pointer',
                    background: on ? 'var(--black)' : 'var(--grey-rule)',
                    position: 'relative', transition: 'background 0.15s',
                  }}
                >
                  <div style={{
                    position: 'absolute', width: 14, height: 14, background: 'var(--white)',
                    border: '1px solid var(--grey-light)', top: 3, left: on ? 17 : 3,
                    transition: 'left 0.15s',
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Btn primary disabled={keptCount === 0} onClick={build} style={{ width: '100%' }}>
            Build my first digest
          </Btn>
          <button
            onClick={finish}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--grey-mid)', textDecoration: 'underline',
            }}
          >
            Skip for now
          </button>
        </div>
      </Frame>
    );
  }

  // ── Step 2: composing ───────────────────────────────────────────────────
  return (
    <Frame step={2}>
      {added === null ? (
        <>
          <Heading>Composing your first digest</Heading>
          <Note>Pulling issues from the last 7 days and laying them out.</Note>
          <ScanBar />
        </>
      ) : (
        <>
          <Heading>You’re set</Heading>
          <div style={{ marginBottom: 24 }}>
            <Note>
              {added > 0
                ? `${added} ${added === 1 ? 'issue' : 'issues'} in your first digest. New ones land automatically.`
                : 'No new issues this week — your digest fills in as newsletters arrive.'}
            </Note>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Btn primary onClick={finish}>Open Carta</Btn>
          </div>
        </>
      )}
    </Frame>
  );
}
