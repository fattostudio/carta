import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/digests', label: 'Digests', icon: 'M4 5h16M4 12h16M4 19h10' },
  { to: '/intake',  label: 'Intake',  icon: 'M3 8l9 6 9-6M3 8v10h18V8M3 8l9-5 9 5' },
  { to: '/design',  label: 'Design',  icon: 'M12 3v18M3 12h18' },
];

export default function TabBar() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 60,
      background: 'var(--white)',
      borderTop: '2px solid var(--black)',
      display: 'flex',
      zIndex: 200,
    }}>
      {tabs.map(t => (
        <NavLink
          key={t.to}
          to={t.to}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            color: isActive ? 'var(--black)' : 'var(--grey-light)',
            textDecoration: 'none',
            borderTop: isActive ? '2px solid var(--black)' : '2px solid transparent',
            marginTop: -2,
          })}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={t.icon} />
          </svg>
          <span style={{ fontFamily: 'var(--font-sign)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {t.label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
