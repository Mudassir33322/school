'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCheck,
  X,
  Clock,
  Filter,
  Users,
  CalendarDays,
  RefreshCw,
  Search,
  FileText,
  Download,
  CheckSquare,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import Modal from '@/components/ui/modal'
import Select from '@/components/ui/select'
import Input from '@/components/ui/input'
import { downloadCSV } from '@/lib/utils'

interface StudentRecord {
  id: string
  rollNo: string
  firstName: string
  lastName: string
  admissionNo: string
  status: 'Present' | 'Absent' | 'Late'
  remarks: string
}

interface ClassOption { value: string; label: string }
interface SectionOption { value: string; label: string }
interface AttendanceSummary { present: number; absent: number; late: number; total: number }

const statusColors: Record<string, 'success' | 'danger' | 'warning'> = {
  Present: 'success', Absent: 'danger', Late: 'warning',
}

const statusIcons: Record<string, typeof CheckCheck> = {
  Present: CheckCheck, Absent: X, Late: Clock,
}

export default function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [sections, setSections] = useState<SectionOption[]>([])
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showMarkModal, setShowMarkModal] = useState(false)
  const [filterTab, setFilterTab] = useState<'All' | 'Present' | 'Absent' | 'Late'>('All')
  const [summary, setSummary] = useState<AttendanceSummary>({ present: 0, absent: 0, late: 0, total: 0 })
  const [search, setSearch] = useState('')
  const [fetchedOnce, setFetchedOnce] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())

  useEffect(() => { fetchClasses() }, [])
  useEffect(() => { if (classId) fetchSections() }, [classId])

  async function fetchClasses() {
    try {
      const res = await fetch('/api/attendance?type=classes')
      if (!res.ok) throw new Error('Failed to fetch classes')
      const json = await res.json()
      if (json.data) {
        setClasses((json.data as { id: string; name: string }[]).map((c) => ({ value: c.id, label: c.name })))
      }
    } catch {
      setClasses(Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: `Class ${i + 1}` })))
    }
  }

  async function fetchSections() {
    try {
      const res = await fetch(`/api/attendance?type=sections&classId=${classId}`)
      if (!res.ok) throw new Error('Failed to fetch sections')
      const json = await res.json()
      if (json.data) {
        setSections((json.data as { id: string; name: string }[]).map((s) => ({ value: s.id, label: s.name })))
        return
      }
    } catch { /* fallback */ }
    setSections([{ value: 'A', label: 'Section A' }, { value: 'B', label: 'Section B' }])
  }

  async function fetchStudents() {
    if (!classId || !sectionId) { toast.error('Please select class and section'); return }
    try {
      setLoading(true)
      const res = await fetch(`/api/attendance?type=students&classId=${classId}&sectionId=${sectionId}`)
      if (!res.ok) throw new Error('Failed to fetch students')
      const json = await res.json()
      const data = (json.data ?? []) as { id: string; rollNo?: string; firstName: string; lastName?: string; admissionNo?: string }[]
      const mapped: StudentRecord[] = data.map((s) => ({
        id: s.id, rollNo: s.rollNo || '-', firstName: s.firstName, lastName: s.lastName || '',
        admissionNo: s.admissionNo || '', status: 'Present' as const, remarks: '',
      }))
      setStudents(mapped)
      setFetchedOnce(true)
      computeSummary(mapped)
      setSelectedStudents(new Set(mapped.map(s => s.id)))
      toast.success('Students loaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load students')
    } finally { setLoading(false) }
  }

  function computeSummary(records: StudentRecord[]) {
    const present = records.filter((s) => s.status === 'Present').length
    const absent = records.filter((s) => s.status === 'Absent').length
    const late = records.filter((s) => s.status === 'Late').length
    setSummary({ present, absent, late, total: records.length })
  }

  function updateStudentStatus(id: string, status: 'Present' | 'Absent' | 'Late') {
    const updated = students.map((s) => (s.id === id ? { ...s, status } : s))
    setStudents(updated)
    computeSummary(updated)
  }

  function updateStudentRemarks(id: string, remarks: string) {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, remarks } : s)))
  }

  function bulkMarkAll(status: 'Present' | 'Absent' | 'Late') {
    const updated = students.map((s) => {
      if (selectedStudents.size === 0 || selectedStudents.has(s.id)) {
        return { ...s, status }
      }
      return s
    })
    setStudents(updated)
    computeSummary(updated)
    toast.success(`${selectedStudents.size || students.length} students marked as ${status}`)
  }

  function toggleSelectAll() {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)))
    }
  }

  function toggleStudentSelect(id: string) {
    setSelectedStudents(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSaveAttendance() {
    if (students.length === 0) { toast.error('No students to save'); return }
    try {
      setSaving(true)
      const records = students
        .filter(s => selectedStudents.has(s.id))
        .map((s) => ({
          studentId: s.id, classId, sectionId, date, status: s.status, remarks: s.remarks,
        }))
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      })
      if (!res.ok) throw new Error('Failed to save attendance')
      toast.success('Attendance saved successfully')
      setShowMarkModal(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save attendance')
    } finally { setSaving(false) }
  }

  function handleExport() {
    const data = students.map((s) => ({
      'Roll No': s.rollNo,
      Name: `${s.firstName} ${s.lastName}`,
      Status: s.status,
      Remarks: s.remarks,
    }))
    downloadCSV(data, `attendance-${date}`)
    toast.success('Attendance exported')
  }

  const filteredStudents = students.filter((s) => {
    const matchFilter = filterTab === 'All' || s.status === filterTab
    const matchSearch = !search ||
      s.firstName.toLowerCase().includes(search.toLowerCase()) ||
      s.lastName.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const summaryCards = [
    { label: 'Present', value: summary.present, percent: summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10 dark:bg-green-500/20', icon: CheckCheck },
    { label: 'Absent', value: summary.absent, percent: summary.total > 0 ? Math.round((summary.absent / summary.total) * 100) : 0, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 dark:bg-red-500/20', icon: X },
    { label: 'Late', value: summary.late, percent: summary.total > 0 ? Math.round((summary.late / summary.total) * 100) : 0, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10 dark:bg-yellow-500/20', icon: Clock },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance Management</h1>
          <p className="text-muted-foreground mt-1">Mark and manage student attendance</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button variant="primary" onClick={() => { fetchStudents(); setShowMarkModal(true) }} disabled={!classId || !sectionId}>
            <FileText className="h-4 w-4 mr-2" /> Mark Attendance
          </Button>
          <Button variant="outline" onClick={fetchStudents} disabled={!classId || !sectionId}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input type="date" label="Date" value={date} onChange={(e) => setDate(e.target.value)} />
              <Select label="Class" value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId('') }} options={classes} />
              <Select label="Section" value={sectionId} onChange={(e) => setSectionId(e.target.value)} options={sections} disabled={!classId} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {fetchedOnce && (
        <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show">
          {summaryCards.map((card) => {
            const Icon = card.icon
            return (
              <motion.div key={card.label} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                <Card variant="stat">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-lg ${card.bg}`}>
                      <Icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <Badge variant={card.label === 'Present' ? 'success' : card.label === 'Absent' ? 'danger' : 'warning'}>
                      {card.percent}%
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {fetchedOnce && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>Today&apos;s Attendance</CardTitle>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search student..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 w-48 rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {(['All', 'Present', 'Absent', 'Late'] as const).map((tab) => (
                  <button key={tab} type="button" onClick={() => setFilterTab(tab)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      filterTab === tab ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}>
                    {tab}
                    {tab !== 'All' && (
                      <span className="ml-1.5 opacity-80">
                        ({tab === 'Present' ? summary.present : tab === 'Absent' ? summary.absent : summary.late})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs font-semibold uppercase">
                          <CheckSquare className={`h-4 w-4 ${selectedStudents.size === students.length && students.length > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">Roll No</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">Student Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    <AnimatePresence>
                      {filteredStudents.map((student) => (
                        <motion.tr
                          key={student.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <button onClick={() => toggleStudentSelect(student.id)}>
                              <CheckSquare className={`h-4 w-4 ${selectedStudents.has(student.id) ? 'text-primary' : 'text-muted-foreground'}`} />
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm">{student.rollNo}</td>
                          <td className="px-4 py-3 text-sm font-medium">{student.firstName} {student.lastName}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              {(['Present', 'Absent', 'Late'] as const).map((status) => {
                                const Icon = statusIcons[status]
                                return (
                                  <button key={status} type="button" onClick={() => updateStudentStatus(student.id, status)}
                                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                                      student.status === status
                                        ? status === 'Present' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-2 ring-green-500'
                                          : status === 'Absent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-2 ring-red-500'
                                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 ring-2 ring-yellow-500'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}>
                                    <Icon className="h-3 w-3" /> {status}
                                  </button>
                                )
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input type="text" value={student.remarks} onChange={(e) => updateStudentRemarks(student.id, e.target.value)}
                              placeholder="Remarks"
                              className="w-32 rounded border border-border bg-transparent px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Modal isOpen={showMarkModal} onClose={() => setShowMarkModal(false)} title="Mark Attendance" size="lg">
        {loading ? (
          <Loading text="Loading students..." />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedStudents.size} of {summary.total} students selected
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => bulkMarkAll('Present')}>
                  <CheckCheck className="h-3 w-3 mr-1" /> All Present
                </Button>
                <Button size="sm" variant="outline" onClick={() => bulkMarkAll('Absent')}>
                  <X className="h-3 w-3 mr-1" /> All Absent
                </Button>
                <Button size="sm" variant="outline" onClick={() => bulkMarkAll('Late')}>
                  <Clock className="h-3 w-3 mr-1" /> All Late
                </Button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {students.map((student) => (
                <div key={student.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button onClick={() => toggleStudentSelect(student.id)}>
                      <CheckSquare className={`h-4 w-4 ${selectedStudents.has(student.id) ? 'text-primary' : 'text-muted-foreground'}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{student.firstName} {student.lastName}</p>
                      <p className="text-xs text-muted-foreground">Roll: {student.rollNo}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {(['Present', 'Absent', 'Late'] as const).map((status) => {
                      const Icon = statusIcons[status]
                      return (
                        <button key={status} type="button" onClick={() => updateStudentStatus(student.id, status)}
                          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                            student.status === status
                              ? status === 'Present' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-2 ring-green-500'
                                : status === 'Absent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-2 ring-red-500'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 ring-2 ring-yellow-500'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}>
                          <Icon className="h-3 w-3" /> {status}
                        </button>
                      )
                    })}
                  </div>
                  <input type="text" value={student.remarks} onChange={(e) => updateStudentRemarks(student.id, e.target.value)}
                    placeholder="Remarks" className="w-full sm:w-32 text-xs rounded border border-border bg-transparent px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="text-green-600 dark:text-green-400">P: {summary.present}</span>
                <span className="text-red-600 dark:text-red-400">A: {summary.absent}</span>
                <span className="text-yellow-600 dark:text-yellow-400">L: {summary.late}</span>
              </div>
              <Button variant="primary" onClick={handleSaveAttendance} disabled={saving}>
                {saving ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
