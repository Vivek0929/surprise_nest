import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Admin.css'

const NAV = [
  { to: '/admin',           icon: '📊', label: 'Dashboard' },
  { to: '/admin/orders',    icon: '📦', label: 'Orders' },
  { to: '/admin/themes',    icon: '🎨', label: 'Themes' },
  { to: '/admin/addons',    icon: '🎁', label: 'Add-Ons' },
  { to: '/admin/inventory', icon: '📋', label: 'Inventory' },
]

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="admin-layout page-wrapper">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <span>⚙️</span>
          <span>Admin Panel</span>
        </div>
        <nav className="admin-sidebar__nav">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to}
              className={`admin-nav-item ${location.pathname === n.to ? 'active' : ''}`}>
              <span>{n.icon}</span><span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__avatar">{user?.name?.charAt(0)}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user?.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Administrator</div>
            </div>
          </div>
          <button onClick={logout} className="admin-sidebar__logout">🚪</button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}
