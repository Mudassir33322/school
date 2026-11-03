'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  CalendarCheck,
  Trophy,
  DollarSign,
  Megaphone,
  Clock,
  ArrowRight,
  Eye,
  CreditCard,
  Calendar,
  X,
  Check,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'

interface ChildInfo {
  id: string
  name: string
  className: string
  section: string
  rollNo: number | string
}

interface AttendanceSummary {
  present: number
  absent: number
  total: number
  percentage: number
}

interface ExamResult {
  id: string
  examName: string
  subject: string
  marks: number
  totalMarks: number
  percentage: number
  grade: string
  date: string
}

interface FeeRecord {
  id: string
  category: string
  amount: number
  status: string
  dueDate: string
}

interface Notice {
  id: string
  title: string
  message: string
  date: string
  type: string
}

export default function ParentDashboard() {
  const router = useRouter()
  const [child, setChild] = useState<ChildInfo | null>(null)
  const [attendance, setAttendance] = useState<AttendanceSummary>({
    present: 0,
    absent: 0,
    total: 0,
    percentage: 0,
  })
  const [results, setResults] = useState<ExamResult[]>([])
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      setError(null)

      const [studentsRes, attendanceRes, resultsRes, feesRes, noticesRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/attendance'),
        fetch('/api/results'),
        fetch('/api/fees'),
        fetch('/api/notices'),
      ])

      const students = await studentsRes.json()
      const attendance = await attendanceRes.json()
      const resultsJson = await resultsRes.json()
      const fees = await feesRes.json()
      const notices = await noticesRes.json()

      const studentData = (students.data ?? []) as Record<string, unknown>[]
      const attendanceData = (attendance.data ?? []) as Record<string, unknown>[]
      const resultsData = (resultsJson.data ?? []) as ExamResult[]
      const feesData = (fees.data ?? []) as FeeRecord[]
      const noticesData = (notices.data ?? []) as Notice[]

      if (studentData.length > 0) {
        const first = studentData[0]
        setChild({
          id: String(first.id ?? ''),
          name: String(first.name ?? 'N/A'),
          className: String(first.className ?? first.classId ?? 'N/A'),
          section: String(first.section ?? 'A'),
          rollNo: typeof first.rollNo === 'number' ? first.rollNo : (first.rollNo as string) ?? 'N/A',
        })
      }

      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthAttendance = attendanceData.filter((a) => {
        const d = new Date(String(a.date ?? ''))
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })
      const present = monthAttendance.filter((a) => String(a.status ?? '') === 'Present').length
      const absent = monthAttendance.filter((a) => String(a.status ?? '') === 'Absent').length
      const total = monthAttendance.length
      setAttendance({
        present,
        absent,
        total,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      })

      setResults(
        (resultsData as ExamResult[])
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
      )

      setFeeRecords(feesData as FeeRecord[])
      setNotices(
        (noticesData as Notice[])
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
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

  if (loading) return <Loading text="Loading parent dashboard..." />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{error}</p>
        <Button variant="primary" onClick={fetchData}>Retry</Button>
      </div>
    )
  }

  const pendingFees = feeRecords
    .filter((f) => String(f.status ?? '') !== 'paid')
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0)

  const quickLinks = [
    { label: 'View Attendance', icon: CalendarCheck, href: '/parent/attendance', color: 'bg-green-500 hover:bg-green-600' },
    { label: 'View Results', icon: Eye, href: '/parent/results', color: 'bg-blue-500 hover:bg-blue-600' },
    { label: 'Pay Fees', icon: CreditCard, href: '/parent/fees', color: 'bg-purple-500 hover:bg-purple-600' },
    { label: 'View Notices', icon: Megaphone, href: '/parent/notices', color: 'bg-orange-500 hover:bg-orange-600' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Parent Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor your child&apos;s progress</p>
      </div>

      {child && (
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-full bg-primary/10">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{child.name}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
                <span>Class: {child.className}</span>
                <span>Section: {child.section}</span>
                <span>Roll No: {child.rollNo}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Attendance Summary (This Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendance.total === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No attendance data</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="relative h-24 w-24">
                    <svg className="h-full w-full" viewBox="0 0 36 36">
                      <path
                        className="stroke-gray-200 dark:stroke-gray-700"
                        fill="none"
                        strokeWidth="3"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="stroke-green-500"
                        fill="none"
                        strokeWidth="3"
                        strokeDasharray={`${attendance.percentage}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {attendance.percentage}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-6 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-success" />
                    <span className="text-gray-600 dark:text-gray-300">Present: {attendance.present}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <X className="h-4 w-4 text-danger" />
                    <span className="text-gray-600 dark:text-gray-300">Absent: {attendance.absent}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Fee Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feeRecords.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No fee records</p>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Pending Amount</span>
                  <span className="text-lg font-bold text-danger">₹{pendingFees.toLocaleString()}</span>
                </div>
                <div className="space-y-2 mt-3">
                  {feeRecords.slice(0, 3).map((fee) => (
                    <div key={fee.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">{fee.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 dark:text-gray-100">₹{Number(fee.amount).toLocaleString()}</span>
                        <Badge variant={fee.status === 'paid' ? 'success' : 'warning'}>
                          {fee.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Recent Exam Results
            </CardTitle>
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
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.examName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{r.subject}</p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          r.percentage >= 80 ? 'success' : r.percentage >= 40 ? 'warning' : 'danger'
                        }
                      >
                        {r.grade}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">{r.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Recent Notices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notices.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No notices yet</p>
            ) : (
              <div className="space-y-3">
                {notices.map((notice) => (
                  <div
                    key={notice.id}
                    className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {notice.title || notice.message}
                      </p>
                      <Badge variant="info">{notice.type}</Badge>
                    </div>
                    {notice.title && notice.message && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notice.message}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(notice.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link) => {
          const Icon = link.icon
          return (
            <Button
              key={link.label}
              variant="ghost"
              className={`text-white justify-between ${link.color}`}
              onClick={() => router.push(link.href)}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {link.label}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )
        })}
      </div>
    </div>
  )
}
