import { useState, useEffect } from 'react'
import { getMyDeliveryOrders, updateDeliveryStatus } from '../../api/delivery.api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import DeliveryLayout from './DeliveryLayout'
import './Delivery.css'

export default function DeliveryOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  const load = () => {
    getMyDeliveryOrders()
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const markStatus = async (orderId, status) => {
    setUpdating(orderId)
    try {
      await updateDeliveryStatus(orderId, { status })
      toast.success(`Marked as ${status.replace(/_/g, ' ')} ✅`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating status')
    } finally { setUpdating(null) }
  }

  return (
    <DeliveryLayout>
      <div className="delivery-page animate-fade-in">
        <div className="delivery-page-header">
          <h2>My <span className="gradient-text">Assigned Orders</span></h2>
          <p>{orders.length} order{orders.length !== 1 ? 's' : ''} assigned to you</p>
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No orders assigned yet</h3>
            <p>Orders assigned to you by the admin will appear here</p>
          </div>
        ) : (
          <div className="delivery-orders-list">
            {orders.map(order => (
              <div key={order._id} className="delivery-full-card card">
                <div className="delivery-full-card__header">
                  <div>
                    <h4>#{order.orderId}</h4>
                    <span className={`badge status-${order.status}`}>{order.status.replace(/_/g,' ')}</span>
                  </div>
                  <div className="delivery-full-card__date">
                    📅 {order.deliveryDate ? format(new Date(order.deliveryDate), 'dd MMM yyyy') : '-'}
                  </div>
                </div>

                <div className="delivery-full-card__grid">
                  <div className="delivery-info-item">
                    <span>👤 Receiver</span>
                    <strong>{order.hostelDetails?.receiverName}</strong>
                  </div>
                  <div className="delivery-info-item">
                    <span>🏠 Hostel</span>
                    <strong>{order.hostelDetails?.hostelName}</strong>
                  </div>
                  <div className="delivery-info-item">
                    <span>🚪 Room</span>
                    <strong>{order.hostelDetails?.roomNumber}</strong>
                  </div>
                  <div className="delivery-info-item">
                    <span>🎓 College</span>
                    <strong>{order.hostelDetails?.collegeName}</strong>
                  </div>
                  <div className="delivery-info-item">
                    <span>📞 Mobile</span>
                    <strong>
                      <a href={`tel:${order.hostelDetails?.mobileNumber}`} style={{ color: 'var(--color-primary-light)' }}>
                        {order.hostelDetails?.mobileNumber}
                      </a>
                    </strong>
                  </div>
                  <div className="delivery-info-item">
                    <span>🎨 Theme</span>
                    <strong>{order.theme?.name}</strong>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="delivery-full-card__actions">
                  {order.status === 'packed' || order.status === 'confirmed' ? (
                    <button
                      className="btn btn-primary"
                      disabled={updating === order._id}
                      onClick={() => markStatus(order._id, 'out_for_delivery')}
                    >
                      {updating === order._id ? '...' : '🚴 Mark Out for Delivery'}
                    </button>
                  ) : order.status === 'out_for_delivery' ? (
                    <button
                      className="btn btn-primary"
                      style={{ background: 'linear-gradient(135deg,#10B981,#34D399)' }}
                      disabled={updating === order._id}
                      onClick={() => markStatus(order._id, 'delivered')}
                    >
                      {updating === order._id ? '...' : '✅ Mark Delivered'}
                    </button>
                  ) : order.status === 'delivered' ? (
                    <span className="badge badge-green" style={{ padding: '0.5rem 1rem' }}>✅ Delivered</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DeliveryLayout>
  )
}
