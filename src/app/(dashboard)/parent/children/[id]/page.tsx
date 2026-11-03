'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { showToast } from '@/components/ui/toast'
import {
  User, CalendarCheck, GraduationCap, DollarSign, FileText, Bell,
  ArrowLeft, BookOpen, Calendar, CheckCircle2, AlertCircle, Clock,
  ChartBar,
} from 'lucide-react'
import Link from 'next/link'
import type { Student, Attendance, ExamResult, Fee, Homework, Notice } from '@/types'

interface ChildDetail {
  student: Student | null
  attendance: Attendance[]
  examResults: ExamResult[]
  fees: Fee[]
  homework: Homework[]
  notices: Notice[]
}

type Tab = 'overview' | 'attendance' | 'results' | 'fees'

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: ChartBar },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'results', label: 'Results', icon: GraduationCap },
  { id: 'fees', label: 'Fees', icon: DollarSign },
]

export default function ChildDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [data, setData] = useState<ChildDetail>({
    student: null, attendance: [], examResults: [], fees: [], homework: [], notices: [],
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  useEffect(() => {
    if (!id) return
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/parent/children/${id}`)
        if (!res.ok) throw new Error('Failed to load child details')
        const result = await res.json()
        setData({
          student: result.student ?? null,
          attendance: result.attendance ?? [],
          examResults: result.examResults ?? [],
          fees: result.fees ?? [],
          homework: result.homework ?? [],
          notices: result.notices ?? [],
        })
      } catch {
        showToast('Failed to load child details', 'error')
      } finally { setLoading(false) }
    }
    fetchData()
  }, [id])

  if (loading) return <Loading message="Loading child details..." />
  if (!data.student) return (
    <div className="flex flex-col items-center justify-center py-20">
      <AlertCircle className="mb-4 h-12 w-12 text-danger" />
      <p className="text-lg font-medium text-foreground">Student not found</p>
      <Link href="/parent/children"><Button variant="outline" className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" />Back to Children</Button></Link>
    </div>
  )

  const { student, attendance, examResults, fees, homework, notices } = data
  const attPresent = attendance.filter((a) => a.status === 'Present').length
  const attAbsent = attendance.filter((a) => a.status === 'Absent').length
  const attLate = attendance.filter((a) => a.status === 'Late').length
  const attTotal = attendance.length
  const attPct = attTotal ? Math.round((attPresent / attTotal) * 100) : 0
  const pendingFees = fees.filter((f) => f.status !== 'Paid')
  const totalDue = pendingFees.reduce((s, f) => s + (f.amount - f.paidAmount), 0)
  const totalPaid = fees.filter((f) => f.status === 'Paid').reduce((s, f) => s + f.paidAmount, 0)
  const avgMarks = examResults.length ? Math.round(examResults.reduce((s, r) => s + (r.marksObtained / r.maxMarks) * 100, 0) / examResults.length) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/parent/children" className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Child Profile</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col items-center gap-4 bg-gradient-to-r from-primary-light to-accent-light p-6 sm:flex-row dark:from-primary-light/10 dark:to-accent-light/10">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white shadow-md border-2 border-white">
              {student.photo ? (
                <img src={student.photo} alt={`${student.firstName} ${student.lastName}`} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-primary" />
              )}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-foreground">{student.firstName} {student.lastName}</h2>
              <p className="text-sm text-muted-foreground">Class {student.classId} | Section {student.sectionId}</p>
              <div className="mt-1 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Badge variant="info">Roll No: {student.rollNo}</Badge>
                <Badge variant={student.status === 'Active' ? 'success' : 'outline'}>{student.status}</Badge>
              </div>
            </div>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-3">
            <div><p className="text-xs text-muted-foreground">Admission No</p><p className="text-sm font-medium text-foreground">{student.admissionNo}</p></div>
            <div><p className="text-xs text-muted-foreground">Gender</p><p className="text-sm font-medium text-foreground">{student.gender}</p></div>
            <div><p className="text-xs text-muted-foreground">Date of Birth</p><p className="text-sm font-medium text-foreground">{student.dob}</p></div>
            <div><p className="text-xs text-muted-foreground">Guardian</p><p className="text-sm font-medium text-foreground">{student.guardianName} ({student.guardianRelation})</p></div>
            <div><p className="text-xs text-muted-foreground">Guardian Phone</p><p className="text-sm font-medium text-foreground">{student.guardianPhone}</p></div>
            <div><p className="text-xs text-muted-foreground">Guardian Email</p><p className="text-sm font-medium text-foreground">{student.guardianEmail}</p></div>
          </div>
        </CardContent>
      </Card>

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

      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><CalendarCheck className="h-5 w-5 text-primary" /><CardTitle>Attendance Summary</CardTitle></div>
              <CardDescription>Overall attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-center">
                <div className="relative flex h-24 w-24 items-center justify-center">
                  <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3"
                      strokeDasharray={`${attPct} ${100 - attPct}`} strokeLinecap="round" className="text-primary" />
                  </svg>
                  <span className="absolute text-lg font-bold text-foreground">{attPct}%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-accent" />Present</span>
                  <span className="font-medium text-foreground">{attPresent}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground"><AlertCircle className="h-4 w-4 text-danger" />Absent</span>
                  <span className="font-medium text-foreground">{attAbsent}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4 text-warning" />Late</span>
                  <span className="font-medium text-foreground">{attLate}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-accent" /><CardTitle>Recent Exam Results</CardTitle></div>
              <CardDescription>Latest exam performance</CardDescription>
            </CardHeader>
            <CardContent>
              {examResults.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No exam results available</p>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-foreground">{avgMarks}%</p>
                      <p className="text-sm text-muted-foreground">Average Score</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {examResults.slice(0, 5).map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                        <span className="font-medium text-foreground">{r.subjectId}</span>
                        <span className={`font-semibold ${r.marksObtained >= r.maxMarks * 0.4 ? 'text-accent' : 'text-danger'}`}>
                          {r.marksObtained}/{r.maxMarks}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /><CardTitle>Fee Status</CardTitle></div>
              <CardDescription>Outstanding fees and payments</CardDescription>
            </CardHeader>
            <CardContent>
              {fees.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No fee records found</p>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-center gap-8">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-accent">${totalPaid.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Paid</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-danger">${totalDue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Due</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {fees.slice(0, 5).map((f) => (
                      <div key={f.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                        <div>
                          <p className="font-medium text-foreground">{f.category}</p>
                          <p className="text-xs text-muted-foreground">Due: {f.dueDate}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">${f.paidAmount.toLocaleString()}</p>
                          <Badge variant={f.status === 'Paid' ? 'success' : f.status === 'Partial' ? 'warning' : 'danger'}>{f.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-warning" /><CardTitle>Homework Due</CardTitle></div>
              <CardDescription>Pending assignments and homework</CardDescription>
            </CardHeader>
            <CardContent>
              {homework.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No pending homework</p>
              ) : (
                <div className="space-y-3">
                  {homework.map((h) => (
                    <div key={h.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-foreground">{h.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {h.description.length > 80 ? `${h.description.substring(0, 80)}...` : h.description}
                          </p>
                        </div>
                        <Badge variant={h.status === 'Active' ? 'warning' : 'success'}>{h.status}</Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" /> Due: {h.dueDate}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Attendance Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-accent-light">
                  <p className="text-2xl font-bold text-accent">{attPct}%</p>
                  <p className="text-sm text-muted-foreground mt-1">Present</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-danger/10">
                  <p className="text-2xl font-bold text-danger">{attAbsent}</p>
                  <p className="text-sm text-muted-foreground mt-1">Absent</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-amber-50">
                  <p className="text-2xl font-bold text-warning">{attLate}</p>
                  <p className="text-sm text-muted-foreground mt-1">Late</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-primary-light">
                  <p className="text-2xl font-bold text-primary">{attTotal}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total Days</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recent Attendance</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {attendance.slice(-30).reverse().map((record) => (
                      <tr key={record.id} className="hover:bg-muted/50 transition-colors">
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <Badge variant={record.status === 'Present' ? 'success' : record.status === 'Late' ? 'warning' : 'danger'}>{record.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'results' && (
        <Card>
          <CardHeader><CardTitle>Exam Results</CardTitle></CardHeader>
          <CardContent>
            {examResults.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No exam results available</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Marks</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {examResults.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">{r.subjectId}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">{r.marksObtained}/{r.maxMarks}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <Badge variant={r.marksObtained >= r.maxMarks * 0.7 ? 'success' : r.marksObtained >= r.maxMarks * 0.4 ? 'warning' : 'danger'}>
                            {r.grade || (r.marksObtained >= r.maxMarks * 0.7 ? 'A' : r.marksObtained >= r.maxMarks * 0.4 ? 'C' : 'F')}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'fees' && (
        <Card>
          <CardHeader><CardTitle>Fee History</CardTitle></CardHeader>
          <CardContent>
            {fees.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No fee records found</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paid</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {fees.map((f) => (
                      <tr key={f.id} className="hover:bg-muted/50 transition-colors">
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">{f.category}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">${f.amount.toLocaleString()}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">${f.paidAmount.toLocaleString()}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">{f.dueDate}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <Badge variant={f.status === 'Paid' ? 'success' : f.status === 'Partial' ? 'warning' : 'danger'}>{f.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
