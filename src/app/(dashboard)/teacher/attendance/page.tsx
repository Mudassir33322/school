'use client'

import { useState, useEffect } from 'react'
import {
  CheckCheck,
  X,
  Clock,
  Save,
  Users,
  CalendarDays,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import Select from '@/components/ui/select'
import Input from '@/components/ui/input'

interface StudentRecord {
  id: string
  rollNo: string
  firstName: string
  lastName: string
  status: 'Present' | 'Absent' | 'Late'
}

interface AttendanceSummary {
  present: number
  absent: number
  late: number
  total: number
}

const classOptions = [
  { value: '1', label: 'Class 1' },
  { value: '2', label: 'Class 2' },
  { value: '3', label: 'Class 3' },
  { value: '4', label: 'Class 4' },
  { value: '5', label: 'Class 5' },
  { value: '6', label: 'Class 6' },
  { value: '7', label: 'Class 7' },
  { value: '8', label: 'Class 8' },
  { value: '9', label: 'Class 9' },
  { value: '10', label: 'Class 10' },
  { value: '11', label: 'Class 11' },
  { value: '12', label: 'Class 12' },
]

const sectionOptions = [
  { value: 'A', label: 'Section A' },
  { value: 'B', label: 'Section B' },
  { value: 'C', label: 'Section C' },
]

export default function TeacherAttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [summary, setSummary] = useState<AttendanceSummary>({ present: 0, absent: 0, late: 0, total: 0 })
  const [showSuccess, setShowSuccess] = useState(false)

  async function fetchStudents() {
    if (!classId || !sectionId) {
      toast.error('Please select class and section')
      return
    }
    try {
      setLoading(true)
      setShowSuccess(false)
      const res = await fetch(
        `/api/attendance?type=students&classId=${classId}&sectionId=${sectionId}&date=${date}`
      )
      if (!res.ok) throw new Error('Failed to fetch students')
      const json = await res.json()
      const data = (json.data ?? []) as {
        id: string
        rollNo?: string
        firstName: string
        lastName?: string
        status?: string
      }[]
      const mapped: StudentRecord[] = data.map((s) => ({
        id: s.id,
        rollNo: s.rollNo || '-',
        firstName: s.firstName,
        lastName: s.lastName || '',
        status: (s.status as 'Present' | 'Absent' | 'Late') || 'Present',
      }))
      setStudents(mapped)
      computeSummary(mapped)
      toast.success('Students loaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load students')
    } finally {
      setLoading(false)
    }
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

  function bulkMarkAll(status: 'Present' | 'Absent' | 'Late') {
    const updated = students.map((s) => ({ ...s, status }))
    setStudents(updated)
    computeSummary(updated)
  }

  async function handleSubmitAttendance() {
    if (students.length === 0) {
      toast.error('No students to save')
      return
    }
    try {
      setSaving(true)
      const records = students.map((s) => ({
        studentId: s.id,
        classId,
        sectionId,
        date,
        status: s.status,
      }))
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      })
      if (!res.ok) throw new Error('Failed to save attendance')
      toast.success('Attendance saved successfully')
      setShowSuccess(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  const summaryCards = [
    {
      label: 'Present',
      value: summary.present,
      percent: summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-500/10 dark:bg-green-500/20',
      icon: CheckCheck,
    },
    {
      label: 'Absent',
      value: summary.absent,
      percent: summary.total > 0 ? Math.round((summary.absent / summary.total) * 100) : 0,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500/10 dark:bg-red-500/20',
      icon: X,
    },
    {
      label: 'Late',
      value: summary.late,
      percent: summary.total > 0 ? Math.round((summary.late / summary.total) * 100) : 0,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
      icon: Clock,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mark Attendance</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Record student attendance for your classes</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <Input
              type="date"
              label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Select
              label="Class"
              value={classId}
              onChange={(e) => { setClassId(e.target.value); setShowSuccess(false) }}
              options={classOptions}
            />
            <Select
              label="Section"
              value={sectionId}
              onChange={(e) => { setSectionId(e.target.value); setShowSuccess(false) }}
              options={sectionOptions}
              disabled={!classId}
            />
            <Button variant="primary" onClick={fetchStudents} disabled={!classId || !sectionId}>
              <Users className="h-4 w-4 mr-2" />
              Load Students
            </Button>
          </div>
        </CardContent>
      </Card>

      {showSuccess && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
              <CheckCheck className="h-5 w-5" />
              <p className="font-medium">Attendance recorded for {new Date(date).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {students.length > 0 && !showSuccess && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {summaryCards.map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.label} variant="stat">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-lg ${card.bg}`}>
                      <Icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <Badge variant={card.label === 'Present' ? 'success' : card.label === 'Absent' ? 'danger' : 'warning'}>
                      {card.percent}%
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                    <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                  </div>
                </Card>
              )
            })}
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>Student List</CardTitle>
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
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loading text="Loading students..." />
              ) : (
                <div className="space-y-2">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-xs text-gray-500">Roll: {student.rollNo}</p>
                      </div>
                      <div className="flex gap-1.5">
                        {(['Present', 'Absent', 'Late'] as const).map((status) => {
                          const Icon = status === 'Present' ? CheckCheck : status === 'Absent' ? X : Clock
                          const isActive = student.status === status
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => updateStudentStatus(student.id, status)}
                              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                isActive
                                  ? status === 'Present'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-2 ring-green-500'
                                    : status === 'Absent'
                                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-2 ring-red-500'
                                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 ring-2 ring-yellow-500'
                                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                              }`}
                            >
                              <Icon className="h-3 w-3" />
                              {status}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="text-green-600 dark:text-green-400">P: {summary.present}</span>
              <span className="text-red-600 dark:text-red-400">A: {summary.absent}</span>
              <span className="text-yellow-600 dark:text-yellow-400">L: {summary.late}</span>
            </div>
            <Button variant="primary" onClick={handleSubmitAttendance} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Submit Attendance'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
