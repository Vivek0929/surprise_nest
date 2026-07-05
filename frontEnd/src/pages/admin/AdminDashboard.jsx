import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../../api/admin.api'
import { format } from 'date-fns'
import AdminLayout from './AdminLayout'
import './Admin.css'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard()
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <AdminLayout><div className="page-loader"><div className="spinner" /></div></AdminLayout>

  const { stats, recentOrders, statusBreakdown } = data || {}

  const STAT_CARDS = [
    { label: 'Total Orders', value: stats?.totalOrders || 0, icon: '📦', color: '#7C3AED' },
    { label: 'Total Revenue', value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, icon: '💰', color: '#F59E0B' },
    { label: 'Pending Orders', value: stats?.pendingOrders || 0, icon: '⏳', color: '#EC4899' },
    { label: 'Delivered', value: stats?.deliveredOrders || 0, icon: '✅', color: '#10B981' },
    { label: 'Customers', value: stats?.totalCustomers || 0, icon: '👤', color: '#3B82F6' },
    { label: 'Low Stock Items', value: stats?.lowStockItems || 0, icon: '⚠️', color: '#EF4444' },
  ]

  return (
    <AdminLayout>
      <div className="admin-page animate-fade-in">
        <div className="admin-page-header">
          <h2>Dashboard <span className="gradient-text">Overview</span></h2>
          <p>Welcome back, Admin! Here's what's happening.</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {STAT_CARDS.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-card__icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
              <div className="stat-card__body">
                <div className="stat-card__value">{s.value}</div>
                <div className="stat-card__label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Status Breakdown */}
        {statusBreakdown?.length > 0 && (
          <div className="admin-row">
            <div className="card" style={{ flex: 1 }}>
              <h4 style={{ marginBottom: 'var(--space-lg)' }}>Order Status Breakdown</h4>
              <div className="status-breakdown">
                {statusBreakdown.map((s) => (
                  <div key={s._id} className="status-breakdown__item">
                    <div className="status-breakdown__label">
                      <span className={`badge status-${s._id}`}>{s._id.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="status-breakdown__count">{s.count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card" style={{ flex: 1 }}>
              <h4 style={{ marginBottom: 'var(--space-lg)' }}>Quick Actions</h4>
              <div className="quick-actions">
                <Link to="/admin/orders" className="quick-action-btn">📦 Manage Orders</Link>
                <Link to="/admin/themes" className="quick-action-btn">🎨 Add Theme</Link>
                <Link to="/admin/addons" className="quick-action-btn">🎁 Add Add-On</Link>
                <Link to="/admin/inventory" className="quick-action-btn">📋 Check Inventory</Link>
              </div>
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 'var(--space-lg)' }}>
            <h4>Recent Orders</h4>
            <Link to="/admin/orders" className="btn btn-secondary btn-sm">View All →</Link>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>Order ID</th><th>Customer</th><th>Theme</th><th>Date</th><th>Amount</th><th>Status</th>
              </tr></thead>
              <tbody>
                {recentOrders?.map((o) => (
                  <tr key={o._id}>
                    <td><code style={{color:'var(--color-primary-light)'}}>#{o.orderId}</code></td>
                    <td>{o.user?.name || '-'}</td>
                    <td>{o.theme?.name || o.themeName || '-'}</td>
                    <td>{o.createdAt ? format(new Date(o.createdAt), 'dd MMM') : '-'}</td>
                    <td>₹{o.amounts?.total?.toLocaleString()}</td>
                    <td><span className={`badge status-${o.status}`}>{o.status.replace(/_/g,' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
