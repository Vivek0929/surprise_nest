import { useState, useEffect } from 'react'
import { getThemes, createTheme, updateTheme, deleteTheme } from '../../api/theme.api'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import './Admin.css'

const OCCASIONS = ['Birthday','Anniversary','Farewell','Proposal','Friendship Day','Other']
const EMPTY = { name:'', description:'', occasions:[], price:'', color:'#7C3AED', items:'', isFeatured:false, isActive:true }

export default function AdminThemes() {
  const [themes, setThemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    getThemes().then(({data}) => setThemes(data.themes||[])).catch(()=>{}).finally(()=>setLoading(false))
  }

  useEffect(()=>{ load() },[])

  const openAdd = () => { setForm(EMPTY); setEditing(null); setModal(true) }
  const openEdit = (t) => {
    setForm({ ...t, occasions: t.occasions||[], items: t.items?.join(', ')||'', price: t.price||'' })
    setEditing(t._id); setModal(true)
  }

  const onSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, price: Number(form.price), items: form.items.split(',').map(i=>i.trim()).filter(Boolean) }
      if (editing) await updateTheme(editing, payload)
      else await createTheme(payload)
      toast.success(editing ? 'Theme updated!' : 'Theme created!')
      setModal(false); load()
    } catch (err) { toast.error(err.response?.data?.message||'Error') }
    finally { setSaving(false) }
  }

  const onDelete = async (id) => {
    if (!confirm('Deactivate this theme?')) return
    try { await deleteTheme(id); toast.success('Theme deactivated'); load() }
    catch { toast.error('Error') }
  }

  const toggleOccasion = (occ) => {
    setForm(f => ({...f, occasions: f.occasions.includes(occ) ? f.occasions.filter(o=>o!==occ) : [...f.occasions, occ]}))
  }

  return (
    <AdminLayout>
      <div className="admin-page animate-fade-in">
        <div className="admin-page-header flex-between">
          <div>
            <h2>Manage <span className="gradient-text">Themes</span></h2>
            <p>{themes.length} themes total</p>
          </div>
          <button onClick={openAdd} className="btn btn-primary">+ Add Theme</button>
        </div>

        {loading ? <div className="page-loader"><div className="spinner" /></div> : (
          <div className="grid grid-3 gap-md">
            {themes.map(t => (
              <div key={t._id} className="card admin-theme-card">
                <div className="admin-theme-img">
                  {t.images?.[0] ? <img src={t.images[0]} alt={t.name} onError={e=>e.target.style.display='none'}/> : <span style={{fontSize:'2rem'}}>🎨</span>}
                </div>
                <div className="admin-theme-body">
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <h4>{t.name}</h4>
                    <span style={{width:14,height:14,borderRadius:'50%',background:t.color,display:'inline-block'}}/>
                  </div>
                  <div style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>{t.occasions?.join(', ')}</div>
                  <div style={{fontFamily:'var(--font-heading)',fontWeight:700,color:'var(--color-primary-light)'}}>₹{t.price?.toLocaleString()}</div>
                  {t.isFeatured && <span className="badge badge-amber">Featured</span>}
                </div>
                <div className="admin-theme-actions">
                  <button onClick={()=>openEdit(t)} className="btn btn-secondary btn-sm">Edit</button>
                  <button onClick={()=>onDelete(t._id)} className="btn btn-danger btn-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {modal && (
          <div className="modal-overlay" onClick={()=>setModal(false)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editing ? 'Edit Theme' : 'Add New Theme'}</h3>
                <button className="modal-close" onClick={()=>setModal(false)}>✕</button>
              </div>
              <form onSubmit={onSave} className="flex-col gap-md">
                <div className="form-group"><label className="form-label">Theme Name</label>
                  <input className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Description</label>
                  <textarea className="form-input" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Price (₹)</label>
                  <input className="form-input" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Accent Color</label>
                  <input className="form-input" type="color" value={form.color} onChange={e=>setForm({...form,color:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Occasions</label>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                    {OCCASIONS.map(o=>(
                      <label key={o} style={{display:'flex',alignItems:'center',gap:4,cursor:'pointer'}}>
                        <input type="checkbox" checked={form.occasions.includes(o)} onChange={()=>toggleOccasion(o)} style={{accentColor:'var(--color-primary)'}} />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Items Included (comma separated)</label>
                  <textarea className="form-input" rows={3} value={form.items} onChange={e=>setForm({...form,items:e.target.value})} placeholder="Banner, Balloons, Crown..." /></div>
                <div className="form-group"><label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                  <input type="checkbox" checked={form.isFeatured} onChange={e=>setForm({...form,isFeatured:e.target.checked})} style={{accentColor:'var(--color-primary)'}} />
                  Featured Theme
                </label></div>
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
