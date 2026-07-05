import { useState, useEffect } from 'react'
import { getInventory, updateInventory } from '../../api/admin.api'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import './Admin.css'

export default function AdminInventory() {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState({})
  const [saving, setSaving] = useState(null)

  const load = () => {
    getInventory().then(({data}) => setInventory(data.inventory||[])).catch(()=>{}).finally(()=>setLoading(false))
  }

  useEffect(() => { load() }, [])

  const startEdit = (item) => {
    setEditing({ ...editing, [item._id]: { quantity: item.quantity, lowStockThreshold: item.lowStockThreshold } })
  }

  const saveItem = async (id) => {
    setSaving(id)
    try {
      await updateInventory(id, editing[id])
      toast.success('Inventory updated!')
      const e = { ...editing }; delete e[id]; setEditing(e)
      load()
    } catch { toast.error('Failed to update') }
    finally { setSaving(null) }
  }

  const lowStock = inventory.filter(i => i.quantity <= i.lowStockThreshold)

  return (
    <AdminLayout>
      <div className="admin-page animate-fade-in">
        <div className="admin-page-header">
          <h2>Manage <span className="gradient-text">Inventory</span></h2>
          <p>{inventory.length} items tracked · {lowStock.length > 0 && <span style={{color:'var(--color-danger)'}}>⚠️ {lowStock.length} low stock</span>}</p>
        </div>

        {lowStock.length > 0 && (
          <div className="inventory-alert">
            ⚠️ <strong>Low Stock Alert:</strong> {lowStock.map(i=>i.itemName).join(', ')}
          </div>
        )}

        {loading ? <div className="page-loader"><div className="spinner" /></div> : (
          <div className="table-wrapper card">
            <table>
              <thead><tr><th>Item</th><th>Type</th><th>Quantity</th><th>Low Stock At</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {inventory.map(item => {
                  const isLow = item.quantity <= item.lowStockThreshold
                  const isEditing = !!editing[item._id]
                  return (
                    <tr key={item._id}>
                      <td style={{fontWeight:600}}>{item.itemName}</td>
                      <td><span className={`badge ${item.itemType==='theme'?'badge-purple':'badge-pink'}`}>{item.itemType}</span></td>
                      <td>
                        {isEditing
                          ? <input type="number" className="form-input" style={{width:80,padding:'4px 8px'}} value={editing[item._id].quantity}
                              onChange={e=>setEditing({...editing,[item._id]:{...editing[item._id],quantity:Number(e.target.value)}})} />
                          : <strong style={{color:isLow?'var(--color-danger)':'var(--text-primary)'}}>{item.quantity}</strong>}
                      </td>
                      <td>
                        {isEditing
                          ? <input type="number" className="form-input" style={{width:80,padding:'4px 8px'}} value={editing[item._id].lowStockThreshold}
                              onChange={e=>setEditing({...editing,[item._id]:{...editing[item._id],lowStockThreshold:Number(e.target.value)}})} />
                          : item.lowStockThreshold}
                      </td>
                      <td>
                        {isLow
                          ? <span className="badge badge-red">⚠️ Low Stock</span>
                          : <span className="badge badge-green">✓ OK</span>}
                      </td>
                      <td>
                        {isEditing
                          ? <div style={{display:'flex',gap:4}}>
                              <button onClick={()=>saveItem(item._id)} className="btn btn-primary btn-sm" disabled={saving===item._id}>
                                {saving===item._id?'...':'Save'}
                              </button>
                              <button onClick={()=>{ const e={...editing}; delete e[item._id]; setEditing(e) }} className="btn btn-secondary btn-sm">Cancel</button>
                            </div>
                          : <button onClick={()=>startEdit(item)} className="btn btn-secondary btn-sm">Edit</button>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
