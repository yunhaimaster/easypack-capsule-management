'use client'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function useAuth() {
  throw new Error('Deprecated: useAuth no longer used')
}
