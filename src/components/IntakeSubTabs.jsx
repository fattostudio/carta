import { NavLink } from 'react-router-dom';

// Mobile-only secondary nav for the Intake section — sits just above the main
// TabBar and only renders while an /intake/* route is active.
const tabs = [
  { to: '/intake/sources', label: 'Sources' },
  { to: '/intake/schedule', label: 'Schedule' },
];

export default function IntakeSubTabs() {
  return (
    <nav style={{
      position: 'fixed', bottom: 60, left: 0, right: 0,
      height: 44,
      background: 'var(--white)',
      borderTop: '2px solid var(--black)',
      display: 'flex',
      zIndex: 190,
    }}>
      {tabs.map(t => (
        <NavLink
          key={t.to}
          to={t.to}
          end
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            color: isActive ? 'var(--black)' : 'var(--grey-light)',
            borderTop: isActive ? '2px solid var(--black)' : '2px solid transparent',
            marginTop: -2,
            fontFamily: 'var(--font-sign)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
          })}
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
