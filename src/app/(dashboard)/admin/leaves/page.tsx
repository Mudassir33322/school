'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, X, Clock, Filter, Users, CalendarDays, FileText, Search,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Modal from '@/components/ui/modal'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface Leave {
  id: string
  userId: string
  userType: string
  leaveType: string
  startDate: string
  endDate: string
  reason: string
  status: string
  approvedBy: string
  remarks: string
  createdAt: string
}

const leaveTypes = ['Sick Leave', 'Casual Leave', 'Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Other'] as const

const statusBadge: Record<string, 'warning' | 'success' | 'danger'> = {
  Pending: 'warning', Approved: 'success', Rejected: 'danger',
}

const userTypeBadge: Record<string, 'info' | 'primary' | 'default'> = {
  Student: 'info', Teacher: 'primary', Staff: 'default',
}

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending')
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [statusModal, setStatusModal] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null)
  const [actionStatus, setActionStatus] = useState<'Approved' | 'Rejected'>('Approved')
  const [remarks, setRemarks] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      const allStatuses = ['Pending', 'Approved', 'Rejected']
      if (allStatuses.includes(activeTab)) params.set('status', activeTab)
      if (leaveTypeFilter) params.set('leaveType', leaveTypeFilter)
      const res = await fetch(`/api/leaves?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch leaves')
      const json = await res.json()
      setLeaves(json.data ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load leaves')
    } finally {
      setLoading(false)
    }
  }, [activeTab, leaveTypeFilter])

  useEffect(() => { fetchLeaves() }, [fetchLeaves])

  const pendingCount = leaves.filter(l => l.status === 'Pending').length
  const approvedCount = leaves.filter(l => l.status === 'Approved').length
  const rejectedCount = leaves.filter(l => l.status === 'Rejected').length

  const filteredLeaves = leaves.filter(l => {
    if (l.status !== activeTab) return false
    if (leaveTypeFilter && l.leaveType !== leaveTypeFilter) return false
    if (search) {
      const s = search.toLowerCase()
      return l.leaveType.toLowerCase().includes(s) || l.reason.toLowerCase().includes(s)
    }
    return true
  })

  function openStatusModal(leave: Leave, status: 'Approved' | 'Rejected') {
    setSelectedLeave(leave)
    setActionStatus(status)
    setRemarks('')
    setStatusModal(true)
  }

  async function handleStatusUpdate() {
    if (!selectedLeave) return
    try {
      setProcessing(true)
      const res = await fetch('/api/leaves', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedLeave.id,
          status: actionStatus,
          approvedBy: 'admin',
          remarks,
        }),
      })
      if (!res.ok) throw new Error('Failed to update leave status')
      toast.success(`Leave ${actionStatus.toLowerCase()} successfully`)
      setStatusModal(false)
      setSelectedLeave(null)
      fetchLeaves()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update leave status')
    } finally {
      setProcessing(false)
    }
  }

  const tabs = [
    { key: 'Pending' as const, label: 'Pending', count: pendingCount, icon: Clock },
    { key: 'Approved' as const, label: 'Approved', count: approvedCount, icon: Check },
    { key: 'Rejected' as const, label: 'Rejected', count: rejectedCount, icon: X },
  ]

  const stats = [
    { label: 'Pending', value: pendingCount, color: 'text-warning', bg: 'bg-warning/10', icon: Clock },
    { label: 'Approved', value: approvedCount, color: 'text-accent', bg: 'bg-accent/10', icon: Check },
    { label: 'Rejected', value: rejectedCount, color: 'text-danger', bg: 'bg-danger/10', icon: X },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leave Management</h1>
          <p className="text-muted-foreground mt-1">Approve and manage leave requests</p>
        </div>
      </motion.div>

      <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
        initial="hidden" animate="show">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <motion.div key={stat.label} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
              <Card variant="stat">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Leave Requests</CardTitle>
              <div className="flex items-center gap-2">
                <Input placeholder="Search..." value={search}
                  onChange={(e) => setSearch(e.target.value)} icon={<Search className="h-4 w-4" />}
                  className="w-40" />
                <Select options={[{ value: '', label: 'All Types' }, ...leaveTypes.map(t => ({ value: t, label: t }))]}
                  value={leaveTypeFilter} onChange={(e) => setLeaveTypeFilter(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    <span className="opacity-80">({tab.count})</span>
                  </button>
                )
              })}
            </div>

            {loading ? (
              <Loading text="Loading leaves..." />
            ) : filteredLeaves.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium text-foreground">No {activeTab.toLowerCase()} leaves</p>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'Pending' ? 'No pending leave requests to review' : `No ${activeTab.toLowerCase()} leave requests found`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">User</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Leave Type</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dates</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    <AnimatePresence>
                      {filteredLeaves.map((leave, idx) => (
                        <motion.tr key={leave.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.03 }} className="hover:bg-muted/50 transition-colors">
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Badge variant={userTypeBadge[leave.userType] || 'default'}>{leave.userType}</Badge>
                              <span className="text-sm text-muted-foreground">#{leave.userId.slice(0, 8)}</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">{leave.leaveType}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground max-w-[200px] truncate">{leave.reason || '-'}</td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <Badge variant={statusBadge[leave.status] || 'default'}>{leave.status}</Badge>
                            {leave.remarks && leave.status !== 'Pending' && (
                              <p className="text-xs text-muted-foreground mt-0.5">{leave.remarks}</p>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right">
                            {leave.status === 'Pending' ? (
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" onClick={() => openStatusModal(leave, 'Approved')}
                                  className="text-accent hover:text-accent" title="Approve">
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => openStatusModal(leave, 'Rejected')}
                                  className="text-danger hover:text-danger" title="Reject">
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {leave.approvedBy ? `By ${leave.approvedBy}` : '-'}
                              </span>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Modal isOpen={statusModal} onClose={() => { setStatusModal(false); setSelectedLeave(null) }}
        title={`${actionStatus === 'Approved' ? 'Approve' : 'Reject'} Leave Request`} size="sm">
        <div className="space-y-4">
          {selectedLeave && (
            <div className="rounded-lg border border-border p-3 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={userTypeBadge[selectedLeave.userType] || 'default'}>{selectedLeave.userType}</Badge>
                <span className="font-medium text-foreground">{selectedLeave.leaveType}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(selectedLeave.startDate)} - {formatDate(selectedLeave.endDate)}
              </div>
              {selectedLeave.reason && (
                <p className="text-muted-foreground">{selectedLeave.reason}</p>
              )}
            </div>
          )}
          <Input label="Remarks (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)}
            placeholder={actionStatus === 'Approved' ? 'Approval remarks...' : 'Rejection reason...'} />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setStatusModal(false); setSelectedLeave(null) }}>Cancel</Button>
            <Button variant={actionStatus === 'Approved' ? 'success' : 'danger'} onClick={handleStatusUpdate} disabled={processing}>
              {processing ? 'Processing...' : actionStatus === 'Approved' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
