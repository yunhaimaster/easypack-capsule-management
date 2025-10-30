'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  phone: string
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN'
  isAdmin: boolean
  isManager: boolean
  nickname?: string | null
}

interface ImpersonationState {
  isImpersonating: boolean
  originalUserId?: string
  impersonatedUserId?: string
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  isAdmin: boolean
  isManager: boolean
  userRole: 'EMPLOYEE' | 'MANAGER' | 'ADMIN' | null
  loading: boolean
  logout: () => Promise<void>
  // Impersonation state
  isImpersonating: boolean
  originalUser: User | null
  exitImpersonation: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  isAdmin: false,
  isManager: false,
  userRole: null,
  loading: true,
  logout: async () => {},
  isImpersonating: false,
  originalUser: null,
  exitImpersonation: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [originalUser, setOriginalUser] = useState<User | null>(null)
  const router = useRouter()

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include' // Ensure cookies are sent
      })
      const data = await res.json()
      
      if (data.success && data.authenticated) {
        setUser(data.user)
        setIsAuthenticated(true)
        
        // Handle impersonation state
        if (data.impersonation?.isImpersonating) {
          setIsImpersonating(true)
          // Store original user info (we'll need to fetch this separately)
          // For now, we'll store the current user as the impersonated user
          // and fetch original user when needed
        } else {
          setIsImpersonating(false)
          setOriginalUser(null)
        }
      } else {
        setUser(null)
        setIsAuthenticated(false)
        setIsImpersonating(false)
        setOriginalUser(null)
      }
    } catch (error) {
      console.error('[Auth] Fetch user data error:', error)
      setUser(null)
      setIsAuthenticated(false)
      setIsImpersonating(false)
      setOriginalUser(null)
    }
  }

  useEffect(() => {
    fetchUserData().finally(() => {
      setLoading(false)
    })
  }, [])

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setIsAuthenticated(false)
      setIsImpersonating(false)
      setOriginalUser(null)
      router.push('/login')
    } catch (error) {
      console.error('[Auth] Logout error:', error)
    }
  }

  const exitImpersonation = async () => {
    try {
      const res = await fetch('/api/admin/impersonate/end', { 
        method: 'POST',
        credentials: 'include'
      })
      const data = await res.json()
      
      if (data.success) {
        // Refresh user data to get back to original admin
        await fetchUserData()
        // Reload page to ensure all components update
        window.location.reload()
      } else {
        console.error('[Auth] Exit impersonation failed:', data.error)
      }
    } catch (error) {
      console.error('[Auth] Exit impersonation error:', error)
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
        isImpersonating,
        originalUser,
        exitImpersonation,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
