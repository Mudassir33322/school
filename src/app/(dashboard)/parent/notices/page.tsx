'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { showToast } from '@/components/ui/toast'
import Input from '@/components/ui/input'
import {
  Bell,
  Megaphone,
  Sun,
  CalendarDays,
  Search,
  Filter,
  AlertCircle,
} from 'lucide-react'
import type { Notice } from '@/types'

const typeConfig: Record<
  string,
  { icon: React.ReactNode; badgeVariant: 'info' | 'warning' | 'success' | 'default' }
> = {
  Notice: {
    icon: <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    badgeVariant: 'info',
  },
  Announcement: {
    icon: <Megaphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
    badgeVariant: 'default',
  },
  Holiday: {
    icon: <Sun className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
    badgeVariant: 'warning',
  },
  Event: {
    icon: <CalendarDays className="h-5 w-5 text-green-600 dark:text-green-400" />,
    badgeVariant: 'success',
  },
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await fetch('/api/parent/notices')
        if (!res.ok) throw new Error('Failed to fetch notices')
        const data = await res.json()
        setNotices(Array.isArray(data) ? data : data.notices ?? [])
      } catch {
        showToast('Failed to load notices', 'error')
        setNotices([])
      } finally {
        setLoading(false)
      }
    }
    fetchNotices()
  }, [])

  const types = useMemo(() => {
    const set = new Set(notices.map((n) => n.type))
    return ['All', ...Array.from(set)]
  }, [notices])

  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      const matchesType = typeFilter === 'All' || n.type === typeFilter
      const matchesSearch =
        !search ||
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase())
      return matchesType && matchesSearch
    })
  }, [notices, typeFilter, search])

  if (loading) {
    return <Loading message="Loading notices..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-gray-500 dark:text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Notices & Announcements
        </h1>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          {types.map((type) => (
            <Button
              key={type}
              variant={typeFilter === type ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(type)}
            >
              {type === 'All' ? 'All' : type}
            </Button>
          ))}
        </div>
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search notices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredNotices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {notices.length === 0
                ? 'No notices available'
                : 'No notices match your search'}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {notices.length > 0
                ? 'Try adjusting your search or filter'
                : 'Check back later for updates'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredNotices.map((notice) => {
            const config = typeConfig[notice.type] || typeConfig.Notice
            const bgColor =
              notice.type === 'Notice'
                ? 'bg-blue-50 dark:bg-blue-950/20'
                : notice.type === 'Announcement'
                  ? 'bg-purple-50 dark:bg-purple-950/20'
                  : notice.type === 'Holiday'
                    ? 'bg-yellow-50 dark:bg-yellow-950/20'
                    : notice.type === 'Event'
                      ? 'bg-green-50 dark:bg-green-950/20'
                      : 'bg-gray-50 dark:bg-gray-800'

            return (
              <Card
                key={notice.id}
                className={`border-l-4 transition-shadow hover:shadow-md ${
                  notice.type === 'Notice'
                    ? 'border-l-blue-500'
                    : notice.type === 'Announcement'
                      ? 'border-l-purple-500'
                      : notice.type === 'Holiday'
                        ? 'border-l-yellow-500'
                        : notice.type === 'Event'
                          ? 'border-l-green-500'
                          : 'border-l-gray-500'
                }`}
              >
                <CardContent className={`flex items-start gap-4 p-5 ${bgColor} rounded-r-xl`}>
                  <div
                    className={`rounded-lg p-2 ${
                      notice.type === 'Notice'
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : notice.type === 'Announcement'
                          ? 'bg-purple-100 dark:bg-purple-900/30'
                          : notice.type === 'Holiday'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30'
                            : notice.type === 'Event'
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {notice.title}
                      </h3>
                      <Badge variant={config.badgeVariant}>{notice.type}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                      {notice.content.length > 200
                        ? `${notice.content.substring(0, 200)}...`
                        : notice.content}
                    </p>
                    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                      {new Date(notice.createdAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
