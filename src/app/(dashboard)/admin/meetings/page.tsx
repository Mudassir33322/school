'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Video,
  Users,
  Calendar,
  Clock,
  ExternalLink,
  Trash2,
  Search,
  VideoIcon,
  Monitor,
  MapPin,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Modal from '@/components/ui/modal'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'

interface Meeting {
  id: string
  title: string
  description: string
  type: string
  link: string
  meetingId: string
  password: string
  date: string
  time: string
  duration: string
  participants: string[]
  status: string
  createdBy: string
  createdAt: string
}

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'Scheduled', label: 'Scheduled' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
]

const typeOptions = [
  { value: 'Zoom', label: 'Zoom' },
  { value: 'Google Meet', label: 'Google Meet' },
  { value: 'In-Person', label: 'In-Person' },
]

const statusBadge: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  Scheduled: 'info',
  Completed: 'success',
  Cancelled: 'danger',
}

const typeIcon: Record<string, typeof Video> = {
  Zoom: Video,
  'Google Meet': Monitor,
  'In-Person': MapPin,
}

const emptyForm = {
  title: '',
  description: '',
  type: 'Zoom',
  link: '',
  meetingId: '',
  password: '',
  date: '',
  time: '',
  duration: '',
  participants: [] as string[],
}

const participantInput = [
  { value: 'Parents', label: 'Parents' },
  { value: 'Teachers', label: 'Teachers' },
  { value: 'Staff', label: 'Staff' },
  { value: 'Students', label: 'Students' },
  { value: 'All', label: 'All' },
]

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (search) params.set('search', search)
      const res = await fetch(`/api/meetings?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch meetings')
      const json = await res.json()
      setMeetings(json.data ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load meetings')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search])

  useEffect(() => { fetchMeetings() }, [fetchMeetings])

  const now = new Date()
  const totalCount = meetings.length
  const upcomingCount = meetings.filter(m => m.status === 'Scheduled' && new Date(m.date) >= now).length
  const completedCount = meetings.filter(m => m.status === 'Completed').length
  const cancelledCount = meetings.filter(m => m.status === 'Cancelled').length

  const upcomingMeetings = meetings
    .filter(m => m.status === 'Scheduled' && new Date(m.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  function toggleParticipant(value: string) {
    setForm(prev => ({
      ...prev,
      participants: prev.participants.includes(value)
        ? prev.participants.filter(p => p !== value)
        : [...prev.participants, value],
    }))
  }

  async function handleCreate() {
    if (!form.title || !form.date) {
      toast.error('Title and date are required')
      return
    }
    try {
      setSaving(true)
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to create meeting')
      toast.success('Meeting created successfully')
      setShowModal(false)
      setForm(emptyForm)
      fetchMeetings()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create meeting')
    } finally {
      setSaving(false)
    }
  }

  function confirmDelete(id: string) {
    setDeleteId(id)
    setDeleteModal(true)
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/meetings?id=${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete meeting')
      toast.success('Meeting deleted successfully')
      setDeleteModal(false)
      setDeleteId(null)
      fetchMeetings()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete meeting')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meetings</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage Zoom, Google Meet, and in-person meetings</p>
        </div>
        <Button variant="primary" onClick={() => { setForm(emptyForm); setShowModal(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Create Meeting
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Meetings', value: totalCount, icon: Video, color: 'text-primary' },
          { label: 'Upcoming', value: upcomingCount, icon: Calendar, color: 'text-info' },
          { label: 'Completed', value: completedCount, icon: Clock, color: 'text-accent' },
          { label: 'Cancelled', value: cancelledCount, icon: Trash2, color: 'text-danger' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card variant="compact">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle>Meeting List</CardTitle>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search meetings..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-48"
                    />
                    <Select
                      options={statusOptions}
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <Loading text="Loading meetings..." />
                ) : meetings.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12">
                    <Video className="h-12 w-12 text-muted-foreground" />
                    <p className="text-lg font-medium text-foreground">No meetings found</p>
                    <p className="text-sm text-muted-foreground">Create your first meeting to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {meetings.map((meeting) => {
                        const Icon = typeIcon[meeting.type] || Video
                        return (
                          <motion.div
                            key={meeting.id}
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="flex items-start gap-3 rounded-lg border border-border p-4 hover:shadow-sm transition-shadow"
                          >
                            <div className="p-2.5 rounded-lg bg-muted shrink-0">
                              <Icon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="text-sm font-semibold text-foreground">{meeting.title}</h3>
                                <Badge variant={statusBadge[meeting.status] || 'default'}>{meeting.status}</Badge>
                                <Badge variant="outline">{meeting.type}</Badge>
                              </div>
                              {meeting.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{meeting.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(meeting.date).toLocaleDateString()}
                                </span>
                                {meeting.time && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {meeting.time}
                                  </span>
                                )}
                                {meeting.duration && (
                                  <span>{meeting.duration}</span>
                                )}
                                {meeting.participants && meeting.participants.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {meeting.participants.join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {meeting.link && meeting.status === 'Scheduled' && (
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => window.open(meeting.link, '_blank')}
                                >
                                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Join
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => confirmDelete(meeting.id)} title="Delete">
                                <Trash2 className="h-4 w-4 text-danger" />
                              </Button>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Meetings</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingMeetings.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No upcoming meetings</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingMeetings.slice(0, 5).map((meeting) => {
                      const Icon = typeIcon[meeting.type] || Video
                      return (
                        <div key={meeting.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                          <div className="p-2 rounded-lg bg-muted shrink-0">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{meeting.title}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{new Date(meeting.date).toLocaleDateString()}</span>
                              {meeting.time && <span>{meeting.time}</span>}
                            </div>
                            {meeting.link && (
                              <button
                                onClick={() => window.open(meeting.link, '_blank')}
                                className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" /> Join Meeting
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Meeting" size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Title"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Meeting title"
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Description"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Meeting description"
              />
            </div>
            <Select
              label="Meeting Type"
              options={typeOptions}
              value={form.type}
              onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
            />
            {form.type !== 'In-Person' && (
              <Input
                label="Meeting Link"
                value={form.link}
                onChange={(e) => setForm(prev => ({ ...prev, link: e.target.value }))}
                placeholder="https://..."
              />
            )}
            {form.type === 'Zoom' && (
              <>
                <Input
                  label="Meeting ID"
                  value={form.meetingId}
                  onChange={(e) => setForm(prev => ({ ...prev, meetingId: e.target.value }))}
                  placeholder="e.g. 123 456 7890"
                />
                <Input
                  label="Password"
                  value={form.password}
                  onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Meeting password"
                />
              </>
            )}
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
            />
            <Input
              label="Time"
              type="time"
              value={form.time}
              onChange={(e) => setForm(prev => ({ ...prev, time: e.target.value }))}
            />
            <Input
              label="Duration"
              value={form.duration}
              onChange={(e) => setForm(prev => ({ ...prev, duration: e.target.value }))}
              placeholder="e.g. 1 hour"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Participants</label>
            <div className="flex gap-2 flex-wrap">
              {participantInput.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => toggleParticipant(p.value)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all border ${
                    form.participants.includes(p.value)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating...' : 'Create Meeting'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteModal} onClose={() => { setDeleteModal(false); setDeleteId(null) }} title="Confirm Delete" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this meeting? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setDeleteModal(false); setDeleteId(null) }}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
