import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

function decodeToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload
  } catch {
    return null
  }
}

function isTokenExpired(payload) {
  if (!payload?.exp) return true
  return payload.exp * 1000 < Date.now()
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const stored = localStorage.getItem('jwt')
    if (!stored) return
    const payload = decodeToken(stored)
    if (!payload || isTokenExpired(payload)) {
      localStorage.removeItem('jwt')
      navigate('/login', { replace: true })
      return
    }
    setToken(stored)
    setUser(payload)
  }, [navigate])

  const login = useCallback((newToken) => {
    const payload = decodeToken(newToken)
    if (!payload || isTokenExpired(payload)) return
    localStorage.setItem('jwt', newToken)
    setToken(newToken)
    setUser(payload)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('jwt')
    setToken(null)
    setUser(null)
    navigate('/login', { replace: true })
  }, [navigate])

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
