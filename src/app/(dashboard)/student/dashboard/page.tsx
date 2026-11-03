'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarCheck,
  BookOpen,
  DollarSign,
  AlertCircle,
  Clock,
  ArrowRight,
  Eye,
  FileText,
  Calendar,
  Trophy,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'

interface Result {
  id: string
  examName: string
  subject: string
  marks: number
  totalMarks: number
  percentage: number
  grade: string
  date: string
}

interface Homework {
  id: string
  title: string
  subject: string
  dueDate: string
  status: string
}

interface TimetableEntry {
  id: string
  subject: string
  teacher: string
  startTime: string
  endTime: string
  room: string
}

interface Exam {
  id: string
  name: string
  subject: string
  date: string
  type: string
}

export default function StudentDashboard() {
  const router = useRouter()
  const [attendancePercent, setAttendancePercent] = useState(0)
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([])
  const [pendingFees, setPendingFees] = useState(0)
  const [homeworkPending, setHomeworkPending] = useState(0)
  const [results, setResults] = useState<Result[]>([])
  const [homeworks, setHomeworks] = useState<Homework[]>([])
  const [timetable, setTimetable] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      setError(null)

      const [attendanceRes, examsRes, feesRes, homeworkRes, resultsRes, timetableRes] =
        await Promise.all([
          fetch('/api/attendance'),
          fetch('/api/exams'),
          fetch('/api/fees'),
          fetch('/api/homework'),
          fetch('/api/results'),
          fetch('/api/timetable?day=' + new Date().toLocaleDateString('en', { weekday: 'long' }).toLowerCase()),
        ])

      const attendance = await attendanceRes.json()
      const exams = await examsRes.json()
      const fees = await feesRes.json()
      const homework = await homeworkRes.json()
      const resultsJson = await resultsRes.json()
      const tt = await timetableRes.json()

      const attendanceData = (attendance.data ?? []) as Record<string, unknown>[]
      const examsData = (exams.data ?? []) as Exam[]
      const feesData = (fees.data ?? []) as Record<string, unknown>[]
      const homeworkData = (homework.data ?? []) as Homework[]
      const resultsData = (resultsJson.data ?? []) as Result[]
      const timetableData = (tt.data ?? []) as TimetableEntry[]

      const totalDays = attendanceData.length
      const presentDays = attendanceData.filter((a) => String(a.status ?? '') === 'Present').length
      setAttendancePercent(totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0)

      const upcoming = (examsData as Exam[])
        .filter((e) => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5)
      setUpcomingExams(upcoming)

      const pending = feesData
        .filter((f) => String(f.status ?? '') !== 'paid')
        .reduce((sum, f) => sum + (Number(f.amount) || 0), 0)
      setPendingFees(pending)

      const pendingHw = homeworkData.filter((h) => String(h.status ?? '') === 'active').length
      setHomeworkPending(pendingHw)

      setResults(
        (resultsData as Result[])
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
      )

      setHomeworks(
        (homeworkData as Homework[])
          .filter((h) => String(h.status ?? '') === 'active')
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
          .slice(0, 5)
      )

      setTimetable(
        (timetableData as TimetableEntry[]).sort((a, b) =>
          (a.startTime ?? '').localeCompare(b.startTime ?? '')
        )
      )

      toast.success('Dashboard data loaded')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading text="Loading student dashboard..." />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{error}</p>
        <Button variant="primary" onClick={fetchData}>Retry</Button>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Attendance',
      value: `${attendancePercent}%`,
      icon: CalendarCheck,
      bg: 'bg-green-500/10 dark:bg-green-500/20',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Upcoming Exams',
      value: upcomingExams.length,
      icon: BookOpen,
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Pending Fees',
      value: `₹${pendingFees.toLocaleString()}`,
      icon: DollarSign,
      bg: 'bg-red-500/10 dark:bg-red-500/20',
      textColor: 'text-red-600 dark:text-red-400',
    },
    {
      label: 'Homework Pending',
      value: homeworkPending,
      icon: AlertCircle,
      bg: 'bg-orange-500/10 dark:bg-orange-500/20',
      textColor: 'text-orange-600 dark:text-orange-400',
    },
  ]

  const quickActions = [
    { label: 'View Results', icon: Trophy, href: '/student/results', color: 'bg-blue-500 hover:bg-blue-600' },
    { label: 'View Fees', icon: DollarSign, href: '/student/fees', color: 'bg-green-500 hover:bg-green-600' },
    { label: 'View Timetable', icon: Calendar, href: '/student/timetable', color: 'bg-purple-500 hover:bg-purple-600' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Student Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Track your academic progress</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} variant="stat">
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-lg ${card.bg}`}>
                  <Icon className={`h-6 w-6 ${card.textColor}`} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className={`text-2xl font-bold mt-1 ${card.textColor}`}>{card.value}</p>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Results</CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No results published yet</p>
            ) : (
              <div className="space-y-3">
                {results.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-full bg-primary/10">
                        <Trophy className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.examName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{r.subject}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          r.percentage >= 80 ? 'success' : r.percentage >= 40 ? 'warning' : 'danger'
                        }
                      >
                        {r.grade} - {r.percentage}%
                      </Badge>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {r.marks}/{r.totalMarks}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Timetable</CardTitle>
            </CardHeader>
            <CardContent>
              {timetable.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No classes today</p>
              ) : (
                <div className="space-y-2">
                  {timetable.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div className="text-xs font-medium text-gray-900 dark:text-gray-100 min-w-[2.5rem]">
                        {entry.startTime}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {entry.subject}
                        </p>
                        <p className="text-xs text-gray-500">Room {entry.room}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Homework Due</CardTitle>
            </CardHeader>
            <CardContent>
              {homeworks.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No homework pending</p>
              ) : (
                <div className="space-y-2">
                  {homeworks.map((hw) => (
                    <div
                      key={hw.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{hw.title}</p>
                        <p className="text-xs text-gray-500">{hw.subject}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {new Date(hw.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Button
              key={action.label}
              variant="ghost"
              className={`text-white justify-between ${action.color}`}
              onClick={() => router.push(action.href)}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {action.label}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )
        })}
      </div>
    </div>
  )
}
