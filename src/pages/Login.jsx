import { useState } from 'react';
import { loginWithGoogle } from '../api';
import { Btn } from '../components/ui';

const STEPS = [
  {
    n: '01',
    title: 'Create a Gmail label',
    body: 'In Gmail, open Settings → Labels → "Create new label". Name it exactly "Carta". This is the inbox Carta reads from.',
  },
  {
    n: '02',
    title: 'Create a filter',
    body: 'Go to Settings → Filters and Blocked Addresses → "Create a new filter". Add the sender addresses of the newsletters you want (e.g. the "From" of each newsletter), separated by OR.',
  },
  {
    n: '03',
    title: 'Apply the label automatically',
    body: 'On the next step of the filter, tick "Apply the label" and choose "Carta". Tick "Also apply to matching conversations" so existing newsletters get sorted too.',
  },
  {
    n: '04',
    title: 'Connect & fetch',
    body: 'Come back here, connect your Gmail, and Carta pulls everything in the Carta label into a designed weekly digest, ready to print.',
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
          <div style={{ borderTop: '2px solid var(--black)', marginBottom: 40 }} />
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--grey-mid)',
            letterSpacing: '0.06em', lineHeight: 1.7, marginBottom: 32,
          }}>
            Connect your Gmail account to start building your weekly reading digest from your Carta label.
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
              First time? Set up Gmail
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--black)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {open && (
            <div style={{ paddingBottom: 8 }}>
              {STEPS.map((step, i) => (
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
                  href="https://support.google.com/mail/answer/6579"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)',
                    letterSpacing: '0.06em', textDecoration: 'underline',
                  }}
                >
                  Gmail filters & labels help →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
