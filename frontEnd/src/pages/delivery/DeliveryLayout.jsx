import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Delivery.css'

const NAV = [
  { to: '/delivery',        icon: '📊', label: 'Dashboard' },
  { to: '/delivery/orders', icon: '📦', label: 'My Orders' },
]

export default function DeliveryLayout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="delivery-layout page-wrapper">
      <aside className="delivery-sidebar">
        <div className="delivery-sidebar__brand">
          <span>🚴</span>
          <span>Delivery Portal</span>
        </div>
        <nav className="delivery-sidebar__nav">
          {NAV.map(n => (
            <Link key={n.to} to={n.to}
              className={`delivery-nav-item ${location.pathname === n.to ? 'active' : ''}`}>
              <span>{n.icon}</span><span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="delivery-sidebar__footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flex: 1 }}>
            <div className="delivery-sidebar__avatar">{user?.name?.charAt(0)}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user?.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Delivery Partner</div>
            </div>
          </div>
          <button onClick={logout} className="delivery-sidebar__logout">🚪</button>
        </div>
      </aside>
      <main className="delivery-main">{children}</main>
    </div>
  )
}
