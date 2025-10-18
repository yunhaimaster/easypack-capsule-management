'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  isAdmin: boolean
  login: (role: 'admin' | 'user') => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated')
    const userRole = localStorage.getItem('userRole')
    setIsAuthenticated(authStatus === 'true')
    setIsAdmin(userRole === 'admin')
    setIsLoading(false)
  }, [])

  const login = (role: 'admin' | 'user') => {
    setIsAuthenticated(true)
    setIsAdmin(role === 'admin')
    localStorage.setItem('isAuthenticated', 'true')
    localStorage.setItem('userRole', role)
  }

  const logout = () => {
    setIsAuthenticated(false)
    setIsAdmin(false)
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('userRole')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
