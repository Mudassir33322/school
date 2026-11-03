'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  User,
  Users,
  Phone,
  Mail,
  MapPin,
  School,
  Calendar,
  Check,
  X,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Modal from '@/components/ui/modal'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'

interface Admission {
  id: string
  applicantName: string
  fatherName: string
  motherName: string
  dateOfBirth: string
  gender: string
  phone: string
  email: string
  address: string
  previousSchool: string
  previousClass: string
  applyingForClass: string
  documents: string[]
  status: string
  remarks: string
  applicationDate: string
  reviewedBy: string
  reviewedAt: string
  createdAt: string
}

interface AdmissionStats {
  Total: number
  Applied: number
  'Under Review': number
  Accepted: number
  Rejected: number
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'Applied':
      return 'info'
    case 'Under Review':
      return 'warning'
    case 'Accepted':
      return 'success'
    case 'Rejected':
      return 'danger'
    default:
      return 'default'
  }
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return d || '-'
  }
}

const EMPTY_FORM = {
  applicantName: '',
  fatherName: '',
  motherName: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
  email: '',
  address: '',
  previousSchool: '',
  applyingForClass: '',
}

const CLASS_OPTIONS = [
  { value: '1', label: 'Class 1' }, { value: '2', label: 'Class 2' },
  { value: '3', label: 'Class 3' }, { value: '4', label: 'Class 4' },
  { value: '5', label: 'Class 5' }, { value: '6', label: 'Class 6' },
  { value: '7', label: 'Class 7' }, { value: '8', label: 'Class 8' },
  { value: '9', label: 'Class 9' }, { value: '10', label: 'Class 10' },
  { value: '11', label: 'Class 11' }, { value: '12', label: 'Class 12' },
]

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Applied', label: 'Applied' },
  { value: 'Under Review', label: 'Under Review' },
  { value: 'Accepted', label: 'Accepted' },
  { value: 'Rejected', label: 'Rejected' },
]

export default function AdmissionsPage() {
  const [applications, setApplications] = useState<Admission[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState<AdmissionStats>({ Total: 0, Applied: 0, 'Under Review': 0, Accepted: 0, Rejected: 0 })

  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedApp, setSelectedApp] = useState<Admission | null>(null)
  const [reviewAction, setReviewAction] = useState<'Accepted' | 'Rejected'>('Accepted')
  const [reviewRemarks, setReviewRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState(EMPTY_FORM)

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/admissions?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch admissions')
      const json = await res.json()
      if (json.success) {
        setApplications(json.data ?? [])
      }
    } catch {
      setApplications([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admissions?stats=true')
      const json = await res.json()
      if (json.success && json.data) {
        setStats({
          Total: json.data.Total ?? 0,
          Applied: json.data.Applied ?? 0,
          'Under Review': json.data['Under Review'] ?? 0,
          Accepted: json.data.Accepted ?? 0,
          Rejected: json.data.Rejected ?? 0,
        })
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchApplications()
    fetchStats()
  }, [fetchApplications, fetchStats])

  function handleAddChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleAddSubmit() {
    if (!formData.applicantName || !formData.applyingForClass) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, status: 'Applied', documents: [] }),
      })
      if (!res.ok) throw new Error('Failed to submit application')
      setShowAddModal(false)
      setFormData(EMPTY_FORM)
      fetchApplications()
      fetchStats()
    } catch {
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReview() {
    if (!selectedApp) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/admissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedApp.id,
          action: 'review',
          reviewedBy: 'Admin',
          status: reviewAction,
          remarks: reviewRemarks,
        }),
      })
      if (!res.ok) throw new Error('Failed to review application')
      setShowReviewModal(false)
      setSelectedApp(null)
      setReviewRemarks('')
      fetchApplications()
      fetchStats()
    } catch {
    } finally {
      setSubmitting(false)
    }
  }

  function openDetail(app: Admission) {
    setSelectedApp(app)
    setShowDetailModal(true)
  }

  function openReview(app: Admission, action: 'Accepted' | 'Rejected') {
    setSelectedApp(app)
    setReviewAction(action)
    setReviewRemarks('')
    setShowReviewModal(true)
  }

  const statCards = [
    { label: 'Total Applications', value: stats.Total, icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Pending', value: stats.Applied + stats['Under Review'], icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Accepted', value: stats.Accepted, icon: CheckCircle2, color: 'text-accent', bg: 'bg-accent-light/30' },
    { label: 'Rejected', value: stats.Rejected, icon: XCircle, color: 'text-danger', bg: 'bg-red-50 dark:bg-red-900/20' },
  ]

  const filteredApps = applications.filter((a) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      a.applicantName.toLowerCase().includes(s) ||
      a.fatherName.toLowerCase().includes(s) ||
      a.email.toLowerCase().includes(s)
    )
  })

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admissions</h1>
          <p className="text-muted-foreground mt-1">Manage student admission applications</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { fetchApplications(); fetchStats() }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05 }}>
            <Card variant="compact">
              <CardContent className="flex items-center gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  label="Search"
                  placeholder="Search by name, father name, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-full md:w-48">
                <Select
                  label="Status"
                  options={STATUS_OPTIONS}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Applications</CardTitle>
              <Badge variant="info">{filteredApps.length} total</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loading text="Loading applications..." />
            ) : filteredApps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mb-3 opacity-40" />
                <p className="text-sm">No applications found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApps.map((app, idx) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-border p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {app.applicantName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">{app.applicantName}</span>
                        <Badge variant={getStatusBadgeVariant(app.status) as any}>{app.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Father: {app.fatherName}
                        </span>
                        <span className="flex items-center gap-1">
                          <School className="h-3 w-3" />
                          Class {app.applyingForClass}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(app.applicationDate || app.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openDetail(app)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(app.status === 'Applied' || app.status === 'Under Review') && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openReview(app, 'Accepted')}>
                            <Check className="h-4 w-4 text-accent" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openReview(app, 'Rejected')}>
                            <X className="h-4 w-4 text-danger" />
                          </Button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="New Admission Application" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Applicant Name"
              placeholder="Full name"
              value={formData.applicantName}
              onChange={(e) => handleAddChange('applicantName', e.target.value)}
            />
            <Input
              label="Father's Name"
              placeholder="Father's name"
              value={formData.fatherName}
              onChange={(e) => handleAddChange('fatherName', e.target.value)}
            />
            <Input
              label="Mother's Name"
              placeholder="Mother's name"
              value={formData.motherName}
              onChange={(e) => handleAddChange('motherName', e.target.value)}
            />
            <Input
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleAddChange('dateOfBirth', e.target.value)}
            />
            <Select
              label="Gender"
              options={GENDER_OPTIONS}
              value={formData.gender}
              onChange={(e) => handleAddChange('gender', e.target.value)}
            />
            <Input
              label="Phone"
              placeholder="Contact number"
              value={formData.phone}
              onChange={(e) => handleAddChange('phone', e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) => handleAddChange('email', e.target.value)}
            />
            <Input
              label="Previous School"
              placeholder="Previous school name"
              value={formData.previousSchool}
              onChange={(e) => handleAddChange('previousSchool', e.target.value)}
            />
            <Select
              label="Applying for Class"
              options={CLASS_OPTIONS}
              value={formData.applyingForClass}
              onChange={(e) => handleAddChange('applyingForClass', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Address</label>
            <textarea
              className="block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:border-ring"
              rows={3}
              placeholder="Full address"
              value={formData.address}
              onChange={(e) => handleAddChange('address', e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddSubmit}
              disabled={submitting || !formData.applicantName || !formData.applyingForClass}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDetailModal} onClose={() => { setShowDetailModal(false); setSelectedApp(null) }} title="Application Details" size="lg">
        {selectedApp && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                {selectedApp.applicantName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{selectedApp.applicantName}</h3>
                <Badge variant={getStatusBadgeVariant(selectedApp.status) as any} size="md">{selectedApp.status}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: Users, label: "Father's Name", value: selectedApp.fatherName },
                { icon: Users, label: "Mother's Name", value: selectedApp.motherName },
                { icon: Calendar, label: 'Date of Birth', value: formatDate(selectedApp.dateOfBirth) },
                { icon: User, label: 'Gender', value: selectedApp.gender },
                { icon: Phone, label: 'Phone', value: selectedApp.phone },
                { icon: Mail, label: 'Email', value: selectedApp.email },
                { icon: MapPin, label: 'Address', value: selectedApp.address },
                { icon: School, label: 'Previous School', value: selectedApp.previousSchool },
                { icon: GraduationCap, label: 'Applying for Class', value: `Class ${selectedApp.applyingForClass}` },
                { icon: Calendar, label: 'Applied On', value: formatDate(selectedApp.applicationDate || selectedApp.createdAt) },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <item.icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium text-foreground">{item.value || '-'}</p>
                  </div>
                </div>
              ))}
            </div>

            {selectedApp.remarks && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Remarks</p>
                <p className="text-sm text-foreground">{selectedApp.remarks}</p>
              </div>
            )}

            {(selectedApp.status === 'Applied' || selectedApp.status === 'Under Review') && (
              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <Button variant="danger" onClick={() => { setShowDetailModal(false); openReview(selectedApp, 'Rejected') }}>
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Reject
                </Button>
                <Button variant="success" onClick={() => { setShowDetailModal(false); openReview(selectedApp, 'Accepted') }}>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Accept
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={showReviewModal} onClose={() => { setShowReviewModal(false); setSelectedApp(null) }} title={`Review Application`} size="md">
        {selectedApp && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {selectedApp.applicantName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-foreground">{selectedApp.applicantName}</p>
                <p className="text-xs text-muted-foreground">Class {selectedApp.applyingForClass}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">Decision:</span>
              <Button
                variant={reviewAction === 'Accepted' ? 'success' : 'outline'}
                size="sm"
                onClick={() => setReviewAction('Accepted')}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Accept
              </Button>
              <Button
                variant={reviewAction === 'Rejected' ? 'danger' : 'outline'}
                size="sm"
                onClick={() => setReviewAction('Rejected')}
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Reject
              </Button>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Remarks</label>
              <textarea
                className="block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:border-ring"
                rows={3}
                placeholder="Add remarks..."
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => { setShowReviewModal(false); setSelectedApp(null) }}>
                Cancel
              </Button>
              <Button
                variant={reviewAction === 'Accepted' ? 'success' : 'danger'}
                onClick={handleReview}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : reviewAction === 'Accepted' ? 'Accept Application' : 'Reject Application'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
