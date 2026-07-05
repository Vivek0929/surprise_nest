import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { trackOrder } from '../api/order.api'
import { format } from 'date-fns'
import './PostBooking.css'

const STATUS_STEPS = [
  { key: 'placed',            label: 'Order Placed',       icon: '📋' },
  { key: 'confirmed',         label: 'Confirmed',          icon: '✅' },
  { key: 'packed',            label: 'Packed',             icon: '📦' },
  { key: 'out_for_delivery',  label: 'Out for Delivery',   icon: '🚴' },
  { key: 'delivered',         label: 'Delivered',          icon: '🎊' },
]

const ORDER_ORDER = ['placed','confirmed','packed','out_for_delivery','delivered']

export default function OrderTracking() {
  const { id } = useParams()
  const [tracking, setTracking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = () => {
      trackOrder(id)
        .then(({ data }) => setTracking(data.tracking))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
    fetch()
    const interval = setInterval(fetch, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [id])

  if (loading) return <div className="page-loader"><div className="spinner" /><p>Loading tracking info...</p></div>
  if (!tracking) return <div className="page-loader"><p>Order not found.</p></div>

  const currentIdx = ORDER_ORDER.indexOf(tracking.status)
  const isCancelled = tracking.status === 'cancelled'

  return (
    <main className="page-wrapper">
      <div className="container" style={{ maxWidth: 640, paddingTop: 'var(--space-xl)' }}>
        <div className="tracking-page animate-fade-in">
          <div className="tracking-header">
            <h2>Track Your <span className="gradient-text">Order</span></h2>
            <p>Order ID: <strong>#{tracking.orderId}</strong></p>
          </div>

          {isCancelled ? (
            <div className="tracking-cancelled">
              <span>❌</span>
              <h3>Order Cancelled</h3>
              <p>This order has been cancelled. Please contact support if you need help.</p>
            </div>
          ) : (
            <div className="tracking-timeline">
              {STATUS_STEPS.map((step, i) => {
                const isCompleted = i <= currentIdx
                const isActive = i === currentIdx
                const histEntry = tracking.statusHistory?.find((h) => h.status === step.key)
                return (
                  <div key={step.key} className={`timeline-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                    <div className="timeline-icon">{step.icon}</div>
                    <div className="timeline-line" />
                    <div className="timeline-body">
                      <div className="timeline-label">{step.label}</div>
                      {histEntry && (
                        <div className="timeline-time">
                          {format(new Date(histEntry.updatedAt), 'dd MMM yyyy, hh:mm a')}
                        </div>
                      )}
                      {histEntry?.note && <div className="timeline-note">{histEntry.note}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Delivery Info */}
          <div className="tracking-info-card card">
            <div className="tracking-info-row">
              <span>📅 Expected Delivery</span>
              <strong style={{ color: 'var(--color-success)' }}>
                {tracking.deliveryDate ? format(new Date(tracking.deliveryDate), 'dd MMM yyyy') : '-'}
              </strong>
            </div>
            {tracking.deliveryPartner && (
              <div className="tracking-info-row">
                <span>🚴 Delivery Partner</span>
                <strong>{tracking.deliveryPartner.name}</strong>
              </div>
            )}
            <div className="tracking-info-row">
              <span>💰 Total Amount</span>
              <strong>₹{tracking.amounts?.total?.toLocaleString()}</strong>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
            <Link to="/profile" className="btn btn-secondary">← My Orders</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
