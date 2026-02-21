'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type JSX,
} from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/auth.api'
import { setAccessToken } from '@/lib/api'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { ROUTES } from '@/constants/routes'
import type { User } from '@/types/models.types'
import type { ApiError } from '@/types/api.types'

// ─── Auth Context ─────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const queryClient = useQueryClient()

  // TanStack Query v5 removed onSuccess/onError from useQuery — use useEffect instead
  const { data: meData, isLoading, error: meError } = useQuery({
    queryKey: QUERY_KEYS.me,
    queryFn: authApi.me,
    retry: false,
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    if (meData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = meData as any
      setAccessToken(res.data.accessToken)
      setUser(res.data.user)
    }
  }, [meData])

  useEffect(() => {
    if (meError) {
      setAccessToken(null)
      setUser(null)
    }
  }, [meError])

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login({ email, password }),
    onSuccess: (res) => {
      setAccessToken(res.data.accessToken)
      setUser(res.data.user)
      router.push(ROUTES.DASHBOARD)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      setAccessToken(null)
      setUser(null)
      queryClient.clear()
      router.push(ROUTES.LOGIN)
    },
  })

  const login = useCallback(
    async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password })
    },
    [loginMutation],
  )

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync()
  }, [logoutMutation])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function useLogin() {
  const router = useRouter()
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login({ email, password }),
    onSuccess: (res) => {
      setAccessToken(res.data.accessToken)
      router.push(ROUTES.DASHBOARD)
    },
  })
}

export function useRequireRole(roles: string[]): boolean {
  const { user } = useAuth()
  return !!user && roles.includes(user.role)
}

export type { ApiError }