import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getMyDeliveryOrders } from '../../api/delivery.api'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import DeliveryLayout from './DeliveryLayout'
import './Delivery.css'

export default function DeliveryDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyDeliveryOrders()
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const pending  = orders.filter(o => o.status === 'packed' || o.status === 'confirmed')
  const active   = orders.filter(o => o.status === 'out_for_delivery')
  const done     = orders.filter(o => o.status === 'delivered')

  const STATS = [
    { label: 'Total Assigned', value: orders.length, icon: '📦', color: '#7C3AED' },
    { label: 'Ready to Pick',  value: pending.length, icon: '⏳', color: '#F59E0B' },
    { label: 'Out for Delivery', value: active.length, icon: '🚴', color: '#EC4899' },
    { label: 'Delivered',       value: done.length,  icon: '✅', color: '#10B981' },
  ]

  return (
    <DeliveryLayout>
      <div className="delivery-page animate-fade-in">
        <div className="delivery-page-header">
          <h2>Hey, <span className="gradient-text">{user?.name?.split(' ')[0]}!</span> 👋</h2>
          <p>Here's your delivery overview for today</p>
        </div>

        {/* Stats */}
        <div className="delivery-stats">
          {STATS.map(s => (
            <div key={s.label} className="delivery-stat">
              <div className="delivery-stat__icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
              <div className="delivery-stat__value">{s.value}</div>
              <div className="delivery-stat__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Ready to pick up */}
        <div className="delivery-section">
          <h3>📦 Ready to Pick Up ({pending.length})</h3>
          {loading ? <div className="flex-center" style={{ minHeight: 100 }}><div className="spinner" /></div>
          : pending.length === 0
          ? <div className="empty-state" style={{ padding: 'var(--space-xl)' }}><p>No pickups pending</p></div>
          : pending.map(order => (
            <Link key={order._id} to={`/delivery/orders`} className="delivery-order-card">
              <div className="delivery-order-card__badge">📋 {order.status.replace(/_/g,' ')}</div>
              <h4>#{order.orderId}</h4>
              <p>{order.user?.name} · {order.hostelDetails?.hostelName}, Room {order.hostelDetails?.roomNumber}</p>
              <p style={{color:'var(--color-success)'}}>📅 {order.deliveryDate ? format(new Date(order.deliveryDate), 'dd MMM yyyy') : '-'}</p>
            </Link>
          ))}
        </div>

        {/* Active Deliveries */}
        <div className="delivery-section">
          <h3>🚴 Active Deliveries ({active.length})</h3>
          {active.length === 0
          ? <div className="empty-state" style={{ padding: 'var(--space-xl)' }}><p>No active deliveries</p></div>
          : active.map(order => (
            <Link key={order._id} to={`/delivery/orders`} className="delivery-order-card delivery-order-card--active">
              <div className="delivery-order-card__badge">🚴 Out for Delivery</div>
              <h4>#{order.orderId}</h4>
              <p>{order.hostelDetails?.hostelName}, Room {order.hostelDetails?.roomNumber}</p>
              <p>📞 {order.hostelDetails?.mobileNumber}</p>
            </Link>
          ))}
        </div>
      </div>
    </DeliveryLayout>
  )
}
