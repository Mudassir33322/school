'use client'

import { useState, useEffect } from 'react'
import {
  CalendarDays,
  CheckCheck,
  X,
  Clock,
  Download,
  BarChart3,
  TrendingUp,
  AlertCircle,
  FileText,
  Printer,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import Select from '@/components/ui/select'
import Table from '@/components/ui/table'

interface StudentAttendanceRow {
  id: string
  rollNo: string
  studentName: string
  totalDays: number
  present: number
  absent: number
  late: number
  percentage: number
}

interface AttendanceSummary {
  totalDays: number
  present: number
  absent: number
  late: number
  percentage: number
}

const months = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 10 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}))

export default function AttendanceReportsPage() {
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [month, setMonth] = useState(String(new Date().getMonth() + 1))
  const [year, setYear] = useState(String(currentYear))
  const [studentId, setStudentId] = useState('')
  const [classes, setClasses] = useState<{ value: string; label: string }[]>([])
  const [sections, setSections] = useState<{ value: string; label: string }[]>([])
  const [students, setStudents] = useState<StudentAttendanceRow[]>([])
  const [summary, setSummary] = useState<AttendanceSummary>({
    totalDays: 0,
    present: 0,
    absent: 0,
    late: 0,
    percentage: 0,
  })
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    if (classId) fetchSections()
  }, [classId])

  async function fetchClasses() {
    try {
      const res = await fetch('/api/attendance?type=classes')
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      if (json.data) {
        setClasses((json.data as { id: string; name: string }[]).map((c) => ({ value: c.id, label: c.name })))
        return
      }
    } catch {
      // fallback
    }
    setClasses(Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: `Class ${i + 1}` })))
  }

  async function fetchSections() {
    try {
      const res = await fetch(`/api/attendance?type=sections&classId=${classId}`)
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      if (json.data) {
        setSections((json.data as { id: string; name: string }[]).map((s) => ({ value: s.id, label: s.name })))
        return
      }
    } catch {
      // fallback
    }
    setSections([
      { value: 'A', label: 'Section A' },
      { value: 'B', label: 'Section B' },
    ])
  }

  async function fetchReport() {
    if (!classId || !sectionId) {
      toast.error('Please select class and section')
      return
    }
    try {
      setLoading(true)
      const params = new URLSearchParams({
        type: 'report',
        classId,
        sectionId,
        month,
        year,
        ...(studentId && { studentId }),
      })
      const res = await fetch(`/api/attendance?${params}`)
      if (!res.ok) throw new Error('Failed to fetch report')
      const json = await res.json()
      const data = (json.data ?? []) as StudentAttendanceRow[]
      setStudents(data)
      setFetched(true)

      const totalDays = data.length > 0 ? data[0].totalDays : 0
      const present = data.reduce((sum, s) => sum + s.present, 0)
      const absent = data.reduce((sum, s) => sum + s.absent, 0)
      const late = data.reduce((sum, s) => sum + s.late, 0)
      const totalRecords = data.reduce((sum, s) => sum + s.totalDays, 0)
      const percentage = totalRecords > 0 ? Math.round((present / totalRecords) * 100) : 0

      setSummary({ totalDays, present, absent, late, percentage })
      toast.success('Report loaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { key: 'rollNo', label: 'Roll No' },
    { key: 'studentName', label: 'Student Name' },
    { key: 'totalDays', label: 'Total Days' },
    {
      key: 'present',
      label: 'Present',
      render: (_: unknown, row: StudentAttendanceRow) => (
        <span className="text-green-600 dark:text-green-400 font-medium">{row.present}</span>
      ),
    },
    {
      key: 'absent',
      label: 'Absent',
      render: (_: unknown, row: StudentAttendanceRow) => (
        <span className="text-red-600 dark:text-red-400 font-medium">{row.absent}</span>
      ),
    },
    {
      key: 'late',
      label: 'Late',
      render: (_: unknown, row: StudentAttendanceRow) => (
        <span className="text-yellow-600 dark:text-yellow-400 font-medium">{row.late}</span>
      ),
    },
    {
      key: 'percentage',
      label: 'Attendance %',
      render: (_: unknown, row: StudentAttendanceRow) => {
        const color =
          row.percentage >= 75
            ? 'text-green-600 dark:text-green-400'
            : row.percentage >= 50
              ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-red-600 dark:text-red-400'
        return (
          <span className={`font-semibold ${color}`}>
            {row.percentage}%
          </span>
        )
      },
    },
  ]

  const summaryCards = [
    {
      label: 'Total Days',
      value: summary.totalDays,
      icon: CalendarDays,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    },
    {
      label: 'Present',
      value: summary.present,
      icon: CheckCheck,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-500/10 dark:bg-green-500/20',
    },
    {
      label: 'Absent',
      value: summary.absent,
      icon: X,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500/10 dark:bg-red-500/20',
    },
    {
      label: 'Late',
      value: summary.late,
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
    },
    {
      label: 'Attendance %',
      value: `${summary.percentage}%`,
      icon: TrendingUp,
      color:
        summary.percentage >= 75
          ? 'text-green-600 dark:text-green-400'
          : summary.percentage >= 50
            ? 'text-yellow-600 dark:text-yellow-400'
            : 'text-red-600 dark:text-red-400',
      bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Attendance Reports</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">View and analyze attendance data</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              label="Class"
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value)
                setSectionId('')
              }}
              options={classes}
            />
            <Select
              label="Section"
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              options={sections}
              disabled={!classId}
            />
            <Select label="Month" value={month} onChange={(e) => setMonth(e.target.value)} options={months} />
            <Select label="Year" value={year} onChange={(e) => setYear(e.target.value)} options={years} />
          </div>
          <div className="mt-4">
            <Button variant="primary" onClick={fetchReport} disabled={!classId || !sectionId}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {fetched && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {summaryCards.map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.label} variant="stat">
                  <div className={`p-2.5 rounded-lg w-fit ${card.bg}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                    <p className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                  </div>
                </Card>
              )
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Student-wise Attendance</CardTitle>
              <CardDescription>
                Monthly attendance report for {months.find((m) => m.value === month)?.label} {year}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table columns={columns} data={students} loading={loading} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Chart</CardTitle>
              <CardDescription>Visual representation of attendance data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Chart area — coming soon</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Interactive charts will be displayed here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!fetched && !loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600" />
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400">Select filters and generate a report</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Choose class, section, month, and year</p>
        </div>
      )}

      {loading && <Loading text="Generating attendance report..." />}
    </div>
  )
}
