import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Auth.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      if (user.role === 'admin') navigate('/admin')
      else if (user.role === 'delivery') navigate('/delivery')
      else navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page page-wrapper">
      <div className="auth-container">
        <div className="auth-card card-glass animate-scale">
          <div className="auth-logo">
            <span>🎊</span>
            <span className="auth-brand">SurpriseNest</span>
          </div>
          <h2 className="auth-title">Welcome Back!</h2>
          <p className="auth-sub">Sign in to continue your celebration journey</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={onSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" name="email" value={form.email}
                onChange={onChange} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" name="password" value={form.password}
                onChange={onChange} placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? <><div className="spinner" style={{width:20,height:20,borderWidth:2}} /> Signing in...</> : '🚀 Sign In'}
            </button>
          </form>

          <div className="auth-demo">
            <p>Demo accounts:</p>
            <div className="auth-demo-accounts">
              <button onClick={() => setForm({ email: 'customer@surprisenest.com', password: 'Customer@123' })} className="auth-demo-btn">👤 Customer</button>
              <button onClick={() => setForm({ email: 'admin@surprisenest.com', password: 'Admin@123' })} className="auth-demo-btn">⚙️ Admin</button>
              <button onClick={() => setForm({ email: 'delivery@surprisenest.com', password: 'Delivery@123' })} className="auth-demo-btn">🚴 Delivery</button>
            </div>
          </div>

          <p className="auth-footer">
            Don't have an account? <Link to="/register" className="auth-link">Sign Up Free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
