import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { to: '/dashboard',     label: 'Dashboard',     icon: '⬡' },
  { to: '/intake',        label: 'Intake',         icon: '✦' },
  { to: '/transactions',  label: 'Transactions',   icon: '◈' },
  { to: '/settings',      label: 'Settings',       icon: '⚙' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '24px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'var(--fhq-signal-lime)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 15, color: 'var(--fhq-graphite)', letterSpacing: '-0.5px'
          }}>FH</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>FormsHQ</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>REINSW</div>
          </div>
        </div>
        <div style={{
          marginTop: 12, height: 1, background: 'rgba(255,255,255,0.07)'
        }} />
      </div>

      {/* Agency */}
      <div style={{ padding: '10px 20px 16px' }}>
        <div style={{
          background: 'rgba(28,207,201,0.08)', border: '1px solid rgba(28,207,201,0.15)',
          borderRadius: 8, padding: '10px 12px'
        }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>AGENCY</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>
            {user?.tradingAs || user?.agencyName || 'Demo Agency'}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 12px' }}>
        {navItems.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 8, marginBottom: 2,
            textDecoration: 'none', fontSize: 14, fontWeight: 500,
            color: isActive ? 'var(--fhq-graphite)' : 'rgba(255,255,255,0.6)',
            background: isActive ? 'var(--fhq-signal-lime)' : 'transparent',
            transition: 'all 0.12s ease'
          })}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid rgba(255,255,255,0.07)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{user?.fullName}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{user?.role}</div>
          </div>
          <button onClick={logout} style={{
            background: 'rgba(255,255,255,0.07)', border: 'none',
            color: 'rgba(255,255,255,0.5)', padding: '6px 10px',
            borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500
          }}>
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
