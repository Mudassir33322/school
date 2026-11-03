'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'

interface StudentMark {
  id: string
  rollNo: string
  name: string
  marksObtained: string
  maxMarks: number
  grade: string
  remarks: string
}

interface Subject {
  value: string
  label: string
}

function calculateGrade(percentage: number): string {
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B+'
  if (percentage >= 60) return 'B'
  if (percentage >= 50) return 'C+'
  if (percentage >= 40) return 'C'
  return 'F'
}

export default function MarksEntryPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [students, setStudents] = useState<StudentMark[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [maxMarks, setMaxMarks] = useState(100)

  useEffect(() => {
    if (id) fetchExamData()
  }, [id])

  async function fetchExamData() {
    try {
      setLoading(true)
      const res = await fetch(`/api/exams/${id}`)
      if (!res.ok) throw new Error('Failed to fetch exam data')
      const json = await res.json()
      const exam = json.data ?? json
      if (exam.subjects) {
        setSubjects(exam.subjects.map((s: string) => ({ value: s, label: s })))
        if (exam.subjects.length > 0) setSelectedSubject(exam.subjects[0])
      }
      if (exam.maxMarks) setMaxMarks(exam.maxMarks)
      if (exam.subjects && exam.subjects.length > 0) {
        fetchStudents(exam.subjects[0])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load exam data'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchStudents(subject: string) {
    try {
      const res = await fetch(`/api/exams/${id}/marks?subject=${encodeURIComponent(subject)}`)
      if (res.ok) {
        const json = await res.json()
        setStudents((json.data ?? []).map((s: Partial<StudentMark>) => ({
          id: s.id || '',
          rollNo: s.rollNo || '',
          name: s.name || '',
          marksObtained: s.marksObtained ?? '',
          maxMarks: s.maxMarks || maxMarks,
          grade: s.grade || '',
          remarks: s.remarks || '',
        })))
      } else {
        setStudents([])
      }
    } catch {
      setStudents([])
    }
  }

  function handleSubjectChange(value: string) {
    setSelectedSubject(value)
    fetchStudents(value)
  }

  function handleMarksChange(studentId: string, value: string) {
    const numValue = value === '' ? '' : value
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s
        const marks = numValue === '' ? '' : Number(numValue)
        const percentage = marks !== '' && maxMarks > 0 ? (Number(marks) / maxMarks) * 100 : 0
        const grade = marks !== '' ? calculateGrade(percentage) : ''
        return { ...s, marksObtained: numValue, grade, remarks: grade === 'F' ? 'Fail' : 'Pass' }
      })
    )
  }

  async function handleSave() {
    try {
      setSaving(true)
      const res = await fetch(`/api/exams/${id}/marks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedSubject,
          marks: students.map((s) => ({
            studentId: s.id,
            marksObtained: s.marksObtained === '' ? null : Number(s.marksObtained),
            grade: s.grade,
            remarks: s.remarks,
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

  if (loading) return <Loading text="Loading marks entry..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Marks Entry</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Enter marks for students</p>
          </div>
        </div>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Marks'}
        </Button>
      </div>

      <div className="w-full md:w-72">
        <Select
          label="Select Subject"
          options={subjects}
          value={selectedSubject}
          onChange={(e) => handleSubjectChange(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Marks - {selectedSubject}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Roll No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Marks Obtained</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Max Marks</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Grade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                      No students found for this subject
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {student.rollNo}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {student.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <Input
                          type="number"
                          min="0"
                          max={maxMarks}
                          value={student.marksObtained}
                          onChange={(e) => handleMarksChange(student.id, e.target.value)}
                          className="w-24"
                          placeholder="Marks"
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {maxMarks}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        {student.grade && (
                          <Badge variant={
                            student.grade === 'F' ? 'danger' :
                            student.grade === 'A+' || student.grade === 'A' ? 'success' :
                            'warning'
                          }>
                            {student.grade}
                          </Badge>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {student.remarks || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
