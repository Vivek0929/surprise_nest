import { useState, useEffect } from 'react'
import { getAddons, createAddon, updateAddon, deleteAddon } from '../../api/order.api'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import './Admin.css'

const CATEGORIES = ['Food','Flowers','Photo','Gift','Entertainment','Other']
const EMPTY = { name:'', price:'', category:'Other', description:'' }

export default function AdminAddOns() {
  const [addons, setAddons] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    getAddons().then(({data}) => setAddons(data.addons||[])).catch(()=>{}).finally(()=>setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(EMPTY); setEditing(null); setModal(true) }
  const openEdit = (a) => { setForm({...a, price: a.price}); setEditing(a._id); setModal(true) }

  const onSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, price: Number(form.price) }
      if (editing) await updateAddon(editing, payload)
      else await createAddon(payload)
      toast.success(editing ? 'Add-on updated!' : 'Add-on created!')
      setModal(false); load()
    } catch (err) { toast.error(err.response?.data?.message||'Error') }
    finally { setSaving(false) }
  }

  const onDelete = async (id) => {
    if (!confirm('Deactivate this add-on?')) return
    try { await deleteAddon(id); toast.success('Add-on deactivated'); load() }
    catch { toast.error('Error') }
  }

  const CAT_ICONS = { Food:'🎂', Flowers:'🌸', Photo:'📷', Gift:'🎁', Entertainment:'🎵', Other:'✨' }

  return (
    <AdminLayout>
      <div className="admin-page animate-fade-in">
        <div className="admin-page-header flex-between">
          <div>
            <h2>Manage <span className="gradient-text">Add-Ons</span></h2>
            <p>{addons.length} add-ons available</p>
          </div>
          <button onClick={openAdd} className="btn btn-primary">+ Add Item</button>
        </div>

        {loading ? <div className="page-loader"><div className="spinner" /></div> : (
          <div className="table-wrapper card">
            <table>
              <thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Actions</th></tr></thead>
              <tbody>
                {addons.map(a => (
                  <tr key={a._id}>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                        <span style={{fontSize:'1.5rem'}}>{CAT_ICONS[a.category]}</span>
                        <div>
                          <div style={{fontWeight:600}}>{a.name}</div>
                          <div style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>{a.description}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-purple">{a.category}</span></td>
                    <td style={{fontFamily:'var(--font-heading)',fontWeight:700}}>₹{a.price}</td>
                    <td>
                      <div style={{display:'flex',gap:'8px'}}>
                        <button onClick={()=>openEdit(a)} className="btn btn-secondary btn-sm">Edit</button>
                        <button onClick={()=>onDelete(a._id)} className="btn btn-danger btn-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {modal && (
          <div className="modal-overlay" onClick={()=>setModal(false)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editing ? 'Edit Add-On' : 'Add New Add-On'}</h3>
                <button className="modal-close" onClick={()=>setModal(false)}>✕</button>
              </div>
              <form onSubmit={onSave} className="flex-col gap-md">
                <div className="form-group"><label className="form-label">Name</label>
                  <input className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Price (₹)</label>
                  <input className="form-input" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                    {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Description</label>
                  <textarea className="form-input" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? '💾 Update' : '✨ Create'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
