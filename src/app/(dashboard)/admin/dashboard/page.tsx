'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  Users,
  Briefcase,
  CalendarCheck,
  DollarSign,
  AlertCircle,
  Clock,
  ArrowRight,
  UserPlus,
  ClipboardCheck,
  Megaphone,
  BarChart3,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import { ChartCard, PieChartComponent, BarChartComponent, AreaChartComponent } from '@/components/ui/charts'

interface DashboardStats {
  totalStudents: number
  activeStudents: number
  totalTeachers: number
  activeTeachers: number
  totalStaff: number
  activeStaff: number
  todayAttendance: { total: number; present: number; percentage: number }
  fees: { total: number; collected: number; pending: number }
}

interface Activity {
  id: string
  type: string
  message: string
  date: string
}

const initialStats: DashboardStats = {
  totalStudents: 0,
  activeStudents: 0,
  totalTeachers: 0,
  activeTeachers: 0,
  totalStaff: 0,
  activeStaff: 0,
  todayAttendance: { total: 0, present: 0, percentage: 0 },
  fees: { total: 0, collected: 0, pending: 0 },
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>(initialStats)
  const [activities, setActivities] = useState<Activity[]>([])
  const [monthlyData, setMonthlyData] = useState<{ month: string; students: number; teachers: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to fetch dashboard data')
      const json = await res.json()

      if (json.success && json.data) {
        setStats(json.data)
      } else {
        await fetchFromIndividualApis()
      }
    } catch {
      await fetchFromIndividualApis()
    } finally {
      setLoading(false)
    }
  }

  async function fetchFromIndividualApis() {
    try {
      const [studentsRes, teachersRes, staffRes, attendanceRes, feesRes, noticesRes] =
        await Promise.all([
          fetch('/api/students'),
          fetch('/api/teachers'),
          fetch('/api/staff'),
          fetch('/api/attendance'),
          fetch('/api/fees'),
          fetch('/api/notices'),
        ])

      const students = await studentsRes.json()
      const teachers = await teachersRes.json()
      const staff = await staffRes.json()
      const attendance = await attendanceRes.json()
      const fees = await feesRes.json()
      const notices = await noticesRes.json()

      const studentData = (students.data ?? []) as Record<string, unknown>[]
      const teacherData = (teachers.data ?? []) as Record<string, unknown>[]
      const staffData = (staff.data ?? []) as Record<string, unknown>[]
      const attendanceData = (attendance.data ?? []) as Record<string, unknown>[]
      const feesData = (fees.data ?? []) as Record<string, unknown>[]
      const noticesData = (notices.data ?? []) as Record<string, unknown>[]

      const activeStudents = studentData.filter((s) => String(s.status ?? '') === 'Active').length
      const activeTeachers = teacherData.filter((t) => String(t.status ?? '') === 'Active').length
      const activeStaff = staffData.filter((s) => String(s.status ?? '') === 'Active').length

      const today = new Date().toISOString().split('T')[0]
      const todayAttendance = attendanceData.filter((a) => String(a.date ?? '') === today)
      const todayPresent = todayAttendance.filter((a) => String(a.status ?? '') === 'Present').length
      const todayPercentage = todayAttendance.length > 0
        ? Math.round((todayPresent / todayAttendance.length) * 100)
        : 0

      const totalFees = feesData.reduce((sum, f) => sum + (Number(f.amount) || 0), 0)
      const collectedFees = feesData
        .filter((f) => String(f.status ?? '') === 'paid')
        .reduce((sum, f) => sum + (Number(f.amount) || 0), 0)

      setStats({
        totalStudents: studentData.length,
        activeStudents,
        totalTeachers: teacherData.length,
        activeTeachers,
        totalStaff: staffData.length,
        activeStaff,
        todayAttendance: {
          total: todayAttendance.length,
          present: todayPresent,
          percentage: todayPercentage,
        },
        fees: {
          total: totalFees,
          collected: collectedFees,
          pending: totalFees - collectedFees,
        },
      })

      const recentNotices = (noticesData as Record<string, string>[])
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
        .map((n) => ({
          id: n.id ?? '',
          type: 'notice',
          message: n.message || n.title || '',
          date: n.date ?? '',
        }))

      setActivities(recentNotices)

      const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const now = new Date()
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
        return { year: d.getFullYear(), month: d.getMonth() }
      })

      const enrollmentTrend = last6Months.map(({ year, month }) => {
        const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
        const studentsCount = studentData.filter((s) => {
          const created = String(s.createdAt ?? '')
          return created.startsWith(monthStr)
        }).length
        const teachersCount = teacherData.filter((t) => {
          const created = String(t.createdAt ?? '')
          return created.startsWith(monthStr)
        }).length
        return {
          month: MONTHS[month],
          students: studentsCount,
          teachers: teachersCount,
        }
      })

      setMonthlyData(enrollmentTrend)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data'
      setError(message)
      toast.error(message)
    }
  }

  if (loading) return <Loading text="Loading admin dashboard..." />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-12 w-12 text-danger" />
        <p className="text-lg font-medium text-foreground">{error}</p>
        <Button variant="primary" onClick={fetchDashboardData}>
          Retry
        </Button>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Students',
      value: stats.totalStudents,
      icon: GraduationCap,
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Total Teachers',
      value: stats.totalTeachers,
      icon: Users,
      bg: 'bg-green-500/10 dark:bg-green-500/20',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Total Staff',
      value: stats.totalStaff,
      icon: Briefcase,
      bg: 'bg-purple-500/10 dark:bg-purple-500/20',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: "Today's Attendance",
      value: `${stats.todayAttendance.percentage}%`,
      icon: CalendarCheck,
      bg: 'bg-orange-500/10 dark:bg-orange-500/20',
      textColor: 'text-orange-600 dark:text-orange-400',
      subtext: `${stats.todayAttendance.present} / ${stats.todayAttendance.total} present`,
    },
    {
      label: 'Fee Collection',
      value: `₹${stats.fees.collected.toLocaleString()}`,
      icon: DollarSign,
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      subtext: `Total: ₹${stats.fees.total.toLocaleString()}`,
    },
    {
      label: 'Pending Fees',
      value: `₹${stats.fees.pending.toLocaleString()}`,
      icon: AlertCircle,
      bg: 'bg-red-500/10 dark:bg-red-500/20',
      textColor: 'text-red-600 dark:text-red-400',
    },
  ]

  const quickActions = [
    { label: 'Add Student', icon: UserPlus, href: '/admin/students/new', color: 'bg-blue-500 hover:bg-blue-600' },
    { label: 'Mark Attendance', icon: ClipboardCheck, href: '/admin/attendance', color: 'bg-green-500 hover:bg-green-600' },
    { label: 'Create Notice', icon: Megaphone, href: '/admin/notices/new', color: 'bg-purple-500 hover:bg-purple-600' },
    { label: 'Generate Report', icon: BarChart3, href: '/admin/reports', color: 'bg-orange-500 hover:bg-orange-600' },
  ]

  const attendancePieData = [
    { name: 'Present', value: stats.todayAttendance.present || 0 },
    { name: 'Absent', value: (stats.todayAttendance.total - stats.todayAttendance.present) || 0 },
  ]

  const feeBarData = [
    { name: 'Collected', amount: stats.fees.collected },
    { name: 'Pending', amount: stats.fees.pending },
    { name: 'Total', amount: stats.fees.total },
  ]

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your school statistics</p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <motion.div key={card.label} variants={item}>
              <Card variant="stat">
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-lg ${card.bg}`}>
                    <Icon className={`h-6 w-6 ${card.textColor}`} />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${card.textColor}`}>{card.value}</p>
                  {card.subtext && (
                    <p className="text-xs text-muted-foreground mt-1">{card.subtext}</p>
                  )}
                </div>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Student Enrollment Trend" className="lg:col-span-2">
          <AreaChartComponent
            data={monthlyData}
            xKey="month"
            areas={[
              { key: 'students', color: '#4f46e5', name: 'Students' },
              { key: 'teachers', color: '#059669', name: 'Teachers' },
            ]}
            height={280}
          />
        </ChartCard>

        <ChartCard title="Today's Attendance">
          {stats.todayAttendance.total > 0 ? (
            <PieChartComponent data={attendancePieData} height={240} />
          ) : (
            <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
              No attendance data for today
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent activities</p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="p-1.5 rounded-full bg-primary/10">
                      <Megaphone className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Badge variant="info">Notice</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.label}
                  variant="ghost"
                  className={`w-full justify-between text-white ${action.color}`}
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
          </CardContent>
        </Card>
      </div>

      <ChartCard title="Fee Overview">
        <BarChartComponent
          data={feeBarData}
          xKey="name"
          yKey="amount"
          height={250}
        />
      </ChartCard>
    </div>
  )
}
