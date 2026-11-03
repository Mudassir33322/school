'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Select from '@/components/ui/select'
import { Loading } from '@/components/ui/loading'
import { showToast } from '@/components/ui/toast'
import {
  FileText,
  FileSpreadsheet,
  Users,
  CalendarCheck,
  DollarSign,
  GraduationCap,
  BarChart3,
  Download,
  TrendingUp,
  AlertTriangle,
  Award,
} from 'lucide-react'
import type { Student, Attendance, Fee, Exam, ExamResult } from '@/types'

type Tab = 'students' | 'attendance' | 'fees' | 'exams'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'students', label: 'Student Reports', icon: <Users className="h-4 w-4" /> },
  { key: 'attendance', label: 'Attendance Reports', icon: <CalendarCheck className="h-4 w-4" /> },
  { key: 'fees', label: 'Fee Reports', icon: <DollarSign className="h-4 w-4" /> },
  { key: 'exams', label: 'Exam Reports', icon: <GraduationCap className="h-4 w-4" /> },
]

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(0, i).toLocaleString('default', { month: 'long' }),
}))

const YEARS = Array.from({ length: 10 }, (_, i) => ({
  value: String(new Date().getFullYear() - 5 + i),
  label: String(new Date().getFullYear() - 5 + i),
}))

function ChartBar({
  label,
  value,
  max,
  color,
}: {
  label: string
  value: number
  max: number
  color: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <div className="flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-6 rounded-full ${color} transition-all`}
          style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
        />
      </div>
      <span className="w-16 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
        {value}%
      </span>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <Card variant="stat">
      <CardContent className="flex items-center gap-4">
        <div className={`rounded-lg p-3 ${color}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function TabNav({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (t: Tab) => void }) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === tab.key
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('students')
  const [loading, setLoading] = useState(false)

  // Student tab
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<{ value: string; label: string }[]>([])
  const [sections, setSections] = useState<{ value: string; label: string }[]>([])

  // Attendance tab
  const [attMonth, setAttMonth] = useState(String(new Date().getMonth() + 1))
  const [attYear, setAttYear] = useState(String(new Date().getFullYear()))
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([])
  const [attendanceStudents, setAttendanceStudents] = useState<Student[]>([])

  // Fee tab
  const [feeMonth, setFeeMonth] = useState(String(new Date().getMonth() + 1))
  const [feeData, setFeeData] = useState<Fee[]>([])

  // Exam tab
  const [selectedExam, setSelectedExam] = useState('')
  const [exams, setExams] = useState<{ value: string; label: string }[]>([])
  const [examResults, setExamResults] = useState<ExamResult[]>([])

  useEffect(() => {
    fetch('/api/classes')
      .then((r) => r.json())
      .then((d) => {
        const data = Array.isArray(d) ? d : d.classes ?? []
        setClasses(data.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name })))
      })
      .catch(() => {})

    fetch('/api/exams')
      .then((r) => r.json())
      .then((d) => {
        const data = Array.isArray(d) ? d : d.exams ?? []
        setExams(data.map((e: { id: string; name: string }) => ({ value: e.id, label: e.name })))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedClass) return
    fetch(`/api/classes/${selectedClass}/sections`)
      .then((r) => r.json())
      .then((d) => {
        const data = Array.isArray(d) ? d : d.sections ?? []
        setSections(data.map((s: { id: string; name: string }) => ({ value: s.id, label: s.name })))
      })
      .catch(() => {})
  }, [selectedClass])

  const loadStudents = async () => {
    if (!selectedClass) return
    setLoading(true)
    try {
      const res = await fetch(`/api/students?classId=${selectedClass}${selectedSection ? `&sectionId=${selectedSection}` : ''}`)
      const d = await res.json()
      setStudents(Array.isArray(d) ? d : d.students ?? [])
    } catch {
      showToast('Failed to load students', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadAttendance = async () => {
    if (!selectedClass) return
    setLoading(true)
    try {
      const [attRes, stuRes] = await Promise.all([
        fetch(`/api/attendance?classId=${selectedClass}&month=${attMonth}&year=${attYear}`),
        fetch(`/api/students?classId=${selectedClass}`),
      ])
      const attData = await attRes.json()
      const stuData = await stuRes.json()
      setAttendanceData(Array.isArray(attData) ? attData : attData.attendance ?? [])
      setAttendanceStudents(Array.isArray(stuData) ? stuData : stuData.students ?? [])
    } catch {
      showToast('Failed to load attendance data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadFees = async () => {
    if (!selectedClass) return
    setLoading(true)
    try {
      const res = await fetch(`/api/fees?classId=${selectedClass}&month=${feeMonth}`)
      const d = await res.json()
      setFeeData(Array.isArray(d) ? d : d.fees ?? [])
    } catch {
      showToast('Failed to load fee data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadExamResults = async () => {
    if (!selectedExam) return
    setLoading(true)
    try {
      const res = await fetch(`/api/exam-results?examId=${selectedExam}`)
      const d = await res.json()
      setExamResults(Array.isArray(d) ? d : d.results ?? [])
    } catch {
      showToast('Failed to load exam results', 'error')
    } finally {
      setLoading(false)
    }
  }

  const exportPDF = () => showToast('PDF export coming soon', 'success')
  const exportExcel = () => showToast('Excel export coming soon', 'success')

  const attPresent = attendanceData.filter((a) => a.status === 'Present').length
  const attAbsent = attendanceData.filter((a) => a.status === 'Absent').length
  const attLate = attendanceData.filter((a) => a.status === 'Late').length
  const attTotal = attendanceData.length
  const presentPct = attTotal ? Math.round((attPresent / attTotal) * 100) : 0
  const absentPct = attTotal ? Math.round((attAbsent / attTotal) * 100) : 0
  const latePct = attTotal ? Math.round((attLate / attTotal) * 100) : 0

  const totalCollected = feeData.filter((f) => f.status === 'Paid').reduce((s, f) => s + f.paidAmount, 0)
  const totalAmount = feeData.reduce((s, f) => s + f.amount, 0)
  const totalPending = feeData.filter((f) => f.status !== 'Paid').reduce((s, f) => s + (f.amount - f.paidAmount), 0)
  const defaulters = feeData.filter((f) => f.status === 'Overdue' || (f.status === 'Unpaid' && new Date(f.dueDate) < new Date()))

  const passedResults = examResults.filter((r) => r.marksObtained >= (r.maxMarks * 40) / 100)
  const passRate = examResults.length ? Math.round((passedResults.length / examResults.length) * 100) : 0

  const avgMarks =
    examResults.length
      ? Math.round(examResults.reduce((s, r) => s + (r.marksObtained / r.maxMarks) * 100, 0) / examResults.length)
      : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Reports & Analytics
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Student Reports */}
      {activeTab === 'students' && (
        <Card>
          <CardHeader>
            <CardTitle>Student Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="w-full sm:w-48">
                <Select
                  label="Class"
                  options={classes}
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value)
                    setSelectedSection('')
                  }}
                />
              </div>
              <div className="w-full sm:w-48">
                <Select
                  label="Section"
                  options={sections}
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button variant="primary" onClick={loadStudents} disabled={!selectedClass}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Load
                </Button>
              </div>
            </div>

            {loading ? (
              <Loading message="Loading student data..." />
            ) : students.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                    <tr>
                      {['Name', 'Roll No', 'Attendance %', 'Fee Status', 'Average Marks'].map((h) => (
                        <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {students.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                          {s.firstName} {s.lastName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">{s.rollNo}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">-</td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">-</td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : selectedClass ? (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Click &quot;Load&quot; to fetch student data
              </p>
            ) : (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Select a class to view student reports
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attendance Reports */}
      {activeTab === 'attendance' && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="w-full sm:w-48">
                <Select
                  label="Class"
                  options={classes}
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-40">
                <Select
                  label="Month"
                  options={MONTHS}
                  value={attMonth}
                  onChange={(e) => setAttMonth(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-40">
                <Select
                  label="Year"
                  options={YEARS}
                  value={attYear}
                  onChange={(e) => setAttYear(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button variant="primary" onClick={loadAttendance} disabled={!selectedClass}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Load
                </Button>
              </div>
            </div>

            {loading ? (
              <Loading message="Loading attendance data..." />
            ) : attTotal > 0 ? (
              <>
                <div className="grid gap-4 sm:grid-cols-4">
                  <StatCard title="Total Days" value={String(attTotal)} icon={<CalendarCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />} color="bg-blue-100 dark:bg-blue-900/30" />
                  <StatCard title="Present %" value={`${presentPct}%`} icon={<TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />} color="bg-green-100 dark:bg-green-900/30" />
                  <StatCard title="Absent %" value={`${absentPct}%`} icon={<AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />} color="bg-red-100 dark:bg-red-900/30" />
                  <StatCard title="Late %" value={`${latePct}%`} icon={<AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />} color="bg-yellow-100 dark:bg-yellow-900/30" />
                </div>

                <div className="space-y-3 rounded-lg border p-4 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Attendance Distribution</h4>
                  <ChartBar label="Present" value={presentPct} max={100} color="bg-green-500" />
                  <ChartBar label="Absent" value={absentPct} max={100} color="bg-red-500" />
                  <ChartBar label="Late" value={latePct} max={100} color="bg-yellow-500" />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Student</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Present</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Absent</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Late</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {attendanceStudents.map((s) => {
                        const records = attendanceData.filter((a) => a.studentId === s.id)
                        const p = records.filter((a) => a.status === 'Present').length
                        const ab = records.filter((a) => a.status === 'Absent').length
                        const l = records.filter((a) => a.status === 'Late').length
                        const pct = records.length ? Math.round((p / records.length) * 100) : 0
                        return (
                          <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                              {s.firstName} {s.lastName}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">{p}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">{ab}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">{l}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">{pct}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : selectedClass ? (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Click &quot;Load&quot; to view attendance data</p>
            ) : (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Select a class to view attendance reports</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fee Reports */}
      {activeTab === 'fees' && (
        <Card>
          <CardHeader>
            <CardTitle>Fee Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="w-full sm:w-48">
                <Select
                  label="Class"
                  options={classes}
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-40">
                <Select
                  label="Month"
                  options={MONTHS}
                  value={feeMonth}
                  onChange={(e) => setFeeMonth(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button variant="primary" onClick={loadFees} disabled={!selectedClass}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Load
                </Button>
              </div>
            </div>

            {loading ? (
              <Loading message="Loading fee data..." />
            ) : feeData.length > 0 ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard
                    title="Total Collected"
                    value={`$${totalCollected.toLocaleString()}`}
                    icon={<DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />}
                    color="bg-green-100 dark:bg-green-900/30"
                  />
                  <StatCard
                    title="Pending"
                    value={`$${totalPending.toLocaleString()}`}
                    icon={<DollarSign className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />}
                    color="bg-yellow-100 dark:bg-yellow-900/30"
                  />
                  <StatCard
                    title="Defaulters"
                    value={String(defaulters.length)}
                    icon={<AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />}
                    color="bg-red-100 dark:bg-red-900/30"
                  />
                </div>

                <div className="rounded-lg border p-4 dark:border-gray-700">
                  <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Fee Summary</h4>
                  <div className="space-y-3">
                    <ChartBar label="Collected" value={totalCollected} max={totalAmount || 1} color="bg-green-500" />
                    <ChartBar label="Pending" value={totalPending} max={totalAmount || 1} color="bg-yellow-500" />
                    <ChartBar label="Defaulters" value={defaulters.length} max={feeData.length || 1} color="bg-red-500" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Student</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Amount</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Paid</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Due</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {feeData.map((f) => (
                        <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{f.admissionNo}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">${f.amount.toLocaleString()}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">${f.paidAmount.toLocaleString()}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">${(f.amount - f.paidAmount).toLocaleString()}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                f.status === 'Paid'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : f.status === 'Partial'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}
                            >
                              {f.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : selectedClass ? (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Click &quot;Load&quot; to view fee data</p>
            ) : (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Select a class to view fee reports</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Exam Reports */}
      {activeTab === 'exams' && (
        <Card>
          <CardHeader>
            <CardTitle>Exam Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="w-full sm:w-48">
                <Select
                  label="Exam"
                  options={exams}
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button variant="primary" onClick={loadExamResults} disabled={!selectedExam}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Load
                </Button>
              </div>
            </div>

            {loading ? (
              <Loading message="Loading exam results..." />
            ) : examResults.length > 0 ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard
                    title="Pass Rate"
                    value={`${passRate}%`}
                    icon={<Award className="h-6 w-6 text-green-600 dark:text-green-400" />}
                    color="bg-green-100 dark:bg-green-900/30"
                  />
                  <StatCard
                    title="Fail Rate"
                    value={`${100 - passRate}%`}
                    icon={<AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />}
                    color="bg-red-100 dark:bg-red-900/30"
                  />
                  <StatCard
                    title="Class Average"
                    value={`${avgMarks}%`}
                    icon={<TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
                    color="bg-blue-100 dark:bg-blue-900/30"
                  />
                </div>

                <div className="rounded-lg border p-4 dark:border-gray-700">
                  <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Pass / Fail Ratio
                  </h4>
                  <div className="flex h-8 overflow-hidden rounded-lg">
                    <div
                      className="flex items-center justify-center bg-green-500 text-xs font-medium text-white transition-all"
                      style={{ width: `${passRate}%` }}
                    >
                      Pass {passRate}%
                    </div>
                    <div
                      className="flex items-center justify-center bg-red-500 text-xs font-medium text-white transition-all"
                      style={{ width: `${100 - passRate}%` }}
                    >
                      Fail {100 - passRate}%
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4 dark:border-gray-700">
                  <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Top 10 Students
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Top student data will appear here after loading.
                  </p>
                </div>
              </>
            ) : selectedExam ? (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Click &quot;Load&quot; to view exam results</p>
            ) : (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Select an exam to view reports</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
