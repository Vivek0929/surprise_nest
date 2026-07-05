import { useState, useEffect } from 'react'
import { getAdminOrders, updateOrderStatus, assignDeliveryPartner, getDeliveryPartners } from '../../api/admin.api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import './Admin.css'

const STATUSES = ['placed','confirmed','packed','out_for_delivery','delivered','cancelled']

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)

  const load = () => {
    Promise.all([getAdminOrders({ status: filterStatus || undefined }), getDeliveryPartners()])
      .then(([o, p]) => { setOrders(o.data.orders || []); setPartners(p.data.partners || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filterStatus])

  const changeStatus = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, { status })
      toast.success(`Status updated to ${status}`)
      load()
    } catch { toast.error('Failed to update status') }
  }

  const assignPartner = async (orderId, partnerId) => {
    try {
      await assignDeliveryPartner(orderId, { deliveryPartnerId: partnerId })
      toast.success('Delivery partner assigned!')
      load()
    } catch { toast.error('Failed to assign partner') }
  }

  return (
    <AdminLayout>
      <div className="admin-page animate-fade-in">
        <div className="admin-page-header">
          <h2>Manage <span className="gradient-text">Orders</span></h2>
          <p>{orders.length} order{orders.length !== 1 ? 's' : ''} found</p>
        </div>

        {/* Filter */}
        <div className="admin-filters">
          <button className={`filter-chip ${filterStatus === '' ? 'active' : ''}`} onClick={() => setFilterStatus('')}>All</button>
          {STATUSES.map((s) => (
            <button key={s} className={`filter-chip ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>
              {s.replace(/_/g,' ')}
            </button>
          ))}
        </div>

        {loading ? <div className="page-loader"><div className="spinner" /></div> : (
          <div className="card table-wrapper">
            <table>
              <thead><tr>
                <th>Order ID</th><th>Customer</th><th>Theme</th><th>Delivery Date</th>
                <th>Amount</th><th>Status</th><th>Delivery Partner</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td><code style={{color:'var(--color-primary-light)'}}>#{o.orderId}</code></td>
                    <td>
                      <div style={{fontWeight:600}}>{o.user?.name}</div>
                      <div style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>{o.user?.phone}</div>
                    </td>
                    <td>{o.theme?.name || '-'}</td>
                    <td>{o.deliveryDate ? format(new Date(o.deliveryDate),'dd MMM yyyy') : '-'}</td>
                    <td>₹{o.amounts?.total?.toLocaleString()}</td>
                    <td>
                      <select className="admin-status-select"
                        value={o.status}
                        onChange={(e) => changeStatus(o._id, e.target.value)}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                      </select>
                    </td>
                    <td>
                      <select className="admin-status-select"
                        value={o.deliveryPartner?._id || ''}
                        onChange={(e) => assignPartner(o._id, e.target.value)}>
                        <option value="">-- Assign --</option>
                        {partners.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <div style={{display:'flex',gap:'4px'}}>
                        <span className={`badge status-${o.status}`}>{o.status.replace(/_/g,' ')}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && <div className="empty-state"><div className="empty-state-icon">📦</div><h3>No orders found</h3></div>}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
