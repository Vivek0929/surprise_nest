import { createContext, useContext, useState, useEffect } from 'react'
import { login as loginApi, register as registerApi, getMe } from '../api/auth.api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sn_user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('sn_token')
    if (token) {
      getMe()
        .then(({ data }) => setUser(data.user))
        .catch(() => { localStorage.removeItem('sn_token'); localStorage.removeItem('sn_user'); setUser(null) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const { data } = await loginApi({ email, password })
    localStorage.setItem('sn_token', data.token)
    localStorage.setItem('sn_user', JSON.stringify(data.user))
    setUser(data.user)
    toast.success(`Welcome back, ${data.user.name}! 🎉`)
    return data.user
  }

  const register = async (formData) => {
    const { data } = await registerApi(formData)
    localStorage.setItem('sn_token', data.token)
    localStorage.setItem('sn_user', JSON.stringify(data.user))
    setUser(data.user)
    toast.success(`Account created! Welcome, ${data.user.name}! 🎊`)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('sn_token')
    localStorage.removeItem('sn_user')
    setUser(null)
    toast.success('Logged out successfully')
  }

  const isAdmin = user?.role === 'admin'
  const isDelivery = user?.role === 'delivery'
  const isCustomer = user?.role === 'customer'

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, isDelivery, isCustomer }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
