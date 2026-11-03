'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Calendar, MapPin, Clock, Users, Trash2, Pencil,
  CalendarDays, List, Filter,
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

interface Event {
  id: string
  title: string
  description: string
  eventType: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  location: string
  targetAudience: string[]
  color: string
  createdAt: string
}

const eventTypes = ['Event', 'Holiday', 'Meeting', 'Exam'] as const

const typeBadge: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
  Event: 'info', Holiday: 'success', Meeting: 'warning', Exam: 'danger',
}

const audienceOptions = [
  { value: 'Students', label: 'Students' },
  { value: 'Teachers', label: 'Teachers' },
  { value: 'Staff', label: 'Staff' },
  { value: 'Parents', label: 'Parents' },
  { value: 'All', label: 'All' },
]

const colorOptions = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#f97316', label: 'Orange' },
]

const emptyForm = {
  title: '', description: '', eventType: 'Event' as string,
  startDate: '', endDate: '', startTime: '', endTime: '',
  location: '', targetAudience: [] as string[], color: '#3b82f6',
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (typeFilter) params.set('eventType', typeFilter)
      if (search) params.set('search', search)
      const res = await fetch(`/api/events?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch events')
      const json = await res.json()
      setEvents(json.data ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [typeFilter, search])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  function openCreateModal() {
    setEditingEvent(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEditModal(event: Event) {
    setEditingEvent(event)
    setForm({
      title: event.title,
      description: event.description || '',
      eventType: event.eventType,
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      location: event.location || '',
      targetAudience: event.targetAudience || [],
      color: event.color || '#3b82f6',
    })
    setShowModal(true)
  }

  function toggleAudience(value: string) {
    setForm(prev => ({
      ...prev,
      targetAudience: prev.targetAudience.includes(value)
        ? prev.targetAudience.filter(a => a !== value)
        : [...prev.targetAudience, value],
    }))
  }

  async function handleSave() {
    if (!form.title || !form.startDate) {
      toast.error('Title and start date are required')
      return
    }
    try {
      setSaving(true)
      const url = editingEvent ? `/api/events` : '/api/events'
      const method = editingEvent ? 'PUT' : 'POST'
      const body = editingEvent ? { id: editingEvent.id, ...form } : form

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to save event')
      toast.success(editingEvent ? 'Event updated successfully' : 'Event created successfully')
      setShowModal(false)
      fetchEvents()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save event')
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
      const res = await fetch(`/api/events?id=${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete event')
      toast.success('Event deleted successfully')
      setDeleteModal(false)
      setDeleteId(null)
      fetchEvents()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete event')
    } finally {
      setDeleting(false)
    }
  }

  const groupedEvents = events.reduce<Record<string, Event[]>>((acc, event) => {
    const date = event.startDate
    if (!acc[date]) acc[date] = []
    acc[date].push(event)
    return acc
  }, {})

  const sortedDates = Object.keys(groupedEvents).sort()

  const now = new Date()
  const upcomingEvents = events
    .filter(e => new Date(e.startDate) >= now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Event & Calendar Management</h1>
          <p className="text-muted-foreground mt-1">Manage school events, holidays, meetings and exams</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" /> Add Event
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle>Events</CardTitle>
                  <div className="flex items-center gap-2">
                    <Input placeholder="Search events..." value={search}
                      onChange={(e) => setSearch(e.target.value)} icon={<Filter className="h-4 w-4" />}
                      className="w-40" />
                    <div className="flex rounded-lg border border-border overflow-hidden">
                      <button onClick={() => setViewMode('calendar')}
                        className={`p-2 ${viewMode === 'calendar' ? 'bg-primary text-white' : 'bg-card text-muted-foreground hover:bg-muted'}`}>
                        <CalendarDays className="h-4 w-4" />
                      </button>
                      <button onClick={() => setViewMode('list')}
                        className={`p-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-card text-muted-foreground hover:bg-muted'}`}>
                        <List className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <button onClick={() => setTypeFilter('')}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${typeFilter === '' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                    All
                  </button>
                  {eventTypes.map(type => (
                    <button key={type} onClick={() => setTypeFilter(type)}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${typeFilter === type ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                      {type}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <Loading text="Loading events..." />
                ) : events.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground" />
                    <p className="text-lg font-medium text-foreground">No events found</p>
                    <p className="text-sm text-muted-foreground">Create your first event to get started</p>
                  </div>
                ) : viewMode === 'calendar' ? (
                  <div className="space-y-6">
                    {sortedDates.map(date => (
                      <div key={date}>
                        <div className="flex items-center gap-2 mb-3">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <h3 className="text-sm font-semibold text-foreground">{formatDate(date)}</h3>
                          <span className="text-xs text-muted-foreground">({groupedEvents[date].length})</span>
                        </div>
                        <div className="space-y-2">
                          <AnimatePresence>
                            {groupedEvents[date].map(event => (
                              <motion.div key={event.id} layout initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-3 rounded-lg border border-border p-3 hover:shadow-sm transition-shadow"
                                style={{ borderLeftColor: event.color, borderLeftWidth: 4 }}>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant={typeBadge[event.eventType] || 'default'}>{event.eventType}</Badge>
                                    {event.startTime && (
                                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm font-medium text-foreground">{event.title}</p>
                                  {event.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{event.description}</p>
                                  )}
                                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                    {event.location && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> {event.location}
                                      </span>
                                    )}
                                    {event.targetAudience && event.targetAudience.length > 0 && (
                                      <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3" /> {event.targetAudience.join(', ')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button variant="ghost" size="sm" onClick={() => openEditModal(event)} title="Edit">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => confirmDelete(event.id)} title="Delete">
                                    <Trash2 className="h-4 w-4 text-danger" />
                                  </Button>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {events.map(event => (
                        <motion.div key={event.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          className="flex items-start gap-3 rounded-lg border border-border p-3 hover:shadow-sm transition-shadow"
                          style={{ borderLeftColor: event.color, borderLeftWidth: 4 }}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant={typeBadge[event.eventType] || 'default'}>{event.eventType}</Badge>
                              <span className="text-xs text-muted-foreground">{formatDate(event.startDate)}</span>
                              {event.startTime && (
                                <span className="text-xs text-muted-foreground">{event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}</span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-foreground">{event.title}</p>
                            {event.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{event.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                              {event.location && (
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>
                              )}
                              {event.targetAudience && event.targetAudience.length > 0 && (
                                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {event.targetAudience.join(', ')}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(event)} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => confirmDelete(event.id)} title="Delete">
                              <Trash2 className="h-4 w-4 text-danger" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
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
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No upcoming events</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map(event => (
                      <div key={event.id} className="flex items-start gap-3 rounded-lg border border-border p-3"
                        style={{ borderLeftColor: event.color, borderLeftWidth: 3 }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={typeBadge[event.eventType] || 'default'} size="sm">{event.eventType}</Badge>
                          </div>
                          <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(event.startDate)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editingEvent ? 'Edit Event' : 'Create Event'} size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="Title" value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Event title" />
            </div>
            <div className="sm:col-span-2">
              <Input label="Description" value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Event description" />
            </div>
            <Select label="Type" options={eventTypes.map(t => ({ value: t, label: t }))} value={form.eventType} onChange={(e) => setForm(prev => ({ ...prev, eventType: e.target.value }))} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Color</label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map(c => (
                  <button key={c.value} type="button" onClick={() => setForm(prev => ({ ...prev, color: c.value }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c.value ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c.value }} title={c.label} />
                ))}
              </div>
            </div>
            <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))} />
            <Input label="End Date" type="date" value={form.endDate} onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))} />
            <Input label="Start Time" type="time" value={form.startTime} onChange={(e) => setForm(prev => ({ ...prev, startTime: e.target.value }))} />
            <Input label="End Time" type="time" value={form.endTime} onChange={(e) => setForm(prev => ({ ...prev, endTime: e.target.value }))} />
            <div className="sm:col-span-2">
              <Input label="Location" value={form.location} onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))} placeholder="Event location" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Target Audience</label>
            <div className="flex gap-2 flex-wrap">
              {audienceOptions.map(a => (
                <button key={a.value} type="button" onClick={() => toggleAudience(a.value)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all border ${form.targetAudience.includes(a.value) ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border hover:bg-muted'}`}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteModal} onClose={() => { setDeleteModal(false); setDeleteId(null) }} title="Confirm Delete" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this event? This action cannot be undone.</p>
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
