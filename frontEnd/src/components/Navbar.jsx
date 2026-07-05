import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { user, logout, isAdmin, isDelivery } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false); setDropOpen(false) }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/') }

  const getDashboardLink = () => {
    if (isAdmin) return '/admin'
    if (isDelivery) return '/delivery'
    return '/profile'
  }

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__container">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">🎊</span>
          <span className="navbar__logo-text">
            Surprise<span className="gradient-text">Nest</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="navbar__links">
          <Link to="/" className={`navbar__link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="/book" className={`navbar__link ${location.pathname.startsWith('/book') ? 'active' : ''}`}>Book Now</Link>
          {user && <Link to="/profile" className={`navbar__link ${location.pathname === '/profile' ? 'active' : ''}`}>My Orders</Link>}
          {isAdmin && <Link to="/admin" className="navbar__link navbar__link--admin">Admin</Link>}
          {isDelivery && <Link to="/delivery" className="navbar__link navbar__link--delivery">Dashboard</Link>}
        </div>

        {/* Desktop Auth */}
        <div className="navbar__auth">
          {user ? (
            <div className="navbar__user" onClick={() => setDropOpen(!dropOpen)}>
              <div className="navbar__avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span className="navbar__username">{user.name.split(' ')[0]}</span>
              <span className="navbar__caret">▾</span>

              {dropOpen && (
                <div className="navbar__dropdown">
                  <Link to={getDashboardLink()} className="navbar__drop-item">
                    👤 {isAdmin ? 'Admin Panel' : isDelivery ? 'Dashboard' : 'My Profile'}
                  </Link>
                  {!isAdmin && !isDelivery && (
                    <Link to="/profile" className="navbar__drop-item">📦 My Orders</Link>
                  )}
                  <div className="navbar__drop-divider" />
                  <button onClick={handleLogout} className="navbar__drop-item navbar__drop-item--danger">
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-sm">
              <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}
        </div>

        {/* Hamburger */}
        <button className={`navbar__hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="navbar__mobile">
          <Link to="/" className="navbar__mobile-link">🏠 Home</Link>
          <Link to="/book" className="navbar__mobile-link">🎊 Book Celebration</Link>
          {user && <Link to="/profile" className="navbar__mobile-link">📦 My Orders</Link>}
          {isAdmin && <Link to="/admin" className="navbar__mobile-link">⚙️ Admin Panel</Link>}
          {isDelivery && <Link to="/delivery" className="navbar__mobile-link">🚴 Dashboard</Link>}
          {user ? (
            <button onClick={handleLogout} className="navbar__mobile-link navbar__mobile-link--danger">🚪 Logout</button>
          ) : (
            <>
              <Link to="/login" className="navbar__mobile-link">Login</Link>
              <Link to="/register" className="btn btn-primary" style={{margin:'0.5rem 1rem'}}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
