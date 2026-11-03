'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, User, BookOpen, ClipboardCheck, FileText, GraduationCap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import Table from '@/components/ui/table'

interface Student {
  id: string; firstName: string; lastName: string; admissionNo: string
  rollNo: string; class: string; section: string; status: string
  photo?: string; gender?: string; dob?: string; bloodGroup?: string
  guardianName?: string; guardianRelation?: string; guardianPhone?: string
  guardianEmail?: string; address?: string; city?: string; state?: string
}

interface AttendanceRecord { id: string; date: string; status: string }
interface MarkRecord { id: string; subject: string; examName: string; marksObtained: number; maxMarks: number; grade: string }
interface HomeworkSubmission { id: string; title: string; subject: string; dueDate: string; submittedDate: string; status: string }

type Tab = 'attendance' | 'marks' | 'homework'

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'attendance', label: 'Attendance Records', icon: ClipboardCheck },
  { id: 'marks', label: 'Marks/Grades', icon: BookOpen },
  { id: 'homework', label: 'Homework', icon: FileText },
]

export default function StudentDetailPage() {
  const params = useParams(); const router = useRouter()
  const id = params?.id as string
  const [student, setStudent] = useState<Student | null>(null)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [marks, setMarks] = useState<MarkRecord[]>([])
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('attendance')

  useEffect(() => { if (id) fetchStudentData() }, [id])

  async function fetchStudentData() {
    try {
      setLoading(true)
      const [studentRes, attendanceRes, marksRes, homeworkRes] = await Promise.all([
        fetch(`/api/students/${id}`), fetch(`/api/attendance?studentId=${id}`),
        fetch(`/api/marks?studentId=${id}`), fetch(`/api/homework/submissions?studentId=${id}`),
      ])
      if (!studentRes.ok) throw new Error('Failed to fetch student data')
      const studentJson = await studentRes.json()
      setStudent(studentJson.data ?? studentJson)
      if (attendanceRes.ok) { const j = await attendanceRes.json(); setAttendance(j.data ?? []) }
      if (marksRes.ok) { const j = await marksRes.json(); setMarks(j.data ?? []) }
      if (homeworkRes.ok) { const j = await homeworkRes.json(); setSubmissions(j.data ?? []) }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load student data')
    } finally { setLoading(false) }
  }

  if (loading) return <Loading message="Loading student profile..." />
  if (!student) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <GraduationCap className="h-12 w-12 text-muted-foreground" />
      <p className="text-lg font-medium text-foreground">Student not found</p>
      <Button variant="primary" onClick={() => router.push('/teacher/students')}>Back to Students</Button>
    </div>
  )

  const s = student
  const presentCount = attendance.filter((a) => a.status === 'Present').length
  const totalAttendance = attendance.length
  const presentPercent = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/teacher/students')}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex items-center gap-4">
          {s.photo ? (
            <img src={s.photo} alt={`${s.firstName} ${s.lastName}`} loading="lazy" className="h-14 w-14 rounded-full object-cover border-2 border-border" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-lg font-bold text-primary">
              {s.firstName?.charAt(0)}{s.lastName?.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-foreground">{s.firstName} {s.lastName}</h1>
              <Badge variant={s.status === 'Active' ? 'success' : 'danger'}>{s.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Roll: {s.rollNo} | Class {s.class} - {s.section}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="compact">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-light">
              <ClipboardCheck className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Attendance</p>
              <p className="text-lg font-bold text-foreground">{presentPercent}%</p>
            </div>
          </div>
        </Card>
        <Card variant="compact">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Subjects</p>
              <p className="text-lg font-bold text-foreground">{marks.length}</p>
            </div>
          </div>
        </Card>
        <Card variant="compact">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <FileText className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Homework</p>
              <p className="text-lg font-bold text-foreground">{submissions.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="border-b border-border">
        <nav className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              ><Icon className="h-4 w-4" />{tab.label}</button>
            )
          })}
        </nav>
      </div>

      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Attendance Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-accent-light">
                  <p className="text-2xl font-bold text-accent">{presentPercent}%</p>
                  <p className="text-sm text-muted-foreground mt-1">Present</p>
                  <p className="text-xs text-muted-foreground/70">{presentCount} days</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-danger/10">
                  <p className="text-2xl font-bold text-danger">{totalAttendance - presentCount}</p>
                  <p className="text-sm text-muted-foreground mt-1">Absent</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-primary-light">
                  <p className="text-2xl font-bold text-primary">{totalAttendance}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total Days</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Attendance Records</CardTitle></CardHeader>
            <CardContent>
              <Table
                columns={[
                  { key: 'date', label: 'Date', render: (v) => new Date(v as string).toLocaleDateString() },
                  { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'Present' ? 'success' : v === 'Late' ? 'warning' : 'danger'}>{v as string}</Badge> },
                ]}
                data={attendance.slice(-30).reverse()}
                emptyMessage="No attendance records found"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'marks' && (
        <Card>
          <CardHeader><CardTitle>Marks / Grades</CardTitle></CardHeader>
          <CardContent>
            <Table
              columns={[
                { key: 'examName', label: 'Exam' },
                { key: 'subject', label: 'Subject' },
                { key: 'marksObtained', label: 'Marks', render: (_, row) => `${row.marksObtained} / ${row.maxMarks}` },
                { key: 'grade', label: 'Grade', render: (v) => {
                  const g = v as string
                  return <Badge variant={g === 'F' ? 'danger' : g === 'A+' || g === 'A' ? 'success' : 'warning'}>{g}</Badge>
                }},
              ]}
              data={marks}
              emptyMessage="No marks records found"
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'homework' && (
        <Card>
          <CardHeader><CardTitle>Homework Submissions</CardTitle></CardHeader>
          <CardContent>
            <Table
              columns={[
                { key: 'title', label: 'Title' },
                { key: 'subject', label: 'Subject' },
                { key: 'dueDate', label: 'Due Date', render: (v) => new Date(v as string).toLocaleDateString() },
                { key: 'submittedDate', label: 'Submitted', render: (v) => v ? new Date(v as string).toLocaleDateString() : '-' },
                { key: 'status', label: 'Status', render: (v) => {
                  const st = v as string
                  return <Badge variant={st === 'Submitted' ? 'success' : st === 'Late' ? 'warning' : 'danger'}>{st}</Badge>
                }},
              ]}
              data={submissions}
              emptyMessage="No homework submissions found"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
