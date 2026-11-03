'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Printer,
  Clock,
  BookOpen,
  User,
  MapPin,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Modal from '@/components/ui/modal'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import { showToast } from '@/components/ui/toast'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'

const days: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const periods = [1, 2, 3, 4, 5, 6, 7, 8]

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300',
  Science: 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300',
  English: 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300',
  Hindi: 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300',
  'Social Studies': 'bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900/30 dark:border-pink-700 dark:text-pink-300',
  'Computer Science': 'bg-cyan-100 border-cyan-300 text-cyan-800 dark:bg-cyan-900/30 dark:border-cyan-700 dark:text-cyan-300',
  Art: 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300',
  PE: 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300',
  Music: 'bg-teal-100 border-teal-300 text-teal-800 dark:bg-teal-900/30 dark:border-teal-700 dark:text-teal-300',
}

const DEFAULT_COLOR = 'bg-muted border-border text-foreground'

interface TimetableEntry {
  id: string
  classId: string
  sectionId: string
  day: Day
  period: number
  subject: string
  teacher: string
  room: string
  startTime: string
  endTime: string
}

interface EntryFormData {
  classId: string
  sectionId: string
  day: Day | ''
  period: string
  subject: string
  teacher: string
  room: string
  startTime: string
  endTime: string
}

const classOptions = Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: `Class ${i + 1}` }))
const sectionOptions = [
  { value: 'A', label: 'Section A' },
  { value: 'B', label: 'Section B' },
  { value: 'C', label: 'Section C' },
]
const dayOptions = days.map((d) => ({ value: d, label: d }))
const periodOptions = Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Period ${i + 1}` }))

const emptyForm: EntryFormData = {
  classId: '',
  sectionId: '',
  day: '',
  period: '',
  subject: '',
  teacher: '',
  room: '',
  startTime: '',
  endTime: '',
}

export default function TimetablePage() {
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedClass, setSelectedClass] = useState('1')
  const [selectedSection, setSelectedSection] = useState('A')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null)
  const [form, setForm] = useState<EntryFormData>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchTimetable = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/timetable?classId=${selectedClass}&sectionId=${selectedSection}`)
      const json = await res.json()
      const data = Array.isArray(json) ? json : json.data ?? json.timetable ?? []
      setEntries(data)
    } catch {
      showToast('Failed to load timetable', 'error')
    } finally {
      setLoading(false)
    }
  }, [selectedClass, selectedSection])

  useEffect(() => {
    fetchTimetable()
  }, [fetchTimetable])

  const getEntry = (day: Day, period: number) =>
    entries.find((e) => e.day === day && e.period === period)

  const getSubjectColor = (subject: string) => {
    return SUBJECT_COLORS[subject] || DEFAULT_COLOR
  }

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.day) errs.day = 'Day is required'
    if (!form.period) errs.period = 'Period is required'
    if (!form.subject.trim()) errs.subject = 'Subject is required'
    if (!form.teacher.trim()) errs.teacher = 'Teacher is required'
    if (!form.room.trim()) errs.room = 'Room is required'
    if (!form.startTime.trim()) errs.startTime = 'Start time is required'
    if (!form.endTime.trim()) errs.endTime = 'End time is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const openAddModal = (day?: Day, period?: number) => {
    setEditingEntry(null)
    setForm({
      ...emptyForm,
      classId: selectedClass,
      sectionId: selectedSection,
      day: day || '',
      period: period ? String(period) : '',
    })
    setErrors({})
    setModalOpen(true)
  }

  const openEditModal = (entry: TimetableEntry) => {
    setEditingEntry(entry)
    setForm({
      classId: entry.classId,
      sectionId: entry.sectionId,
      day: entry.day,
      period: String(entry.period),
      subject: entry.subject,
      teacher: entry.teacher,
      room: entry.room,
      startTime: entry.startTime,
      endTime: entry.endTime,
    })
    setErrors({})
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!validateForm()) return
    setSaving(true)
    try {
      const method = editingEntry ? 'PUT' : 'POST'
      const url = editingEntry ? `/api/timetable/${editingEntry.id}` : '/api/timetable'
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: form.classId || selectedClass,
          sectionId: form.sectionId || selectedSection,
          day: form.day,
          period: Number(form.period),
          subject: form.subject,
          teacher: form.teacher,
          room: form.room,
          startTime: form.startTime,
          endTime: form.endTime,
        }),
      })
      showToast(editingEntry ? 'Entry updated' : 'Entry created', 'success')
      setModalOpen(false)
      fetchTimetable()
    } catch {
      showToast('Failed to save entry', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (entry: TimetableEntry) => {
    try {
      await fetch(`/api/timetable/${entry.id}`, { method: 'DELETE' })
      showToast('Entry deleted', 'success')
      fetchTimetable()
    } catch {
      showToast('Failed to delete entry', 'error')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) return <Loading text="Loading timetable..." />

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Timetable Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage weekly class timetables</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => openAddModal()}>
            <Plus className="mr-2 h-4 w-4" /> Add Entry
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show">
        <motion.div variants={item}>
          <Card>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Class"
                  options={classOptions}
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                />
                <Select
                  label="Section"
                  options={sectionOptions}
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="mt-6">
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-20">Period</th>
                  {days.map((day) => (
                    <th key={day} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {periods.map((periodNo) => (
                  <tr key={periodNo} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-foreground text-center">
                      P{periodNo}
                    </td>
                    {days.map((day) => {
                      const entry = getEntry(day, periodNo)
                      return (
                        <td
                          key={`${day}-${periodNo}`}
                          className="cursor-pointer border border-border/50 px-2 py-2 text-center transition-colors hover:bg-muted/50"
                          onClick={() => (entry ? openEditModal(entry) : openAddModal(day, periodNo))}
                        >
                          {entry ? (
                            <div className={`rounded-lg border p-2 ${getSubjectColor(entry.subject)} transition-all hover:shadow-sm`}>
                              <p className="text-sm font-semibold">{entry.subject}</p>
                              <div className="flex items-center justify-center gap-1 text-xs opacity-75 mt-1">
                                <User className="h-3 w-3" />
                                <span>{entry.teacher}</span>
                              </div>
                              <div className="flex items-center justify-center gap-1 text-xs opacity-75">
                                <MapPin className="h-3 w-3" />
                                <span>{entry.room}</span>
                              </div>
                              <div className="flex items-center justify-center gap-1 text-xs opacity-60 mt-1">
                                <Clock className="h-3 w-3" />
                                <span>{entry.startTime} - {entry.endTime}</span>
                              </div>
                              <div className="flex items-center justify-center gap-1 mt-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => { e.stopPropagation(); openEditModal(entry) }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                  onClick={(e) => { e.stopPropagation(); handleDelete(entry) }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/50 hover:text-muted-foreground">
                              + Add
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div variants={item} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Subject Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SUBJECT_COLORS).map(([subject, colorClass]) => (
                  <span key={subject} className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${colorClass}`}>
                    {subject}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEntry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Class"
              options={classOptions}
              value={form.classId}
              onChange={(e) => setForm((prev) => ({ ...prev, classId: e.target.value }))}
            />
            <Select
              label="Section"
              options={sectionOptions}
              value={form.sectionId}
              onChange={(e) => setForm((prev) => ({ ...prev, sectionId: e.target.value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Day"
              options={dayOptions}
              value={form.day}
              onChange={(e) => setForm((prev) => ({ ...prev, day: e.target.value as Day }))}
              error={errors.day}
            />
            <Select
              label="Period"
              options={periodOptions}
              value={form.period}
              onChange={(e) => setForm((prev) => ({ ...prev, period: e.target.value }))}
              error={errors.period}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Subject"
              placeholder="e.g., Mathematics"
              value={form.subject}
              onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
              error={errors.subject}
            />
            <Input
              label="Teacher"
              placeholder="e.g., Mr. Gupta"
              value={form.teacher}
              onChange={(e) => setForm((prev) => ({ ...prev, teacher: e.target.value }))}
              error={errors.teacher}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Room"
              placeholder="e.g., 101"
              value={form.room}
              onChange={(e) => setForm((prev) => ({ ...prev, room: e.target.value }))}
              error={errors.room}
            />
            <Input
              label="Start Time"
              type="time"
              value={form.startTime}
              onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
              error={errors.startTime}
            />
            <Input
              label="End Time"
              type="time"
              value={form.endTime}
              onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
              error={errors.endTime}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingEntry ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
