'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'

interface HomeworkInfo {
  id: string
  title: string
  description: string
  subject: string
  class: string
  section: string
  dueDate: string
  status: string
}

interface Submission {
  id: string
  studentId: string
  rollNo: string
  firstName: string
  lastName: string
  submission: string
  submissionDate: string
  status: string
  marks: string
  grade: string
}

function calculateGrade(marks: number, maxMarks: number): string {
  const percentage = maxMarks > 0 ? (marks / maxMarks) * 100 : 0
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B+'
  if (percentage >= 60) return 'B'
  if (percentage >= 50) return 'C+'
  if (percentage >= 40) return 'C'
  return 'F'
}

export default function HomeworkDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [homework, setHomework] = useState<HomeworkInfo | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [maxMarks] = useState(100)

  useEffect(() => {
    if (id) fetchData()
  }, [id])

  async function fetchData() {
    try {
      setLoading(true)
      const [hwRes, subRes] = await Promise.all([
        fetch(`/api/homework/${id}`),
        fetch(`/api/homework/${id}/submissions`),
      ])

      if (!hwRes.ok) throw new Error('Failed to fetch homework')
      const hwJson = await hwRes.json()
      setHomework(hwJson.data ?? hwJson)

      if (subRes.ok) {
        const subJson = await subRes.json()
        setSubmissions((subJson.data ?? []).map((s: Partial<Submission>) => ({
          id: s.id || '',
          studentId: s.studentId || '',
          rollNo: s.rollNo || '',
          firstName: s.firstName || '',
          lastName: s.lastName || '',
          submission: s.submission || '',
          submissionDate: s.submissionDate || '',
          status: s.status || '',
          marks: s.marks ?? '',
          grade: s.grade || '',
        })))
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load homework data'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  function handleMarksChange(studentId: string, value: string) {
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.studentId !== studentId) return s
        const marks = value === '' ? '' : value
        const marksNum = marks === '' ? 0 : Number(marks)
        const grade = marks !== '' ? calculateGrade(marksNum, maxMarks) : ''
        return { ...s, marks, grade }
      })
    )
  }

  async function handleSaveMarks() {
    try {
      setSaving(true)
      const res = await fetch(`/api/homework/${id}/marks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marks: submissions.map((s) => ({
            studentId: s.studentId,
            marks: s.marks === '' ? null : Number(s.marks),
            grade: s.grade,
          })),
        }),
      })
      if (!res.ok) throw new Error('Failed to save marks')
      toast.success('Marks saved successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save marks'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading text="Loading homework details..." />

  if (!homework) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Homework not found</p>
        <Button variant="primary" onClick={() => router.push('/teacher/homework')}>
          Back to Homework
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/teacher/homework')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{homework.title}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {homework.subject} - Class {homework.class} ({homework.section})
            </p>
          </div>
        </div>
        <Badge
          variant={
            homework.status === 'Active' ? 'info' :
            homework.status === 'Completed' ? 'success' : 'danger'
          }
        >
          {homework.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Homework Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {homework.description || 'No description provided'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            Due Date: {new Date(homework.dueDate).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Student Submissions</CardTitle>
            <Button variant="primary" onClick={handleSaveMarks} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Marks'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No submissions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Roll No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Submission</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Marks</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{sub.rollNo}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {sub.firstName} {sub.lastName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {sub.submission ? (
                          <a href={sub.submission} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            View
                          </a>
                        ) : '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <Badge variant={sub.status === 'Submitted' ? 'success' : sub.status === 'Late' ? 'warning' : 'danger'}>
                          {sub.status || 'Pending'}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <Input
                          type="number"
                          min="0"
                          max={maxMarks}
                          value={sub.marks}
                          onChange={(e) => handleMarksChange(sub.studentId, e.target.value)}
                          className="w-24"
                          placeholder="Marks"
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        {sub.grade && (
                          <Badge variant={
                            sub.grade === 'F' ? 'danger' :
                            sub.grade === 'A+' || sub.grade === 'A' ? 'success' :
                            'warning'
                          }>
                            {sub.grade}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
