import { useState, useEffect } from 'react';

// ── Inject global button styles once ─────────────────────────────────────────
const STYLE_ID = 'carta-ui-styles';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = `
    .carta-btn { transition: opacity 0.1s, background 0.1s, color 0.1s, border-color 0.1s; }
    .carta-btn:hover:not(:disabled) { opacity: 0.75; }
    .carta-btn:disabled { opacity: 0.35; cursor: not-allowed !important; }
    .carta-btn:active:not(:disabled) { opacity: 0.55; }
    .carta-section-action:hover { color: var(--black) !important; }
    .carta-input:focus { border-color: var(--black) !important; }
    .carta-input:hover:not(:focus) { border-color: var(--grey-mid) !important; }
  `;
  document.head.appendChild(el);
}

// ── Btn ───────────────────────────────────────────────────────────────────────
export function Btn({ children, primary, loading, confirm, onClick, disabled, style: extra }) {
  const [state, setState] = useState('idle'); // idle | loading | confirmed

  async function handleClick(e) {
    if (disabled || state !== 'idle' || !onClick) return;
    if (loading !== undefined) {
      // controlled loading from outside
      onClick(e);
      return;
    }
    if (confirm) {
      try {
        setState('loading');
        await onClick(e);
        setState('confirmed');
        setTimeout(() => setState('idle'), 1800);
      } catch {
        setState('idle');
      }
      return;
    }
    onClick(e);
  }

  const isDisabled = disabled || state === 'loading' || (loading === true);
  const isLoading = state === 'loading' || loading === true;
  const isConfirmed = state === 'confirmed';

  const label = isLoading
    ? (typeof loading === 'string' ? loading : '...')
    : isConfirmed
    ? 'Saved ✓'
    : children;

  return (
    <button
      className="carta-btn"
      disabled={isDisabled}
      onClick={handleClick}
      style={{
        fontFamily: 'var(--font-sign)', fontSize: 13, fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        padding: '7px 16px',
        border: '2px solid var(--black)',
        background: isConfirmed ? '#2a9a5a' : primary ? 'var(--black)' : 'var(--white)',
        color: isConfirmed ? 'var(--white)' : primary ? 'var(--white)' : 'var(--black)',
        borderColor: isConfirmed ? '#2a9a5a' : 'var(--black)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        minWidth: 80,
        ...extra,
      }}
    >
      {label}
    </button>
  );
}

// ── ColHeader ─────────────────────────────────────────────────────────────────
export function ColHeader({ label, action, onAction, meta }) {
  return (
    <div style={{
      background: 'var(--black)', color: 'var(--white)',
      padding: '10px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0, borderBottom: '2px solid var(--black)',
    }}>
      <span style={{ fontFamily: 'var(--font-sign)', fontSize: 14, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {meta && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-light)' }}>{meta}</span>}
        {action && (
          <button
            className="carta-section-action"
            onClick={onAction}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-light)',
              background: 'none', border: '1px solid var(--grey-heavy)',
              padding: '2px 8px', cursor: 'pointer', letterSpacing: '0.06em',
              transition: 'color 0.1s',
            }}
          >
            {action}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
export function Section({ label, action, onAction, meta, children }) {
  return (
    <div style={{ borderBottom: '2px solid var(--black)', display: 'flex', flexDirection: 'column' }}>
      <ColHeader label={label} action={action} onAction={onAction} meta={meta} />
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────
export function Row({ children, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: last ? 'none' : '1px solid var(--grey-rule)',
    }}>
      {children}
    </div>
  );
}

// ── Label ─────────────────────────────────────────────────────────────────────
export function Label({ children }) {
  return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey-mid)' }}>{children}</span>;
}

export function FieldLabel({ children }) {
  return <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey-mid)', marginBottom: 6 }}>{children}</div>;
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ ...props }) {
  return (
    <input
      {...props}
      className={`carta-input ${props.className || ''}`}
      style={{
        fontFamily: 'var(--font-body)', fontSize: 13,
        background: 'var(--white)', border: '1px solid var(--grey-rule)',
        color: 'var(--black)', padding: '7px 10px', width: '100%', outline: 'none',
        transition: 'border-color 0.1s',
        ...props.style,
      }}
    />
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className={`carta-input ${props.className || ''}`}
      style={{
        fontFamily: 'var(--font-body)', fontSize: 13,
        background: 'var(--white)', border: '1px solid var(--grey-rule)',
        color: 'var(--black)', padding: '7px 10px', width: '100%', outline: 'none',
        cursor: 'pointer', transition: 'border-color 0.1s',
        ...props.style,
      }}
    >
      {children}
    </select>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({ on, onChange }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 34, height: 20,
        background: on ? 'var(--black)' : 'var(--grey-rule)',
        position: 'relative', cursor: 'pointer', flexShrink: 0,
        transition: 'background 0.15s',
      }}
    >
      <div style={{
        position: 'absolute', width: 14, height: 14,
        background: 'var(--white)', border: '1px solid var(--grey-light)',
        top: 3, left: on ? 17 : 3, transition: 'left 0.15s',
      }} />
    </div>
  );
}

// ── ToggleRow ─────────────────────────────────────────────────────────────────
export function ToggleRow({ label, sub, on, onChange, last }) {
  return (
    <Row last={last}>
      <div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--black)', fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)', marginTop: 2, letterSpacing: '0.04em' }}>{sub}</div>}
      </div>
      <Toggle on={on} onChange={onChange} />
    </Row>
  );
}

// ── PageShell ─────────────────────────────────────────────────────────────────
export function PageShell({ title, sub, actions, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{
        background: 'var(--white)', borderBottom: '2px solid var(--black)',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-sign)', fontSize: 22, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>{title}</div>
          {sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)', marginTop: 4, letterSpacing: '0.08em' }}>{sub}</div>}
        </div>
        {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--white)' }}>
        {children}
      </div>
    </div>
  );
}

// ── Tag ───────────────────────────────────────────────────────────────────────
export function Tag({ children, variant = 'default' }) {
  const v = {
    default: { border: '1px solid var(--grey-rule)', color: 'var(--grey-mid)', background: 'var(--grey-bg)' },
    green:   { border: '1px solid #2a9a5a', color: '#2a9a5a', background: '#f0faf4' },
    signal:  { border: '1px solid var(--signal)', color: 'var(--signal)', background: '#fef2ef' },
  }[variant];
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '2px 7px', ...v }}>
      {children}
    </span>
  );
}
