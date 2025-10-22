'use client'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

// Deprecated: kept for backwards compatibility only
export function useAuth() {
  return undefined
}
