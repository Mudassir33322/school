'use client'

import { useState } from 'react'
import Sidebar from './sidebar'
import Header from './header'
import clsx from 'clsx'
import type { UserRole } from '@/types'

interface AppShellProps {
  children: React.ReactNode
  role?: UserRole
  headerTitle?: string
}

export default function AppShell({
  children,
  role = 'admin',
  headerTitle,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        role={role}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={() => setCollapsed(!collapsed)}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div
        className={clsx(
          'transition-all duration-300 min-h-screen',
          collapsed ? 'lg:ml-[var(--sidebar-collapsed-width)]' : 'lg:ml-[var(--sidebar-width)]'
        )}
      >
        <Header title={headerTitle} onMenuToggle={() => setMobileOpen(true)} />
        <main className="p-4 lg:p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  )
}
