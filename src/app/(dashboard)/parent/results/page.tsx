'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { showToast } from '@/components/ui/toast'
import Select from '@/components/ui/select'
import {
  GraduationCap,
  Download,
  Medal,
  TrendingUp,
  BookOpen,
  Users,
  Award,
} from 'lucide-react'
import type { Student, Exam, ExamResult, Subject } from '@/types'

interface ResultWithSubject extends ExamResult {
  subjectName?: string
}

export default function ResultsPage() {
  const [children, setChildren] = useState<Student[]>([])
  const [selectedChild, setSelectedChild] = useState('')
  const [exams, setExams] = useState<Exam[]>([])
  const [selectedExam, setSelectedExam] = useState('')
  const [results, setResults] = useState<ResultWithSubject[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [resultsLoading, setResultsLoading] = useState(false)

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const res = await fetch('/api/parent/children')
        if (!res.ok) throw new Error('Failed to fetch children')
        const data = await res.json()
        const list = Array.isArray(data) ? data : data.children ?? []
        setChildren(list)
        if (list.length === 1) setSelectedChild(list[0].id)
      } catch {
        showToast('Failed to load children', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchChildren()
  }, [])

  useEffect(() => {
    if (!selectedChild) return
    const fetchExams = async () => {
      try {
        const res = await fetch(`/api/parent/children/${selectedChild}/exams`)
        if (!res.ok) throw new Error('Failed to fetch exams')
        const data = await res.json()
        const list = Array.isArray(data) ? data : data.exams ?? []
        setExams(list)
        if (list.length > 0) setSelectedExam(list[0].id)
      } catch {
        showToast('Failed to load exams', 'error')
        setExams([])
      }
    }
    fetchExams()
  }, [selectedChild])

  useEffect(() => {
    if (!selectedChild || !selectedExam) return
    const fetchResults = async () => {
      setResultsLoading(true)
      try {
        const [resResults, resSubjects] = await Promise.all([
          fetch(`/api/parent/children/${selectedChild}/results?examId=${selectedExam}`),
          fetch('/api/subjects'),
        ])
        if (!resResults.ok) throw new Error('Failed to fetch results')
        const resultsData = await resResults.json()
        const resultsList = Array.isArray(resultsData) ? resultsData : resultsData.results ?? []
        if (resSubjects.ok) {
          const subjectsData = await resSubjects.json()
          const subjectsList = Array.isArray(subjectsData) ? subjectsData : subjectsData.subjects ?? []
          setSubjects(subjectsList)
          const subjectMap = new Map(subjectsList.map((s: Subject) => [s.id, s.name]))
          setResults(
            resultsList.map((r: ExamResult) => ({
              ...r,
              subjectName: subjectMap.get(r.subjectId) || r.subjectId,
            }))
          )
        } else {
          setResults(resultsList)
        }
      } catch {
        showToast('Failed to load results', 'error')
        setResults([])
      } finally {
        setResultsLoading(false)
      }
    }
    fetchResults()
  }, [selectedChild, selectedExam])

  const totalMarks = results.reduce((s, r) => s + r.marksObtained, 0)
  const totalMaxMarks = results.reduce((s, r) => s + r.maxMarks, 0)
  const percentage = totalMaxMarks ? Math.round((totalMarks / totalMaxMarks) * 100) : 0

  const gradeLetter = (pct: number) => {
    if (pct >= 90) return { grade: 'A+', variant: 'success' as const }
    if (pct >= 80) return { grade: 'A', variant: 'success' as const }
    if (pct >= 70) return { grade: 'B+', variant: 'info' as const }
    if (pct >= 60) return { grade: 'B', variant: 'info' as const }
    if (pct >= 50) return { grade: 'C', variant: 'warning' as const }
    if (pct >= 40) return { grade: 'D', variant: 'warning' as const }
    return { grade: 'F', variant: 'danger' as const }
  }

  const currentGrade = gradeLetter(percentage)

  const getGradeVariant = (marks: number, max: number) => {
    const pct = (marks / max) * 100
    return gradeLetter(pct).variant
  }

  const getGrade = (marks: number, max: number) => {
    return gradeLetter((marks / max) * 100).grade
  }

  const handleDownload = () => {
    if (results.length === 0) {
      showToast('No results to download', 'error')
      return
    }
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF()
      const childName = children.find(c => c.id === selectedChild)
      doc.setFontSize(18)
      doc.text('Report Card', 105, 20, { align: 'center' })
      doc.setFontSize(12)
      doc.text(`Student: ${childName ? `${childName.firstName} ${childName.lastName}` : selectedChild}`, 20, 35)
      doc.text(`Exam: ${exams.find(e => e.id === selectedExam)?.name || selectedExam}`, 20, 45)
      doc.text(`Total: ${totalMarks} / ${totalMaxMarks}  |  Percentage: ${percentage}%  |  Grade: ${currentGrade.grade}`, 20, 55)
      doc.setFontSize(10)
      doc.text('Subject', 20, 70)
      doc.text('Marks', 100, 70)
      doc.text('Grade', 140, 70)
      let y = 80
      for (const r of results) {
        doc.text(r.subjectName || r.subjectId, 20, y)
        doc.text(`${r.marksObtained}`, 100, y)
        doc.text(getGrade(r.marksObtained, r.maxMarks), 140, y)
        y += 10
      }
      doc.save(`report-card-${selectedChild}.pdf`)
      showToast('Report card downloaded!', 'success')
    }).catch(() => showToast('Failed to generate PDF', 'error'))
  }

  if (loading) {
    return <Loading message="Loading results..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-6 w-6 text-gray-500 dark:text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Exam Results
        </h1>
      </div>

      {children.length > 1 && (
        <div className="max-w-xs">
          <Select
            label="Select Child"
            options={children.map((c) => ({
              value: c.id,
              label: `${c.firstName} ${c.lastName} (${c.classId})`,
            }))}
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
          />
        </div>
      )}

      {!selectedChild && children.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Select a child to view results
            </p>
          </CardContent>
        </Card>
      ) : !selectedChild ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              No children linked to your account
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {exams.length > 0 && (
            <div className="max-w-xs">
              <Select
                label="Select Exam"
                options={exams.map((e) => ({
                  value: e.id,
                  label: `${e.name} (${e.type})`,
                }))}
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
              />
            </div>
          )}

          {resultsLoading ? (
            <Loading message="Loading results..." />
          ) : results.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  No results available for this exam
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-3">
                <Card variant="stat">
                  <CardContent className="flex flex-col items-center text-center">
                    <TrendingUp className="mb-2 h-8 w-8 text-blue-500" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {totalMarks}/{totalMaxMarks}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Marks</p>
                  </CardContent>
                </Card>
                <Card variant="stat">
                  <CardContent className="flex flex-col items-center text-center">
                    <Award className="mb-2 h-8 w-8 text-green-500" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {percentage}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Percentage</p>
                  </CardContent>
                </Card>
                <Card variant="stat">
                  <CardContent className="flex flex-col items-center text-center">
                    <Medal className="mb-2 h-8 w-8 text-yellow-500" />
                    <Badge
                      variant={currentGrade.variant}
                      className="mb-1 px-3 py-1 text-lg"
                    >
                      {currentGrade.grade}
                    </Badge>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Grade</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Subject-wise Results</CardTitle>
                  <CardDescription>Marks and grades per subject</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Subject
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Marks
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Grade
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                        {results.map((r) => (
                          <tr
                            key={r.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                              {r.subjectName || r.subjectId}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                              <span
                                className={
                                  r.marksObtained >= r.maxMarks * 0.4
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                }
                              >
                                {r.marksObtained}/{r.maxMarks}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                              <Badge variant={getGradeVariant(r.marksObtained, r.maxMarks)}>
                                {r.grade || getGrade(r.marksObtained, r.maxMarks)}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button variant="primary" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Report Card
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
