import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getDigests, getSources, getPendingSources, subscribe } from '../store';

const s = {
  sidebar: {
    width: 200,
    minWidth: 200,
    background: 'var(--white)',
    borderRight: '2px solid var(--black)',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
  },
  wordmark: {
    fontFamily: 'var(--font-sign)',
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--white)',
    background: 'var(--black)',
    padding: '14px 16px',
    borderBottom: '2px solid var(--black)',
    lineHeight: 1,
  },
  groupLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--grey-light)',
    padding: '14px 16px 4px',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px',
    fontFamily: 'var(--font-sign)',
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--grey-mid)',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid var(--grey-rule)',
    width: '100%',
    textAlign: 'left',
    textDecoration: 'none',
    transition: 'color 0.1s',
  },
  badge: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--grey-light)',
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--signal)',
    flexShrink: 0,
  },
  footer: {
    marginTop: 'auto',
    borderTop: '2px solid var(--black)',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#2a9a5a',
    flexShrink: 0,
  },
  footerText: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--grey-mid)',
    letterSpacing: '0.06em',
  },
};

const activeStyle = {
  color: 'var(--black)',
  borderLeft: '3px solid var(--black)',
  paddingLeft: '21px', // 16px base + 8px padding - 3px border = keeps text aligned
};

const sublink = {
  ...s.link,
  fontSize: 13,
  fontWeight: 500,
  paddingLeft: 32,
};

const sublinkActive = {
  color: 'var(--black)',
  borderLeft: '3px solid var(--black)',
  paddingLeft: 29, // 32 base - 3px border
};

export default function Sidebar() {
  const [digestCount, setDigestCount] = useState(() => getDigests().length);
  const [sourceCount, setSourceCount] = useState(() => getSources().length);
  const [pendingCount, setPendingCount] = useState(() => getPendingSources().length);
  const intakeActive = useLocation().pathname.startsWith('/intake');

  useEffect(() => subscribe(e => {
    if (e.detail.key === 'digests') setDigestCount(getDigests().length);
    if (e.detail.key === 'sources') {
      setSourceCount(getSources().length);
      setPendingCount(getPendingSources().length);
    }
  }), []);

  return (
    <nav style={s.sidebar}>
      <div style={s.wordmark}>Carta</div>

      <div style={s.groupLabel}>Library</div>
      <NavLink to="/digests" style={({ isActive }) => ({ ...s.link, ...(isActive ? activeStyle : { paddingLeft: 16 }) })}>
        Digests
        {digestCount > 0 && <span style={s.badge}>{digestCount}</span>}
      </NavLink>

      <div style={s.groupLabel}>Configure</div>
      <NavLink to="/intake/sources" style={{ ...s.link, ...(intakeActive ? activeStyle : { paddingLeft: 16 }) }}>
        <span>Intake</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {pendingCount > 0 && <span style={s.pendingDot} />}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: intakeActive ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', opacity: 0.5 }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </NavLink>
      {intakeActive && (
        <>
          <NavLink to="/intake/sources" end style={({ isActive }) => ({ ...sublink, ...(isActive ? sublinkActive : {}) })}>
            Sources
            {pendingCount > 0
              ? <span style={{ ...s.badge, color: 'var(--signal)' }}>{pendingCount} new</span>
              : sourceCount > 0 && <span style={s.badge}>{sourceCount}</span>}
          </NavLink>
          <NavLink to="/intake/schedule" end style={({ isActive }) => ({ ...sublink, ...(isActive ? sublinkActive : {}) })}>
            Schedule
          </NavLink>
        </>
      )}
      <NavLink to="/design" style={({ isActive }) => ({ ...s.link, ...(isActive ? activeStyle : { paddingLeft: 16 }) })}>
        Design
      </NavLink>

      <div style={s.footer}>
        <div style={s.dot} />
        <span style={s.footerText}>Gmail · Carta</span>
      </div>
    </nav>
  );
}
