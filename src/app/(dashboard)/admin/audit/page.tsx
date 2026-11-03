'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  Globe,
  Filter,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Search,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Pagination from '@/components/ui/pagination'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'

interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  entity: string
  entityId: string
  oldData: Record<string, unknown>
  newData: Record<string, unknown>
  ipAddress: string
  createdAt: string
}

interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

const ENTITY_TYPES = [
  { value: '', label: 'All Entities' },
  { value: 'Student', label: 'Students' },
  { value: 'Teacher', label: 'Teachers' },
  { value: 'Fee', label: 'Fees' },
  { value: 'Attendance', label: 'Attendance' },
  { value: 'Staff', label: 'Staff' },
  { value: 'Exam', label: 'Exams' },
  { value: 'Notice', label: 'Notices' },
  { value: 'Admission', label: 'Admissions' },
  { value: 'Settings', label: 'Settings' },
]

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'Created', label: 'Created' },
  { value: 'Updated', label: 'Updated' },
  { value: 'Deleted', label: 'Deleted' },
]

const ENTITY_TABS = [
  'All',
  'Student',
  'Teacher',
  'Fee',
  'Attendance',
  'Staff',
  'Exam',
  'Notice',
]

function getActionBadgeVariant(action: string) {
  switch (action) {
    case 'Created':
      return 'success'
    case 'Updated':
      return 'warning'
    case 'Deleted':
      return 'danger'
    default:
      return 'default'
  }
}

function getActionIcon(action: string) {
  switch (action) {
    case 'Created':
      return <Plus className="h-3.5 w-3.5" />
    case 'Updated':
      return <Pencil className="h-3.5 w-3.5" />
    case 'Deleted':
      return <Trash2 className="h-3.5 w-3.5" />
    default:
      return <FileText className="h-3.5 w-3.5" />
  }
}

function formatTimestamp(ts: string) {
  try {
    const d = new Date(ts)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ts
  }
}

function DiffView({ oldData, newData }: { oldData: Record<string, unknown>; newData: Record<string, unknown> }) {
  const allKeys = Array.from(new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]))
  if (allKeys.length === 0) {
    return <p className="text-sm text-muted-foreground">No data changes recorded.</p>
  }

  return (
    <div className="space-y-2">
      {allKeys.map((key) => {
        const oldVal = oldData?.[key]
        const newVal = newData?.[key]
        const isChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal)
        return (
          <div key={key} className={`flex items-start gap-4 rounded-lg p-2.5 text-sm ${isChanged ? 'bg-amber-50/50 dark:bg-amber-900/10' : 'bg-muted/30'}`}>
            <span className="min-w-[120px] font-medium text-muted-foreground shrink-0">{key}</span>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div className="rounded bg-red-50/60 dark:bg-red-900/10 px-2 py-1">
                <span className="text-xs text-danger font-medium">Before</span>
                <p className="text-foreground break-all">{oldVal !== undefined ? String(oldVal) : '-'}</p>
              </div>
              <div className="rounded bg-green-50/60 dark:bg-green-900/10 px-2 py-1">
                <span className="text-xs text-accent font-medium">After</span>
                <p className="text-foreground break-all">{newVal !== undefined ? String(newVal) : '-'}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const [entityFilter, setEntityFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0,
  })

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      const entity = activeTab !== 'All' ? activeTab : entityFilter
      if (entity) params.set('entity', entity)
      if (actionFilter) params.set('action', actionFilter)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      params.set('page', String(pagination.page))
      params.set('limit', String(pagination.limit))

      const res = await fetch(`/api/audit?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch audit logs')
      const json = await res.json()

      if (json.success) {
        setLogs(json.data ?? [])
        if (json.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: json.pagination.total ?? 0,
            totalPages: json.pagination.totalPages ?? 0,
          }))
        }
      }
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [activeTab, entityFilter, actionFilter, dateFrom, dateTo, pagination.page, pagination.limit])

  useEffect(() => {
    fetchLogs()
  }, [pagination.page])

  useEffect(() => {
    fetchLogs()
  }, [activeTab])

  function handleTabChange(tab: string) {
    setActiveTab(tab)
    setEntityFilter(tab !== 'All' ? tab : '')
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  function handleApplyFilters() {
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchLogs()
  }

  function handleReset() {
    setEntityFilter('')
    setActionFilter('')
    setDateFrom('')
    setDateTo('')
    setActiveTab('All')
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Track all system activities and changes</p>
        </div>
        <Button variant="outline" onClick={fetchLogs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-wrap gap-1.5 border-b border-border pb-3"
      >
        {ENTITY_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {tab === 'All' ? 'All' : `${tab}s`}
          </button>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-48">
                <Select
                  label="Action"
                  options={ACTION_OPTIONS}
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                />
              </div>
              <div className="w-full md:w-48">
                <Input
                  label="From Date"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="w-full md:w-48">
                <Input
                  label="To Date"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button variant="primary" onClick={handleApplyFilters}>
                  <Filter className="h-4 w-4 mr-1.5" />
                  Apply
                </Button>
                <Button variant="ghost" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Activity Log</CardTitle>
              <Badge variant="info">{pagination.total} entries</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loading text="Loading audit logs..." />
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FileText className="h-12 w-12 mb-3 opacity-40" />
                <p className="text-sm">No audit logs found</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {logs.map((log) => {
                    const isExpanded = expandedId === log.id
                    return (
                      <motion.div
                        key={log.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="rounded-lg border border-border overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            {getActionIcon(log.action)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-foreground">{log.userName || 'System'}</span>
                              <Badge variant={getActionBadgeVariant(log.action) as any} size="sm">
                                {log.action}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{log.entity}</span>
                              {log.entityId && (
                                <span className="text-xs text-muted-foreground/60 font-mono truncate max-w-[100px]">
                                  {log.entityId}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatTimestamp(log.createdAt)}
                              </span>
                              {log.ipAddress && (
                                <span className="flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  {log.ipAddress}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 text-muted-foreground">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-border px-5 py-4 bg-muted/20">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                                  Data Changes
                                </p>
                                <DiffView oldData={log.oldData} newData={log.newData} />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
            {pagination.totalPages > 1 && (
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
