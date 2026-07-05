import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMyOrders } from '../api/order.api'
import { updateProfile } from '../api/auth.api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import './Profile.css'

const TABS = ['My Orders', 'Profile', 'Addresses']

export default function Profile() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('My Orders')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getMyOrders()
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile(profileForm)
      toast.success('Profile updated!')
    } catch {
      toast.error('Update failed')
    } finally { setSaving(false) }
  }

  return (
    <main className="page-wrapper profile-page">
      <div className="container">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <div>
            <h2>{user?.name}</h2>
            <p>{user?.email}</p>
            <span className={`badge ${user?.role === 'admin' ? 'badge-amber' : 'badge-purple'}`}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          {TABS.map((t) => (
            <button key={t} className={`profile-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
          <button className="profile-tab profile-tab--danger" onClick={logout}>🚪 Logout</button>
        </div>

        {/* My Orders Tab */}
        {tab === 'My Orders' && (
          <div className="profile-content animate-fade-in">
            {loading ? (
              <div className="flex-center" style={{ minHeight: 200 }}><div className="spinner" /></div>
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <h3>No orders yet</h3>
                <p>Your celebration orders will appear here</p>
                <Link to="/book" className="btn btn-primary">Book Now 🎊</Link>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <div key={order._id} className="order-card card">
                    <div className="order-card__img">
                      {order.theme?.images?.[0] ? (
                        <img src={order.theme.images[0]} alt={order.theme.name}
                          onError={(e) => { e.target.style.display = 'none' }} />
                      ) : <span style={{ fontSize: '2rem' }}>🎊</span>}
                    </div>
                    <div className="order-card__body">
                      <div className="order-card__top">
                        <div>
                          <h4>{order.theme?.name || order.themeName}</h4>
                          <p className="order-card__id">#{order.orderId} · {order.occasion}</p>
                        </div>
                        <span className={`badge status-${order.status}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="order-card__meta">
                        <span>📅 {order.deliveryDate ? format(new Date(order.deliveryDate), 'dd MMM yyyy') : '-'}</span>
                        <span>💰 ₹{order.amounts?.total?.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="order-card__actions">
                      <Link to={`/order/track/${order._id}`} className="btn btn-secondary btn-sm">Track</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {tab === 'Profile' && (
          <div className="profile-content animate-fade-in">
            <div className="card" style={{ maxWidth: 480 }}>
              <h4 style={{ marginBottom: 'var(--space-xl)' }}>Edit Profile</h4>
              <form onSubmit={saveProfile} className="flex-col gap-md">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email (cannot change)</label>
                  <input className="form-input" value={user?.email} disabled style={{ opacity: 0.5 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Addresses Tab */}
        {tab === 'Addresses' && (
          <div className="profile-content animate-fade-in">
            <div className="empty-state">
              <div className="empty-state-icon">🏠</div>
              <h3>Saved Addresses</h3>
              <p>Your hostel addresses from previous orders will appear here</p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
