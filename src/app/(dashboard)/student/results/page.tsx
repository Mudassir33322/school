'use client'

import { useState, useEffect, useMemo } from 'react'
import { Download, Trophy, Award, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Select from '@/components/ui/select'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import Table from '@/components/ui/table'

interface ResultRecord {
  id: string
  examId: string
  examName: string
  subject: string
  marks: number
  totalMarks: number
  percentage: number
  grade: string
  remarks?: string
  date: string
  studentId?: string
}

interface GroupedExam {
  examName: string
  subjects: ResultRecord[]
  totalMarks: number
  totalObtained: number
  percentage: number
  grade: string
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

export default function MyResultsPage() {
  const [results, setResults] = useState<ResultRecord[]>([])
  const [allResults, setAllResults] = useState<ResultRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedExam, setSelectedExam] = useState('')

  useEffect(() => {
    fetchResults()
  }, [])

  async function fetchResults() {
    try {
      setLoading(true)
      setError(null)
      const meRes = await fetch('/api/auth/me')
      const meData = await meRes.json()
      const studentId = meData.user?.id || ''
      const [resultsRes, allRes] = await Promise.all([
        fetch(`/api/results?studentId=${studentId}`),
        fetch('/api/results'),
      ])
      if (!resultsRes.ok) throw new Error('Failed to fetch results')
      const resultsJson = await resultsRes.json()
      const myData = (resultsJson.data ?? []) as ResultRecord[]
      setResults(myData)
      if (allRes.ok) {
        const allJson = await allRes.json()
        setAllResults((allJson.data ?? []) as ResultRecord[])
      }
      if (myData.length > 0 && !selectedExam) {
        const firstExam = myData[0].examName
        setSelectedExam(firstExam)
      }
      toast.success('Results loaded')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load results'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const rank = useMemo(() => {
    if (!selectedExam || allResults.length === 0) return null
    const myResult = results.filter((r) => r.examName === selectedExam)
    const myTotal = myResult.reduce((s, r) => s + (r.marks || 0), 0)
    const studentTotals: Record<string, number> = {}
    for (const r of allResults) {
      if (r.examName !== selectedExam) continue
      const sid = r.studentId || 'unknown'
      studentTotals[sid] = (studentTotals[sid] || 0) + (r.marks || 0)
    }
    const sorted = Object.entries(studentTotals).sort((a, b) => b[1] - a[1])
    const myStudentId = results[0]?.studentId || ''
    const pos = sorted.findIndex(([id]) => id === myStudentId)
    return pos >= 0 ? pos + 1 : null
  }, [results, allResults, selectedExam])

  const examOptions = useMemo(() => {
    const names = [...new Set(results.map((r) => r.examName))]
    return names.map((name) => ({ value: name, label: name }))
  }, [results])

  const groupedByExam = useMemo(() => {
    const groups: Record<string, GroupedExam> = {}
    for (const r of results) {
      if (!groups[r.examName]) {
        groups[r.examName] = {
          examName: r.examName,
          subjects: [],
          totalMarks: 0,
          totalObtained: 0,
          percentage: 0,
          grade: 'F',
        }
      }
      groups[r.examName].subjects.push(r)
      groups[r.examName].totalMarks += r.totalMarks || 0
      groups[r.examName].totalObtained += r.marks || 0
    }
    for (const key of Object.keys(groups)) {
      const g = groups[key]
      g.percentage = g.totalMarks > 0 ? Math.round((g.totalObtained / g.totalMarks) * 100) : 0
      g.grade = calculateGrade(g.percentage)
    }
    return groups
  }, [results])

  const currentExam = useMemo(() => {
    return selectedExam ? groupedByExam[selectedExam] : null
  }, [selectedExam, groupedByExam])

  const pastResults = useMemo(() => {
    return Object.values(groupedByExam).sort((a, b) => {
      const dateA = a.subjects[0]?.date || ''
      const dateB = b.subjects[0]?.date || ''
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })
  }, [groupedByExam])

  function handleDownloadReport() {
    if (!currentExam) return
    try {
      import('jspdf').then(({ jsPDF }) => {
        const doc = new jsPDF()
        doc.setFontSize(18)
        doc.text('Report Card', 105, 20, { align: 'center' })
        doc.setFontSize(12)
        doc.text(`Exam: ${currentExam.examName}`, 20, 35)
        doc.text(`Grade: ${currentExam.grade}  |  Percentage: ${currentExam.percentage}%`, 20, 45)
        doc.text(`Total: ${currentExam.totalObtained} / ${currentExam.totalMarks}`, 20, 55)
        doc.setFontSize(10)
        doc.text('Subject', 20, 70)
        doc.text('Marks', 100, 70)
        doc.text('Grade', 140, 70)
        let y = 80
        for (const s of currentExam.subjects) {
          doc.text(s.subject || '-', 20, y)
          doc.text(`${s.marks || 0}`, 100, y)
          doc.text(s.grade || '-', 140, y)
          y += 10
        }
        doc.save(`report-card-${currentExam.examName}.pdf`)
        toast.success('Report card downloaded!')
      }).catch(() => toast.error('Failed to generate PDF'))
    } catch {
      toast.error('Failed to generate PDF')
    }
  }

  const columns = [
    { key: 'subject', label: 'Subject' },
    {
      key: 'marks',
      label: 'Marks Obtained',
      render: (_v: unknown, row: ResultRecord) => row.marks ?? 0,
    },
    {
      key: 'totalMarks',
      label: 'Max Marks',
      render: (_v: unknown, row: ResultRecord) => row.totalMarks ?? 0,
    },
    {
      key: 'grade',
      label: 'Grade',
      render: (_v: unknown, row: ResultRecord) => (
        <Badge variant={row.grade === 'F' ? 'danger' : row.grade === 'A+' || row.grade === 'A' ? 'success' : 'warning'}>
          {row.grade}
        </Badge>
      ),
    },
    { key: 'remarks', label: 'Remarks', render: (_v: unknown, row: ResultRecord) => row.remarks || '-' },
  ]

  if (loading) return <Loading text="Loading results..." />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{error}</p>
        <Button variant="primary" onClick={fetchResults}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Results</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">View your exam results and progress</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="w-full sm:w-72">
          <Select
            label="Select Exam"
            options={examOptions}
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
          />
        </div>
        <Button variant="primary" onClick={handleDownloadReport}>
          <Download className="h-4 w-4 mr-2" />
          Download Report Card
        </Button>
      </div>

      {currentExam && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card variant="stat">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-blue-500" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Marks</p>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {currentExam.totalObtained} / {currentExam.totalMarks}
                </p>
              </div>
            </Card>
            <Card variant="stat">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Percentage</p>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {currentExam.percentage}%
                </p>
              </div>
            </Card>
            <Card variant="stat">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-500" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Grade</p>
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {currentExam.grade}
                </p>
              </div>
            </Card>
            <Card variant="stat">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-orange-500" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Position / Rank</p>
                </div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{rank ? `#${rank}` : '--'}</p>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{selectedExam} - Subject-wise Marks</CardTitle>
            </CardHeader>
            <CardContent>
              <Table columns={columns} data={currentExam.subjects} />
            </CardContent>
          </Card>
        </>
      )}

      {!currentExam && !loading && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
            No results available. Select an exam to view details.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Past Results</CardTitle>
        </CardHeader>
        <CardContent>
          {pastResults.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No past results found</p>
          ) : (
            <div className="space-y-3">
              {pastResults.map((exam) => (
                <div
                  key={exam.examName}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setSelectedExam(exam.examName)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{exam.examName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {exam.subjects.length} subjects | {exam.totalObtained}/{exam.totalMarks}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        exam.percentage >= 80 ? 'success' : exam.percentage >= 40 ? 'warning' : 'danger'
                      }
                    >
                      {exam.grade} - {exam.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
