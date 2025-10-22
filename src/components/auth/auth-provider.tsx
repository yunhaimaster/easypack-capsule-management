'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  phone: string
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN'
  isAdmin: boolean
  isManager: boolean
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  isAdmin: boolean
  isManager: boolean
  userRole: 'EMPLOYEE' | 'MANAGER' | 'ADMIN' | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  isAdmin: false,
  isManager: false,
  userRole: null,
  loading: true,
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Fetch current user on mount
    fetch('/api/auth/me', {
      credentials: 'include' // Ensure cookies are sent
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.authenticated) {
          setUser(data.user)
          setIsAuthenticated(true)
        }
      })
      .catch(() => {
        // Silent fail - user not authenticated
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setIsAuthenticated(false)
      router.push('/login')
    } catch (error) {
      console.error('[Auth] Logout error:', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isAdmin: user?.isAdmin || false,
        isManager: user?.isManager || false,
        userRole: user?.role || null,
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
