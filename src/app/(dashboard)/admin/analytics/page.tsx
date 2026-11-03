'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Users,
  AlertTriangle,
  Award,
  TrendingUp,
  Download,
  FileText,
  GraduationCap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Select from '@/components/ui/select'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import Modal from '@/components/ui/modal'
import { showToast } from '@/components/ui/toast'
import {
  BarChartComponent,
  PieChartComponent,
  LineChartComponent,
  ChartCard,
} from '@/components/ui/charts'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

interface Result {
  id: string
  studentId: string
  examId: string
  classId: string
  subjectId?: string
  subject?: string
  marks: number
  totalMarks: number
  percentage: number
  grade: string
}

interface Attendance {
  id: string
  studentId: string
  classId: string
  date: string
  status: string
}

interface Student {
  id: string
  firstName: string
  lastName: string
  classId: string
  sectionId: string
  rollNo: string
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportStudent, setReportStudent] = useState<{
    name: string
    class: string
    average: number
    attendance: number
    subjects: { name: string; marks: number; max: number }[]
  } | null>(null)

  useEffect(() => {
    fetchAllData()
  }, [])

  async function fetchAllData() {
    setLoading(true)
    try {
      const [resultsRes, studentsRes, attendanceRes] = await Promise.allSettled([
        fetch('/api/results'),
        fetch('/api/students'),
        fetch('/api/attendance'),
      ])

      const resultsJson = resultsRes.status === 'fulfilled' ? await resultsRes.value.json() : null
      const studentsJson = studentsRes.status === 'fulfilled' ? await studentsRes.value.json() : null
      const attendanceJson = attendanceRes.status === 'fulfilled' ? await attendanceRes.value.json() : null

      setResults(Array.isArray(resultsJson?.data) ? resultsJson.data : [])
      setStudents(
        Array.isArray(studentsJson)
          ? studentsJson
          : studentsJson?.data ?? studentsJson?.students ?? []
      )

      const attArr = Array.isArray(attendanceJson?.data)
        ? attendanceJson.data
        : Array.isArray(attendanceJson)
        ? attendanceJson
        : []
      setAttendance(attArr)
    } catch {
      // keep empty state
    } finally {
      setLoading(false)
    }
  }

  const classAverages = useMemo(() => {
    const classMap: Record<string, { total: number; count: number }> = {}
    results.forEach((r) => {
      const cls = r.classId || 'Unknown'
      if (!classMap[cls]) classMap[cls] = { total: 0, count: 0 }
      classMap[cls].total += r.percentage || 0
      classMap[cls].count += 1
    })
    return Object.entries(classMap)
      .map(([cls, data]) => ({
        class: `Class ${cls}`,
        average: data.count > 0 ? Math.round(data.total / data.count) : 0,
      }))
      .sort((a, b) => a.class.localeCompare(b.class))
  }, [results])

  const subjectPerformance = useMemo(() => {
    const subjectMap: Record<string, { total: number; count: number }> = {}
    results.forEach((r) => {
      const sub = r.subject || r.subjectId || 'Unknown'
      if (!subjectMap[sub]) subjectMap[sub] = { total: 0, count: 0 }
      subjectMap[sub].total += r.percentage || 0
      subjectMap[sub].count += 1
    })
    return Object.entries(subjectMap)
      .map(([name, data]) => ({
        name,
        value: data.count > 0 ? Math.round(data.total / data.count) : 0,
      }))
      .sort((a, b) => b.value - a.value)
  }, [results])

  const attendanceTrend = useMemo(() => {
    const monthMap: Record<string, { present: number; total: number }> = {}
    attendance.forEach((a) => {
      const d = a.date || ''
      const monthKey = d.substring(0, 7) // YYYY-MM
      if (!monthMap[monthKey]) monthMap[monthKey] = { present: 0, total: 0 }
      monthMap[monthKey].total += 1
      if (a.status === 'Present' || a.status === 'Late') {
        monthMap[monthKey].present += 1
      }
    })
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, data]) => {
        const monthNum = parseInt(key.split('-')[1], 10) - 1
        return {
          month: MONTHS[monthNum] || key,
          attendance: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
        }
      })
  }, [attendance])

  const gradeDistribution = useMemo(() => {
    const gradeMap: Record<string, number> = { 'A+': 0, A: 0, 'B+': 0, B: 0, 'C+': 0, C: 0, D: 0, F: 0 }
    results.forEach((r) => {
      const g = r.grade || 'F'
      if (g in gradeMap) gradeMap[g] += 1
      else gradeMap['F'] += 1
    })
    return Object.entries(gradeMap)
      .filter(([, count]) => count > 0)
      .map(([grade, count]) => ({ grade, count }))
  }, [results])

  const classComparison = useMemo(() => {
    const classMap: Record<string, { marks: number; present: number; total: number; count: number }> = {}
    results.forEach((r) => {
      const cls = r.classId || 'Unknown'
      if (!classMap[cls]) classMap[cls] = { marks: 0, present: 0, total: 0, count: 0 }
      classMap[cls].marks += r.percentage || 0
      classMap[cls].count += 1
    })
    attendance.forEach((a) => {
      const cls = a.classId || 'Unknown'
      if (!classMap[cls]) classMap[cls] = { marks: 0, present: 0, total: 0, count: 0 }
      classMap[cls].total += 1
      if (a.status === 'Present' || a.status === 'Late') classMap[cls].present += 1
    })
    return Object.entries(classMap)
      .slice(0, 8)
      .map(([cls, data]) => ({
        className: `Class ${cls}`,
        marks: data.count > 0 ? Math.round(data.marks / data.count) : 0,
        attendance: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
      }))
      .sort((a, b) => a.className.localeCompare(b.className))
  }, [results, attendance])

  const topStudents = useMemo(() => {
    const studentMap: Record<string, { total: number; count: number; name: string; class: string }> = {}
    results.forEach((r) => {
      const sid = r.studentId
      if (!studentMap[sid]) {
        const stu = students.find((s) => s.id === sid)
        studentMap[sid] = {
          total: 0,
          count: 0,
          name: stu ? `${stu.firstName} ${stu.lastName}` : sid,
          class: stu?.classId || r.classId || '',
        }
      }
      studentMap[sid].total += r.percentage || 0
      studentMap[sid].count += 1
    })
    return Object.values(studentMap)
      .map((s) => ({
        ...s,
        average: s.count > 0 ? Math.round(s.total / s.count) : 0,
        attendance: computeStudentAttendancePercent(s.name),
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 10)
  }, [results, students, attendance])

  const atRiskStudents = useMemo(() => {
    const studentMap: Record<string, {
      total: number
      count: number
      name: string
      class: string
      present: number
      totalAtt: number
    }> = {}
    results.forEach((r) => {
      const sid = r.studentId
      if (!studentMap[sid]) {
        const stu = students.find((s) => s.id === sid)
        studentMap[sid] = {
          total: 0,
          count: 0,
          name: stu ? `${stu.firstName} ${stu.lastName}` : sid,
          class: stu?.classId || r.classId || '',
          present: 0,
          totalAtt: 0,
        }
      }
      studentMap[sid].total += r.percentage || 0
      studentMap[sid].count += 1
    })
    attendance.forEach((a) => {
      const sid = a.studentId
      if (studentMap[sid]) {
        studentMap[sid].totalAtt += 1
        if (a.status === 'Present' || a.status === 'Late') studentMap[sid].present += 1
      }
    })
    return Object.values(studentMap)
      .map((s) => ({
        name: s.name,
        class: s.class,
        average: s.count > 0 ? Math.round(s.total / s.count) : 0,
        attendance: s.totalAtt > 0 ? Math.round((s.present / s.totalAtt) * 100) : 100,
        reason:
          (s.count > 0 && Math.round(s.total / s.count) < 40)
            ? 'Low marks'
            : s.totalAtt > 0 && Math.round((s.present / s.totalAtt) * 100) < 60
            ? 'Poor attendance'
            : 'Needs improvement',
      }))
      .filter((s) => s.average < 50 || s.attendance < 70)
      .sort((a, b) => a.average - b.average)
      .slice(0, 10)
  }, [results, students, attendance])

  function computeStudentAttendancePercent(name: string): number {
    const stu = students.find((s) => `${s.firstName} ${s.lastName}` === name)
    if (!stu) return 0
    const stuAtt = attendance.filter((a) => a.studentId === stu.id)
    if (stuAtt.length === 0) return 0
    const present = stuAtt.filter((a) => a.status === 'Present' || a.status === 'Late').length
    return Math.round((present / stuAtt.length) * 100)
  }

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return students
    return students.filter((s) => s.classId === selectedClass)
  }, [students, selectedClass])

  const classOptions = useMemo(() => {
    const classIds = [...new Set(students.map((s) => s.classId).filter(Boolean))].sort()
    return classIds.map((id) => ({ value: id, label: `Class ${id}` }))
  }, [students])

  async function handleGenerateReport(student: { name: string; class: string; id?: string }) {
    let subjects: { name: string; marks: number; max: number }[] = []
    if (student.id) {
      const res = await fetch(`/api/results?studentId=${student.id}`)
      const json = await res.json()
      const studentResults: Result[] = json.data || []
      subjects = studentResults.map((r) => ({
        name: r.subject || r.subjectId || 'Subject',
        marks: r.marks,
        max: r.totalMarks || 100,
      }))
    }
    if (subjects.length === 0) {
      subjects = [{ name: 'No results found', marks: 0, max: 100 }]
    }

    const avg = subjects.length > 0
      ? Math.round(subjects.reduce((sum, s) => sum + (s.max > 0 ? (s.marks / s.max) * 100 : 0), 0) / subjects.length)
      : 0

    const stu = students.find((s) => `${s.firstName} ${s.lastName}` === student.name)
    const stuAtt = stu ? attendance.filter((a) => a.studentId === stu.id) : []
    const presentCount = stuAtt.filter((a) => a.status === 'Present' || a.status === 'Late').length
    const attPct = stuAtt.length > 0 ? Math.round((presentCount / stuAtt.length) * 100) : 0

    setReportStudent({
      name: student.name,
      class: student.class,
      average: avg,
      attendance: attPct,
      subjects,
    })
    setReportModalOpen(true)
  }

  if (loading) return <Loading text="Loading analytics data..." />

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Performance Analytics</h1>
          <p className="text-muted-foreground mt-1">Data-driven report cards and performance insights</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => showToast('Report exported', 'success')}>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Class-wise Average Marks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {classAverages.length > 0 ? (
                <BarChartComponent data={classAverages} xKey="class" yKey="average" height={300} />
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">No exam results available yet</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Subject-wise Performance">
            {subjectPerformance.length > 0 ? (
              <PieChartComponent data={subjectPerformance} height={300} />
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">No subject data available</p>
            )}
          </ChartCard>

          <ChartCard title="Grade Distribution">
            {gradeDistribution.length > 0 ? (
              <BarChartComponent data={gradeDistribution} xKey="grade" yKey="count" color="#059669" height={300} />
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">No grades available</p>
            )}
          </ChartCard>
        </motion.div>

        <motion.div variants={item}>
          <ChartCard title="Monthly Attendance Trend">
            {attendanceTrend.length > 0 ? (
              <LineChartComponent
                data={attendanceTrend}
                xKey="month"
                lines={[{ key: 'attendance', color: '#4f46e5', name: 'Attendance %' }]}
                height={300}
              />
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">No attendance data available</p>
            )}
          </ChartCard>
        </motion.div>

        <motion.div variants={item}>
          <ChartCard title="Class Comparison (Marks vs Attendance)">
            {classComparison.length > 0 ? (
              <BarChartComponent data={classComparison} xKey="className" yKey="marks" color="#d97706" height={300} />
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">No data available</p>
            )}
          </ChartCard>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                Top Performing Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topStudents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">#</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Class</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Average %</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attendance %</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {topStudents.map((s, i) => (
                        <tr key={i} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-foreground">{i + 1}</td>
                          <td className="px-4 py-3 text-sm font-medium text-foreground">{s.name}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{s.class}</td>
                          <td className="px-4 py-3">
                            <Badge variant="success">{s.average}%</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={s.attendance >= 85 ? 'success' : 'warning'}>{s.attendance}%</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Button variant="ghost" size="sm" onClick={() => handleGenerateReport(s)}>
                              <FileText className="h-4 w-4 mr-1" />
                              Report
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">No exam results to analyze</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                At-Risk Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              {atRiskStudents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Class</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Average %</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attendance %</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {atRiskStudents.map((s, i) => (
                        <tr key={i} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-foreground">{s.name}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{s.class}</td>
                          <td className="px-4 py-3">
                            <Badge variant={s.average >= 40 ? 'warning' : 'danger'}>{s.average}%</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={s.attendance >= 60 ? 'warning' : 'danger'}>{s.attendance}%</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="danger">{s.reason}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Button variant="ghost" size="sm" onClick={() => handleGenerateReport(s)}>
                              <FileText className="h-4 w-4 mr-1" />
                              Report
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">No at-risk students - great job!</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Student Report Card Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="w-full sm:w-48">
                  <Select
                    label="Class"
                    options={classOptions}
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                  />
                </div>
              </div>

              {filteredStudents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Roll No</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Class</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredStudents.slice(0, 50).map((s) => (
                        <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-foreground">{s.firstName} {s.lastName}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{s.rollNo}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{s.classId}</td>
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleGenerateReport({
                                  name: `${s.firstName} ${s.lastName}`,
                                  class: s.classId,
                                  id: s.id,
                                })
                              }
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Generate Report
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {selectedClass ? 'No students found for selected class' : 'Select a class to view students'}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Student Report Card"
        size="lg"
      >
        {reportStudent && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-4 bg-muted/30">
              <div className="flex items-center gap-3 mb-4">
                <GraduationCap className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="text-lg font-bold text-foreground">School Management System</h3>
                  <p className="text-xs text-muted-foreground">Annual Report Card</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Student:</span>
                  <span className="ml-2 font-medium text-foreground">{reportStudent.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Class:</span>
                  <span className="ml-2 font-medium text-foreground">{reportStudent.class}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Overall Average:</span>
                  <span className="ml-2 font-bold text-primary">{reportStudent.average}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Attendance:</span>
                  <span className="ml-2 font-bold text-primary">{reportStudent.attendance}%</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject</th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Marks Obtained</th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Max Marks</th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Percentage</th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reportStudent.subjects.map((subj) => {
                    const pct = subj.max > 0 ? Math.round((subj.marks / subj.max) * 100) : 0
                    const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'F'
                    return (
                      <tr key={subj.name}>
                        <td className="px-4 py-2 text-sm font-medium text-foreground">{subj.name}</td>
                        <td className="px-4 py-2 text-sm text-muted-foreground">{subj.marks}</td>
                        <td className="px-4 py-2 text-sm text-muted-foreground">{subj.max}</td>
                        <td className="px-4 py-2 text-sm text-muted-foreground">{pct}%</td>
                        <td className="px-4 py-2">
                          <Badge variant={pct >= 60 ? 'success' : pct >= 40 ? 'warning' : 'danger'}>{grade}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setReportModalOpen(false)}>Close</Button>
              <Button variant="primary" onClick={() => { showToast('Report card downloaded', 'success'); setReportModalOpen(false) }}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
