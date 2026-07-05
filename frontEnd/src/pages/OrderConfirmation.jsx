import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOrder } from '../api/order.api'
import { format } from 'date-fns'
import './PostBooking.css'

export default function OrderConfirmation() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOrder(id)
      .then(({ data }) => setOrder(data.order))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="page-loader"><div className="spinner" /><p>Loading your order...</p></div>
  if (!order) return <div className="page-loader"><p>Order not found.</p></div>

  return (
    <main className="page-wrapper confirmation-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <div className="confirmation-card animate-scale">
          {/* Success Animation */}
          <div className="conf-success">
            <div className="conf-success__circle">
              <span className="conf-success__check">✓</span>
            </div>
            <div className="conf-confetti">🎊🎉✨🎈🎁</div>
          </div>

          <h1 className="conf-title">Order Placed Successfully!</h1>
          <p className="conf-sub">Your celebration surprise is confirmed. We're on it!</p>

          <div className="conf-detail-box">
            <div className="conf-row">
              <span>Order ID</span>
              <strong className="conf-id">#{order.orderId}</strong>
            </div>
            <div className="conf-row">
              <span>Theme</span>
              <strong>{order.theme?.name || order.themeName}</strong>
            </div>
            <div className="conf-row">
              <span>Occasion</span>
              <strong>{order.occasion}</strong>
            </div>
            <div className="conf-row">
              <span>Estimated Delivery</span>
              <strong style={{ color: 'var(--color-success)' }}>
                {order.deliveryDate ? format(new Date(order.deliveryDate), 'dd MMM yyyy') : '-'}
              </strong>
            </div>
            <div className="conf-row">
              <span>Amount Paid</span>
              <strong className="price" style={{ background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ₹{order.amounts?.total?.toLocaleString()}
              </strong>
            </div>
            <div className="conf-row">
              <span>Status</span>
              <span className={`badge status-${order.status}`}>{order.status.replace(/_/g, ' ')}</span>
            </div>
          </div>

          <div className="conf-actions">
            <Link to={`/order/track/${order._id}`} className="btn btn-primary btn-lg">
              📦 Track Your Order
            </Link>
            <Link to="/" className="btn btn-secondary">
              🏠 Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
