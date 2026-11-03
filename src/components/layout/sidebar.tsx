'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LogOut,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Settings,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { navConfig } from './nav-config'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/contexts/language-context'
import type { UserRole } from '@/types'

interface SidebarProps {
  role: UserRole
  collapsed?: boolean
  mobileOpen?: boolean
  onToggle?: () => void
  onMobileClose?: () => void
}

export default function Sidebar({ role, collapsed, mobileOpen = false, onToggle, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const navItems = navConfig[role]
  const [school, setSchool] = useState({ name: 'School MS', logo: '' })

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((json) => {
        const s = json.data || json
        if (s?.schoolName) setSchool({ name: s.schoolName, logo: s.schoolLogo || '' })
      })
      .catch(() => {})
  }, [])

  const mainNavItems = navItems.filter((item) => item.label !== 'Settings')
  const initial = user?.name?.charAt(0)?.toUpperCase() || '?'

  const navLabelMap: Record<string, string> = {
    Dashboard: 'dashboard',
    Students: 'students',
    Teachers: 'teachers',
    Staff: 'staff',
    Classes: 'classes',
    Subjects: 'subjects',
    Attendance: 'attendance',
    'Fee Management': 'fees',
    Payments: 'payments',
    Exams: 'exams',
    'Online Exams': 'onlineExams',
    Homework: 'homework',
    Notices: 'notices',
    Timetable: 'timetable',
    Calendar: 'calendar',
    Library: 'library',
    Transport: 'transport',
    Hostel: 'hostel',
    Inventory: 'inventory',
    Leaves: 'leaves',
    Admissions: 'admissions',
    Meetings: 'meetings',
    Messages: 'messages',
    Certificates: 'certificates',
    Payroll: 'payroll',
    Analytics: 'analytics',
    Reports: 'reports',
    'Audit Logs': 'auditLogs',
    Backups: 'backups',
  }

  function translateLabel(label: string): string {
    const key = navLabelMap[label]
    return key ? t(key) : label
  }

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  const sidebarContent = (
    <>
      <div className={clsx(
        'flex h-16 items-center border-b border-white/10',
        collapsed ? 'justify-center px-2' : 'justify-between px-4'
      )}>
        <Link href="/" className="flex items-center gap-3" onClick={() => onMobileClose?.()}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-lg overflow-hidden shrink-0">
            {school.logo ? (
              <img src={school.logo} alt={school.name} loading="lazy" className="h-full w-full object-contain" />
            ) : (
              <GraduationCap className="h-5 w-5" />
            )}
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-white truncate max-w-[10rem]">{school.name}</span>
          )}
        </Link>
        <div className="flex items-center gap-1">
          {onToggle && (
            <button
              onClick={onToggle}
              className="hidden rounded-lg p-1.5 text-sidebar-foreground/60 hover:bg-white/10 lg:block transition-colors"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}
          {mobileOpen && (
            <button
              onClick={onMobileClose}
              className="rounded-lg p-1.5 text-sidebar-foreground/60 hover:bg-white/10 lg:hidden transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onMobileClose?.()}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-sidebar-active text-white shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-white/10 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? translateLabel(item.label) : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{translateLabel(item.label)}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-3 space-y-2">
        <Link
          href={`/${role}/settings`}
          onClick={() => onMobileClose?.()}
          className={clsx(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            pathname.startsWith(`/${role}/settings`)
              ? 'bg-sidebar-active text-white shadow-sm'
              : 'text-sidebar-foreground/70 hover:bg-white/10 hover:text-white',
            collapsed && 'justify-center px-2'
          )}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{t('settings')}</span>}
        </Link>

        <div className={clsx('flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5', collapsed && 'justify-center')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary-light text-sm font-bold shrink-0">
            {initial}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate capitalize">{user?.role || ''}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={clsx(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            'text-sidebar-foreground/60 hover:bg-danger/20 hover:text-danger',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{t('logout')}</span>}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 hidden lg:flex flex-col transition-all duration-300',
          'bg-sidebar-bg text-sidebar-foreground',
          collapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 flex flex-col w-[var(--sidebar-width)] bg-sidebar-bg text-sidebar-foreground lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
