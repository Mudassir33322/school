'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, CheckCircle2, XCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import Table from '@/components/ui/table'

interface AttendanceRecord {
  id: string
  date: string
  status: string
  remarks?: string
  studentId?: string
}

interface MonthSummary {
  total: number
  present: number
  absent: number
  late: number
  percentage: number
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const STATUS_COLORS: Record<string, string> = {
  Present: 'bg-green-500',
  Absent: 'bg-red-500',
  Late: 'bg-yellow-500',
}

export default function MyAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())

  useEffect(() => {
    fetchAttendance()
  }, [])

  async function fetchAttendance() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/attendance')
      if (!res.ok) throw new Error('Failed to fetch attendance')
      const json = await res.json()
      setRecords(json.data ?? [])
      toast.success('Attendance data loaded')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load attendance'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const monthRecords = useMemo(() => {
    return records.filter((r) => {
      const d = new Date(r.date)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
  }, [records, currentMonth, currentYear])

  const summary: MonthSummary = useMemo(() => {
    const total = monthRecords.length
    const present = monthRecords.filter((r) => r.status === 'Present').length
    const absent = monthRecords.filter((r) => r.status === 'Absent').length
    const late = monthRecords.filter((r) => r.status === 'Late').length
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0
    return { total, present, absent, late, percentage }
  }, [monthRecords])

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate()
  }, [currentMonth, currentYear])

  const firstDayOfMonth = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay()
  }, [currentMonth, currentYear])

  const calendarDays = useMemo(() => {
    const days: { date: number; status?: string }[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const record = monthRecords.find((r) => r.date === dateStr)
      days.push({ date: d, status: record?.status })
    }
    return days
  }, [daysInMonth, monthRecords, currentMonth, currentYear])

  const calendarGrid = useMemo(() => {
    const grid: ({ date: number; status?: string } | null)[][] = []
    let week: ({ date: number; status?: string } | null)[] = []
    for (let i = 0; i < firstDayOfMonth; i++) {
      week.push(null)
    }
    for (const day of calendarDays) {
      week.push(day)
      if (week.length === 7) {
        grid.push(week)
        week = []
      }
    }
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null)
      }
      grid.push(week)
    }
    return grid
  }, [calendarDays, firstDayOfMonth])

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (_v: unknown, row: AttendanceRecord) => new Date(row.date).toLocaleDateString(),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_v: unknown, row: AttendanceRecord) => (
        <Badge variant={row.status === 'Present' ? 'success' : row.status === 'Late' ? 'warning' : 'danger'}>
          {row.status}
        </Badge>
      ),
    },
    { key: 'remarks', label: 'Remarks', render: (_v: unknown, row: AttendanceRecord) => row.remarks || '-' },
  ]

  if (loading) return <Loading text="Loading attendance data..." />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{error}</p>
        <Button variant="primary" onClick={fetchAttendance}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Attendance</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Track your daily attendance</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card variant="stat">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Days</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{summary.total}</p>
          </div>
        </Card>
        <Card variant="stat">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Present</p>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{summary.present}</p>
          </div>
        </Card>
        <Card variant="stat">
          <div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Absent</p>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{summary.absent}</p>
          </div>
        </Card>
        <Card variant="stat">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Late</p>
            </div>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{summary.late}</p>
          </div>
        </Card>
        <Card variant="stat">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Percentage</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{summary.percentage}%</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={prevMonth} aria-label="Previous month">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {MONTHS[currentMonth]} {currentYear}
            </h3>
            <Button variant="ghost" onClick={nextMonth} aria-label="Next month">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAY_NAMES.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>
            {calendarGrid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium ${
                      day
                        ? day.status
                          ? `${STATUS_COLORS[day.status]} text-white`
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        : ''
                    }`}
                  >
                    {day?.date ?? ''}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Attendance History</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchAttendance}>
              <CalendarDays className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table columns={columns} data={records} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Attendance Rate</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{summary.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  summary.percentage >= 75 ? 'bg-green-500' : summary.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${summary.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
