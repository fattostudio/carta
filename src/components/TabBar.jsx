import { NavLink } from 'react-router-dom';
import { DigestsIcon, IntakeIcon, DesignIcon } from './icons';

const tabs = [
  { to: '/digests', label: 'Digests', Icon: DigestsIcon },
  { to: '/intake',  label: 'Intake',  Icon: IntakeIcon },
  { to: '/design',  label: 'Design',  Icon: DesignIcon },
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
      {tabs.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
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
          <Icon size={20} />
          <span style={{ fontFamily: 'var(--font-sign)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
