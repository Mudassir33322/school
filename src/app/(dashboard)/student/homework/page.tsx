'use client'

import { useState, useEffect, useMemo } from 'react'
import { Clock, Upload, FileText, CheckCircle2, AlertCircle, BookOpen, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Modal from '@/components/ui/modal'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'

interface HomeworkItem {
  id: string
  title: string
  subject: string
  teacher: string
  dueDate: string
  status: string
}

interface Submission {
  homeworkId: string
  text: string
  fileName?: string
  submittedAt: string
  status: 'submitted' | 'graded'
  marks?: number
  grade?: string
  feedback?: string
}

interface PastSubmission {
  homeworkId: string
  title: string
  subject: string
  submittedAt: string
  status: string
  marks?: number
  grade?: string
  feedback?: string
}

type FilterType = 'all' | 'pending' | 'submitted' | 'graded'

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'graded', label: 'Graded' },
]

export default function MyHomeworkPage() {
  const [homeworks, setHomeworks] = useState<HomeworkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [submissions, setSubmissions] = useState<Map<string, Submission>>(new Map())
  const [pastSubmissions, setPastSubmissions] = useState<PastSubmission[]>([])
  const [submitModal, setSubmitModal] = useState<HomeworkItem | null>(null)
  const [submitText, setSubmitText] = useState('')
  const [submitFile, setSubmitFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchHomework()
  }, [])

  async function fetchHomework() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/homework')
      if (!res.ok) throw new Error('Failed to fetch homework')
      const json = await res.json()
      const data = (json.data ?? []) as HomeworkItem[]
      setHomeworks(data)
      toast.success('Homework loaded')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load homework'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const enrichedHomeworks = useMemo(() => {
    return homeworks.map((hw) => {
      const sub = submissions.get(hw.id)
      let displayStatus: 'pending' | 'submitted' | 'graded' = 'pending'
      if (sub) {
        displayStatus = sub.status
      }
      return { ...hw, displayStatus }
    })
  }, [homeworks, submissions])

  const filteredHomeworks = useMemo(() => {
    if (filter === 'all') return enrichedHomeworks
    return enrichedHomeworks.filter((hw) => hw.displayStatus === filter)
  }, [enrichedHomeworks, filter])

  const pendingCount = useMemo(() => {
    return enrichedHomeworks.filter((hw) => hw.displayStatus === 'pending').length
  }, [enrichedHomeworks])

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  function handleOpenSubmit(hw: HomeworkItem) {
    setSubmitModal(hw)
    setSubmitText('')
    setSubmitFile(null)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setSubmitFile(e.target.files[0])
    }
  }

  async function handleSubmitHomework() {
    if (!submitModal) return
    if (!submitText.trim() && !submitFile) {
      toast.error('Please provide your answer or upload a file')
      return
    }

    try {
      setSubmitting(true)
      const meRes = await fetch('/api/auth/me')
      const meData = await meRes.json()
      const studentId = meData.user?.id || ''

      const res = await fetch(`/api/homework/${submitModal.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          submission: submitText,
          remarks: submitFile?.name || '',
        }),
      })

      if (!res.ok) throw new Error('Failed to submit homework')

      const submission: Submission = {
        homeworkId: submitModal.id,
        text: submitText,
        fileName: submitFile?.name,
        submittedAt: new Date().toISOString(),
        status: 'submitted',
      }

      const newSubmissions = new Map(submissions)
      newSubmissions.set(submitModal.id, submission)
      setSubmissions(newSubmissions)

      setPastSubmissions((prev) => [
        {
          homeworkId: submitModal.id,
          title: submitModal.title,
          subject: submitModal.subject,
          submittedAt: submission.submittedAt,
          status: 'submitted',
        },
        ...prev,
      ])

      toast.success('Homework submitted successfully!')
      setSubmitModal(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit homework'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  function getStatusBadge(status: string) {
    if (status === 'graded') return <Badge variant="success">Graded</Badge>
    if (status === 'submitted') return <Badge variant="info">Submitted</Badge>
    return <Badge variant="warning">Pending</Badge>
  }

  if (loading) return <Loading text="Loading homework..." />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{error}</p>
        <Button variant="primary" onClick={fetchHomework}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Homework</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {pendingCount > 0
            ? `You have ${pendingCount} pending homework assignment${pendingCount > 1 ? 's' : ''}`
            : 'All homework completed!'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={filter === opt.value ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter(opt.value)}
          >
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            {opt.label}
            {opt.value === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-white/20 text-white text-xs rounded-full px-1.5 py-0.5">
                {pendingCount}
              </span>
            )}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredHomeworks.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3">
            <Card>
              <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
                No homework found for this filter.
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredHomeworks.map((hw) => {
            const overdue = isOverdue(hw.dueDate) && hw.displayStatus === 'pending'
            const sub = submissions.get(hw.id)
            return (
              <Card key={hw.id} className="flex flex-col">
                <CardContent className="pt-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-semibold text-base truncate ${
                          overdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {overdue && <AlertCircle className="h-4 w-4 inline mr-1 text-red-500" />}
                        {hw.title}
                      </h3>
                    </div>
                    {getStatusBadge(hw.displayStatus)}
                  </div>

                  <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 flex-1">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>{hw.subject}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" />
                      <span>{hw.teacher || 'Teacher'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span className={overdue ? 'text-red-500 font-medium' : ''}>
                        Due: {new Date(hw.dueDate).toLocaleDateString()}
                        {overdue && ' (Overdue)'}
                      </span>
                    </div>
                  </div>

                  {sub?.status === 'graded' && sub.marks !== undefined && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Marks:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {sub.marks} / 100
                        </span>
                      </div>
                      {sub.grade && (
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-gray-500 dark:text-gray-400">Grade:</span>
                          <Badge variant={sub.grade === 'F' ? 'danger' : sub.grade === 'A+' || sub.grade === 'A' ? 'success' : 'warning'}>
                            {sub.grade}
                          </Badge>
                        </div>
                      )}
                      {sub.feedback && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                          Feedback: {sub.feedback}
                        </p>
                      )}
                    </div>
                  )}

                  {hw.displayStatus === 'pending' && (
                    <div className="mt-4">
                      <Button variant="primary" size="sm" className="w-full" onClick={() => handleOpenSubmit(hw)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Submit Homework
                      </Button>
                    </div>
                  )}

                  {sub && sub.status === 'submitted' && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          Submitted on {new Date(sub.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {pastSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastSubmissions.map((sub, idx) => (
                <div
                  key={`${sub.homeworkId}-${idx}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-1.5 rounded-full bg-primary/10 mt-0.5">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{sub.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {sub.subject} - {new Date(sub.submittedAt).toLocaleDateString()}
                      </p>
                      {sub.marks !== undefined && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Marks: {sub.marks} {sub.grade ? `| Grade: ${sub.grade}` : ''}
                        </p>
                      )}
                      {sub.feedback && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic">
                          {sub.feedback}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={sub.status === 'graded' ? 'success' : 'info'}>
                    {sub.status === 'graded' ? 'Graded' : 'Submitted'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Modal isOpen={!!submitModal} onClose={() => setSubmitModal(null)} title={`Submit: ${submitModal?.title || ''}`} size="md">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Answer
            </label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
              placeholder="Type your answer here..."
              value={submitText}
              onChange={(e) => setSubmitText(e.target.value)}
              rows={5}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Upload File (optional)
            </label>
            <Input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.txt,.jpg,.png" />
            {submitFile && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Selected: {submitFile.name} ({(submitFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setSubmitModal(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmitHomework} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
