'use client'

import { useState } from 'react'
import { useLogin } from '@/hooks/useAuth'
import { FormField, Input } from '@/components/shared/FormComponents'
import { Zap, Eye, EyeOff, Loader2 } from 'lucide-react'
import type { ApiError } from '@/types/api.types'

const DEMO_CREDENTIALS = [
  { role: 'Manager', email: 'manager@fleetflow.com' },
  { role: 'Dispatcher', email: 'dispatcher@fleetflow.com' },
  { role: 'Safety Officer', email: 'safety@fleetflow.com' },
  { role: 'Analyst', email: 'analyst@fleetflow.com' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loginMutation = useLogin()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await loginMutation.mutateAsync({ email, password })
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError?.error?.message ?? 'Login failed. Please try again.')
    }
  }

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('FleetFlow@123')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 grid-bg">
      {/* Glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 mb-4 shadow-glow">
            <Zap className="size-6 text-cyan-400" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-display font-bold text-text-primary tracking-tight">
            Fleet<span className="text-cyan-400">Flow</span>
          </h1>
          <p className="text-sm text-text-muted mt-1 font-body">Fleet & Logistics Management</p>
        </div>

        {/* Login card */}
        <div className="card p-6">
          <h2 className="text-sm font-display font-semibold text-text-secondary mb-5">
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Email address" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@fleetflow.com"
                autoComplete="email"
                required
              />
            </FormField>

            <FormField label="Password" required>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </FormField>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2 text-xs text-red-400 font-body">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending || !email || !password}
              className="btn-primary w-full justify-center py-2.5"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="mt-4">
          <p className="label-base text-center mb-3">Demo accounts</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_CREDENTIALS.map((cred) => (
              <button
                key={cred.role}
                onClick={() => fillDemo(cred.email)}
                className="text-left card px-3 py-2 hover:border-cyan-500/30 hover:bg-bg-elevated transition-all duration-150 group"
              >
                <p className="text-xs font-display font-semibold text-text-primary group-hover:text-cyan-400 transition-colors">
                  {cred.role}
                </p>
                <p className="text-[10px] text-text-muted truncate mt-0.5">{cred.email}</p>
              </button>
            ))}
          </div>
          <p className="text-center text-[10px] text-text-muted mt-2">Password: FleetFlow@123</p>
        </div>
      </div>
    </div>
  )
}