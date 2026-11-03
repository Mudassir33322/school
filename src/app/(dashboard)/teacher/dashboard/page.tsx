'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Users,
  CalendarCheck,
  GraduationCap,
  Clock,
  ArrowRight,
  ClipboardCheck,
  FilePlus,
  Eye,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'

interface Homework {
  id: string
  title: string
  subject: string
  class: string
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

interface ClassInfo {
  id: string
  name: string
  studentCount: number
}

export default function TeacherDashboard() {
  const router = useRouter()
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [homeworks, setHomeworks] = useState<Homework[]>([])
  const [timetable, setTimetable] = useState<TimetableEntry[]>([])
  const [mySubjects, setMySubjects] = useState(0)
  const [todayAttendance, setTodayAttendance] = useState<{ present: number; total: number; percentage: number }>({
    present: 0,
    total: 0,
    percentage: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      setError(null)

      const [studentsRes, homeworkRes, timetableRes, attendanceRes, subjectsRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/homework'),
        fetch('/api/timetable?day=' + new Date().toLocaleDateString('en', { weekday: 'long' }).toLowerCase()),
        fetch('/api/attendance?date=' + new Date().toISOString().split('T')[0]),
        fetch('/api/subjects'),
      ])

      const students = await studentsRes.json()
      const homework = await homeworkRes.json()
      const tt = await timetableRes.json()
      const attendance = await attendanceRes.json()
      const subjects = await subjectsRes.json()

      const studentData = (students.data ?? []) as Record<string, unknown>[]
      const homeworkData = (homework.data ?? []) as Homework[]
      const timetableData = (tt.data ?? []) as TimetableEntry[]
      const attendanceData = (attendance.data ?? []) as Record<string, unknown>[]
      const subjectsData = (subjects.data ?? []) as Record<string, unknown>[]

      const presentCount = attendanceData.filter((a) => String(a.status ?? '') === 'Present').length
      const totalCount = attendanceData.length

      const classMap = new Map<string, number>()
      for (const s of studentData) {
        const c = String(s.classId ?? 'Unknown')
        classMap.set(c, (classMap.get(c) ?? 0) + 1)
      }

      setClasses(
        Array.from(classMap.entries()).map(([id, count], i) => ({
          id,
          name: id,
          studentCount: count,
        }))
      )

      setHomeworks(
        (homeworkData as Homework[])
          .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
          .slice(0, 5)
      )

      setTimetable(
        (timetableData as TimetableEntry[]).sort((a, b) =>
          (a.startTime ?? '').localeCompare(b.startTime ?? '')
        )
      )

      setMySubjects(subjectsData.length)
      setTodayAttendance({
        present: presentCount,
        total: totalCount,
        percentage: totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0,
      })

      toast.success('Dashboard data loaded')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading text="Loading teacher dashboard..." />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{error}</p>
        <Button variant="primary" onClick={fetchData}>Retry</Button>
      </div>
    )
  }

  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0)

  const statCards = [
    {
      label: 'My Classes',
      value: classes.length,
      icon: BookOpen,
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'My Subjects',
      value: mySubjects,
      icon: GraduationCap,
      bg: 'bg-purple-500/10 dark:bg-purple-500/20',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Total Students',
      value: totalStudents,
      icon: Users,
      bg: 'bg-green-500/10 dark:bg-green-500/20',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      label: "Today's Attendance",
      value: `${todayAttendance.percentage}%`,
      icon: CalendarCheck,
      bg: 'bg-orange-500/10 dark:bg-orange-500/20',
      textColor: 'text-orange-600 dark:text-orange-400',
      subtext: `${todayAttendance.present} / ${todayAttendance.total} present`,
    },
  ]

  const quickActions = [
    { label: 'Mark Attendance', icon: ClipboardCheck, href: '/teacher/attendance', color: 'bg-green-500 hover:bg-green-600' },
    { label: 'Add Homework', icon: FilePlus, href: '/teacher/homework/new', color: 'bg-blue-500 hover:bg-blue-600' },
    { label: 'View Students', icon: Eye, href: '/teacher/students', color: 'bg-purple-500 hover:bg-purple-600' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Teacher Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your classes and assignments</p>
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
                {card.subtext && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.subtext}</p>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Homework Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {homeworks.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No homework assigned yet</p>
            ) : (
              <div className="space-y-3">
                {homeworks.map((hw) => (
                  <div
                    key={hw.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-full bg-primary/10">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{hw.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {hw.subject} - {hw.class}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={new Date(hw.dueDate) < new Date() ? 'danger' : 'warning'}>
                        {new Date(hw.dueDate) < new Date() ? 'Overdue' : 'Active'}
                      </Badge>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Due: {new Date(hw.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today&apos;s Timetable</CardTitle>
            <Badge variant="info">{new Date().toLocaleDateString('en', { weekday: 'long' })}</Badge>
          </CardHeader>
          <CardContent>
            {timetable.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No classes today</p>
            ) : (
              <div className="space-y-3">
                {timetable.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex flex-col items-center min-w-[3rem]">
                      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                        {entry.startTime}
                      </span>
                      <span className="text-xs text-gray-400">-</span>
                      <span className="text-xs text-gray-500">{entry.endTime}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {entry.subject}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Room {entry.room}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
