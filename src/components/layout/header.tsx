'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Menu,
  LogOut,
  Settings,
  Check,
  CheckCheck,
  Globe,
} from 'lucide-react'
import clsx from 'clsx'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/contexts/language-context'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

interface HeaderProps {
  title?: string
  onMenuToggle?: () => void
}

export default function Header({ title, onMenuToggle }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { language, setLanguage } = useLanguage()
  const [dark, setDark] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setDark(isDark)
  }, [])

  useEffect(() => {
    if (user?.id) fetchNotifications()
  }, [user?.id])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function fetchNotifications() {
    try {
      const res = await fetch(`/api/notifications?userId=${user?.id}`)
      if (res.ok) {
        const json = await res.json()
        setNotifications(json.data || [])
        setUnreadCount(json.unreadCount || 0)
      }
    } catch { /* ignore */ }
  }

  async function handleMarkAllRead() {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead', userId: user?.id }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch { /* ignore */ }
  }

  const toggleDark = () => {
    const html = document.documentElement
    if (dark) {
      html.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    } else {
      html.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    }
    setDark(!dark)
  }

  const pageTitle =
    title ||
    pathname
      .split('/')
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()) ||
    'Dashboard'

  const roleBadge = {
    admin: { label: 'Admin', color: 'primary' as const },
    teacher: { label: 'Teacher', color: 'success' as const },
    student: { label: 'Student', color: 'warning' as const },
    parent: { label: 'Parent', color: 'info' as const },
  }

  const segment = pathname.split('/')[1] as keyof typeof roleBadge
  const badge = roleBadge[segment] || { label: 'Admin', color: 'primary' as const }
  const initial = user?.name?.charAt(0)?.toUpperCase() || '?'

  async function handleLogout() {
    setDropdownOpen(false)
    await logout()
    router.push('/login')
  }

  return (
    <header
      className={clsx(
        'sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-header-bg/80 px-4 backdrop-blur-md lg:px-6'
      )}
    >
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-foreground">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleDark}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
          title="Toggle dark mode"
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <button
          onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
          title={language === 'en' ? 'Switch to Urdu' : 'Switch to English'}
        >
          <Globe className="h-5 w-5" />
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="text-sm font-semibold text-foreground">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="h-3 w-3" />
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications</p>
                  ) : (
                    notifications.slice(0, 10).map((notif) => (
                      <div
                        key={notif.id}
                        className={clsx(
                          'px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors',
                          !notif.read && 'bg-primary/5'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {!notif.read && (
                            <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{notif.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 pl-3 border-l border-border ml-1 hover:opacity-80 transition-opacity"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-primary text-sm font-bold">
              {initial}
            </div>
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{user?.name || 'User'}</span>
                <Badge variant={badge.color} size="sm">{badge.label}</Badge>
              </div>
            </div>
            <ChevronDown className="hidden sm:block h-4 w-4 text-muted-foreground" />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-xl overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">{user?.role || ''}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { setDropdownOpen(false); router.push(`/${segment}/settings/profile`) }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
