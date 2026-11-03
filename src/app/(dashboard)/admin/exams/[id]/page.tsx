'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  FileSpreadsheet,
  Download,
  ClipboardCheck,
  BookOpen,
  Calendar,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'

interface Exam {
  id: string
  name: string
  type: string
  classes: string[]
  subjects: string[]
  startDate: string
  endDate: string
  maxMarks: number
  passingMarks: number
  academicYear: string
  status: string
}

interface StudentMark {
  id: string
  rollNo: string
  name: string
  marks: number
  grade: string
}

interface Result {
  id: string
  rank: number
  studentName: string
  rollNo: string
  totalMarks: number
  percentage: number
  grade: string
}

type Tab = 'info' | 'marks' | 'results'

const tabs: { id: Tab; label: string }[] = [
  { id: 'info', label: 'Exam Info' },
  { id: 'marks', label: 'Marks Entry' },
  { id: 'results', label: 'Results' },
]

function calculateGrade(percentage: number): string {
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B+'
  if (percentage >= 60) return 'B'
  if (percentage >= 50) return 'C+'
  if (percentage >= 40) return 'C'
  return 'F'
}

export default function ExamDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [exam, setExam] = useState<Exam | null>(null)
  const [marks, setMarks] = useState<StudentMark[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('info')

  useEffect(() => {
    if (id) fetchExamData()
  }, [id])

  async function fetchExamData() {
    try {
      setLoading(true)
      const res = await fetch(`/api/exams/${id}`)
      if (!res.ok) throw new Error('Failed to fetch exam data')
      const json = await res.json()
      setExam(json.data ?? json)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load exam data'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchMarks() {
    try {
      const res = await fetch(`/api/exams/${id}/marks`)
      if (res.ok) {
        const json = await res.json()
        setMarks(json.data ?? [])
      }
    } catch {
      // silent
    }
  }

  async function fetchResults() {
    try {
      const res = await fetch(`/api/exams/${id}/results`)
      if (res.ok) {
        const json = await res.json()
        setResults(json.data ?? [])
      }
    } catch {
      // silent
    }
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab)
    if (tab === 'marks' && marks.length === 0) fetchMarks()
    if (tab === 'results' && results.length === 0) fetchResults()
  }

  if (loading) return <Loading text="Loading exam details..." />

  if (!exam) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <BookOpen className="h-12 w-12 text-gray-400" />
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Exam not found</p>
        <Button variant="primary" onClick={() => router.push('/admin/exams')}>
          Back to Exams
        </Button>
      </div>
    )
  }

  const statusVariant: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
    Upcoming: 'info',
    'In Progress': 'warning',
    Completed: 'success',
    Cancelled: 'danger',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/admin/exams')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {exam.name}
              </h1>
              <Badge variant={statusVariant[exam.status] || 'default'}>
                {exam.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {exam.type} | {exam.academicYear}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Exam Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {new Date(exam.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">End Date</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {new Date(exam.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Max Marks</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{exam.maxMarks}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Passing Marks</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{exam.passingMarks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Classes & Subjects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Classes</p>
                  <div className="flex flex-wrap gap-2">
                    {exam.classes?.map((cls) => (
                      <span
                        key={cls}
                        className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        Class {cls}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Subjects</p>
                  <div className="flex flex-wrap gap-2">
                    {exam.subjects?.map((subject) => (
                      <span
                        key={subject}
                        className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'marks' && (
        <Card>
          <CardHeader>
            <CardTitle>Marks Entry</CardTitle>
          </CardHeader>
          <CardContent>
            {marks.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardCheck className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No marks entered yet</p>
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={() => router.push(`/admin/exams/${id}/marks`)}
                >
                  Enter Marks
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Roll No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Marks</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                    {marks.map((mark) => (
                      <tr key={mark.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{mark.rollNo}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{mark.name}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{mark.marks}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <Badge variant={
                            mark.grade === 'F' ? 'danger' :
                            mark.grade === 'A+' || mark.grade === 'A' ? 'success' :
                            'warning'
                          }>
                            {mark.grade}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {marks.length > 0 && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/admin/exams/${id}/marks`)}
                >
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Manage Marks
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'results' && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Results</CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-8">
                <FileSpreadsheet className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Results not generated yet</p>
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={() => {
                    toast.success('Results generated (placeholder)')
                  }}
                >
                  Generate Results
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Rank</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Student Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Roll No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Marks</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Percentage</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                    {results.map((result) => (
                      <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold ${
                            result.rank === 1 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            result.rank === 2 ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                            result.rank === 3 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                            'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {result.rank}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{result.studentName}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{result.rollNo}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{result.totalMarks}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{result.percentage}%</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <Badge variant={
                            result.grade === 'F' ? 'danger' :
                            result.grade === 'A+' || result.grade === 'A' ? 'success' :
                            'warning'
                          }>
                            {result.grade}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex items-center gap-3 mt-6">
              <Button
                variant="primary"
                onClick={() => toast.success('Report cards generated (placeholder)')}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Generate Report Cards
              </Button>
              <Button
                variant="outline"
                onClick={() => toast.success('Download started (placeholder)')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Results
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
