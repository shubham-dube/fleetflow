'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { FormField, Input } from '@/components/shared/FormComponents'
import { Zap, Eye, EyeOff, Loader2, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { authApi } from '@/lib/auth.api'
import type { ApiError } from '@/types/api.types'

const ROLES = [
  { value: 'MANAGER',        label: 'Manager' },
  { value: 'DISPATCHER',     label: 'Dispatcher' },
  { value: 'SAFETY_OFFICER', label: 'Safety Officer' },
  { value: 'ANALYST',        label: 'Analyst' },
]

export default function SignupPage() {
  const router = useRouter()

  const [name, setName]                   = useState('')
  const [email, setEmail]                 = useState('')
  const [role, setRole]                   = useState('')
  const [password, setPassword]           = useState('')
  const [confirmPassword, setConfirm]     = useState('')
  const [showPassword, setShowPassword]   = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      router.push(ROUTES.LOGIN)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      await registerMutation.mutateAsync({ name, email, password, role })
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError?.error?.message ?? 'Registration failed. Please try again.')
    }
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

        {/* Register card */}
        <div className="card p-6">
          <h2 className="text-sm font-display font-semibold text-text-secondary mb-5">
            Create your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Full name" required>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                autoComplete="name"
                required
              />
            </FormField>

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

            <FormField label="Role" required>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  className="w-full appearance-none bg-bg-elevated border border-bg-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors pr-9"
                >
                  <option value="" disabled>Select a role</option>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-text-muted pointer-events-none" />
              </div>
            </FormField>

            <FormField label="Password" required>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
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

            <FormField label="Confirm password" required>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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
              disabled={registerMutation.isPending || !name || !email || !role || !password || !confirmPassword}
              className="btn-primary w-full justify-center py-2.5"
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>
        </div>

        {/* Sign in link */}
        <p className="text-center text-xs text-text-muted mt-4 font-body">
          Already have an account?{' '}
          <Link
            href={ROUTES.LOGIN}
            className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}