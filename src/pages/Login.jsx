import { useState } from 'react';
import { loginWithGoogle } from '../api';
import { Btn } from '../components/ui';

const STEPS = [
  {
    n: '01',
    title: 'Connect your Gmail',
    body: 'Sign in with Google. Carta asks for read-only access — it can read messages, never send, delete, or change anything.',
  },
  {
    n: '02',
    title: 'Carta finds your newsletters',
    body: 'No labels or filters to set up. Carta scans your inbox for bulk senders using Gmail categories and the list-unsubscribe signal that real newsletters carry.',
  },
  {
    n: '03',
    title: 'Review your senders',
    body: 'Open Sources to see every newsletter sender Carta detected. Toggle off anything that slipped through — receipts, alerts, promotions you do not read.',
  },
  {
    n: '04',
    title: 'Get your weekly digest',
    body: 'Carta pulls the newsletters from your kept senders into a designed weekly digest, updated daily and ready to print.',
  },
];

export default function Login() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: 'var(--white)',
      padding: '40px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-sign)', fontSize: 32, fontWeight: 800,
            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8,
          }}>Carta</div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)',
            letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 40,
          }}>
            Newsletter digest
          </div>
          <div style={{ borderTop: '2px solid var(--black)', marginBottom: 24 }} />
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 24 }}>
            {['Connect', 'Review', 'Read'].map((s, i) => (
              <span key={s} style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: i === 0 ? 'var(--black)' : 'var(--grey-light)',
                fontWeight: i === 0 ? 700 : 400,
              }}>
                {String(i + 1).padStart(2, '0')} {s}
              </span>
            ))}
          </div>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--grey-mid)',
            letterSpacing: '0.06em', lineHeight: 1.7, marginBottom: 32,
          }}>
            Connect your Gmail account and Carta builds a weekly reading digest from the newsletters in your inbox — no labels or filters to set up.
          </p>
          <Btn primary onClick={loginWithGoogle}>
            Login with Google
          </Btn>
        </div>

        {/* Expandable setup guide */}
        <div style={{ marginTop: 40, borderTop: '2px solid var(--black)' }}>
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              padding: '14px 0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span style={{
              fontFamily: 'var(--font-sign)', fontSize: 13, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--black)',
            }}>
              How it works
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--black)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {open && (
            <div style={{ paddingBottom: 8 }}>
              {STEPS.map((step) => (
                <div key={step.n} style={{
                  display: 'flex', gap: 14, padding: '14px 0',
                  borderTop: '1px solid var(--grey-rule)',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-light)',
                    paddingTop: 2, flexShrink: 0,
                  }}>
                    {step.n}
                  </span>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-sign)', fontSize: 14, fontWeight: 700,
                      letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--black)',
                      marginBottom: 6,
                    }}>
                      {step.title}
                    </div>
                    <p style={{
                      fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--grey-mid)',
                      letterSpacing: '0.03em', lineHeight: 1.7, margin: 0,
                    }}>
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}

              <div style={{
                borderTop: '1px solid var(--grey-rule)', paddingTop: 14, marginTop: 0,
              }}>
                <a
                  href="https://support.google.com/mail/answer/3094499"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)',
                    letterSpacing: '0.06em', textDecoration: 'underline',
                  }}
                >
                  About Gmail categories →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
