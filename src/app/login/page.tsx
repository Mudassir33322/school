'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { GraduationCap, LogIn, User, Lock, Shield, BookOpen, Users, UserCheck } from 'lucide-react'
import type { UserRole } from '@/types'

const roles: { value: UserRole; label: string; icon: typeof User; color: string }[] = [
  { value: 'admin', label: 'Admin', icon: Shield, color: 'bg-primary text-white' },
  { value: 'teacher', label: 'Teacher', icon: BookOpen, color: 'bg-accent text-white' },
  { value: 'student', label: 'Student', icon: Users, color: 'bg-warning text-white' },
  { value: 'parent', label: 'Parent', icon: UserCheck, color: 'bg-danger text-white' },
]

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>('admin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function validateForm(): boolean {
    if (!username.trim()) { setError('Username is required'); return false }
    if (!password.trim()) { setError('Password is required'); return false }
    if (password.length < 4) { setError('Password must be at least 4 characters'); return false }
    return true
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!validateForm()) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Invalid credentials')
        return
      }
      toast.success(`Welcome back, ${data.user.name}!`)
      router.push(`/${data.user.role}/dashboard`)
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex flex-1 flex-col justify-center px-6 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
              <GraduationCap className="h-9 w-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to access your dashboard</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap gap-2 justify-center">
              {roles.map((r) => {
                const Icon = r.icon
                const isActive = role === r.value
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? r.color + ' shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {r.label}
                  </button>
                )
              })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-foreground">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && (
                <div className="animate-fade-in rounded-lg bg-danger/10 px-4 py-2.5 text-sm text-danger border border-danger/20">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} School Management System. All rights reserved.
          </p>
        </div>
      </div>

      <div className="hidden flex-1 bg-gradient-to-br from-indigo-600 via-primary to-indigo-800 lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="max-w-lg text-center relative z-10">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 backdrop-blur border border-white/10">
            <GraduationCap className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Empowering Education</h2>
          <p className="text-lg text-indigo-200 mb-10">
            A complete school management platform connecting administrators, teachers, students, and parents.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Students', value: '1,200+' },
              { label: 'Teachers', value: '80+' },
              { label: 'Classes', value: '40+' },
              { label: 'Years', value: '10+' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
              >
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="mt-1 text-sm text-indigo-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
