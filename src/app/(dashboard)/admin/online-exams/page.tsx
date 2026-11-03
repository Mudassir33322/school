'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  FileText,
  Clock,
  Award,
  BarChart3,
  Trash2,
  Eye,
  X,
  Check,
  HelpCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Modal from '@/components/ui/modal'
import Table from '@/components/ui/table'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'

interface Question {
  id: string
  questionText: string
  type: 'MCQ' | 'True/False' | 'Short Answer'
  options: string[]
  correctAnswer: string
  marks: number
}

interface OnlineExam {
  id: string
  title: string
  description: string
  class: string
  totalMarks: number
  duration: number
  startDate: string
  endDate: string
  passingMarks: number
  shuffle: boolean
  showResults: boolean
  status: 'Draft' | 'Active' | 'Completed'
  questions: Question[]
}

interface ExamResult {
  id: string
  studentName: string
  marks: number
  totalMarks: number
  grade: string
  timeTaken: number
}

interface Stats {
  totalExams: number
  activeExams: number
  completedExams: number
  averageScore: number
}

const classOptions = [
  { value: '1', label: 'Class 1' },
  { value: '2', label: 'Class 2' },
  { value: '3', label: 'Class 3' },
  { value: '4', label: 'Class 4' },
  { value: '5', label: 'Class 5' },
  { value: '6', label: 'Class 6' },
  { value: '7', label: 'Class 7' },
  { value: '8', label: 'Class 8' },
  { value: '9', label: 'Class 9' },
  { value: '10', label: 'Class 10' },
  { value: '11', label: 'Class 11' },
  { value: '12', label: 'Class 12' },
]

const questionTypeOptions = [
  { value: 'MCQ', label: 'Multiple Choice' },
  { value: 'True/False', label: 'True / False' },
  { value: 'Short Answer', label: 'Short Answer' },
]

const statusVariant: Record<string, 'warning' | 'success' | 'info' | 'danger' | 'outline'> = {
  Draft: 'warning',
  Active: 'info',
  Completed: 'success',
}

const emptyQuestion: Question = {
  id: '',
  questionText: '',
  type: 'MCQ',
  options: ['', ''],
  correctAnswer: '',
  marks: 1,
}

export default function OnlineExamsPage() {
  const [exams, setExams] = useState<OnlineExam[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showQuestionsModal, setShowQuestionsModal] = useState(false)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [selectedExam, setSelectedExam] = useState<OnlineExam | null>(null)
  const [results, setResults] = useState<ExamResult[]>([])
  const [resultsLoading, setResultsLoading] = useState(false)
  const [stats, setStats] = useState<Stats>({ totalExams: 0, activeExams: 0, completedExams: 0, averageScore: 0 })
  const [creating, setCreating] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([{ ...emptyQuestion }])

  const [form, setForm] = useState({
    title: '',
    description: '',
    class: '',
    totalMarks: '100',
    duration: '60',
    startDate: '',
    endDate: '',
    passingMarks: '40',
    shuffle: true,
    showResults: false,
  })

  const fetchExams = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/online-exams?${params}`)
      if (!res.ok) throw new Error('Failed to fetch exams')
      const json = await res.json()
      const data = json.data ?? []
      setExams(data)
      const active = data.filter((e: OnlineExam) => e.status === 'Active').length
      const completed = data.filter((e: OnlineExam) => e.status === 'Completed').length
      const scores = data.filter((e: OnlineExam) => e.status === 'Completed').reduce((s: number, e: OnlineExam) => s + e.passingMarks, 0)
      const avg = completed > 0 ? Math.round(scores / completed) : 0
      setStats({ totalExams: data.length, activeExams: active, completedExams: completed, averageScore: avg })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load exams')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchExams() }, [fetchExams])

  function resetForm() {
    setForm({ title: '', description: '', class: '', totalMarks: '100', duration: '60', startDate: '', endDate: '', passingMarks: '40', shuffle: true, showResults: false })
    setQuestions([{ ...emptyQuestion }])
  }

  function addQuestion() {
    setQuestions([...questions, { ...emptyQuestion }])
  }

  function removeQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  function updateQuestion(index: number, field: string, value: unknown) {
    const updated = questions.map((q, i) => {
      if (i !== index) return q
      return { ...q, [field]: value }
    })
    setQuestions(updated)
  }

  function updateOption(qIndex: number, optIndex: number, value: string) {
    const updated = questions.map((q, i) => {
      if (i !== qIndex) return q
      const options = [...q.options]
      options[optIndex] = value
      return { ...q, options }
    })
    setQuestions(updated)
  }

  function addOption(qIndex: number) {
    const updated = questions.map((q, i) => {
      if (i !== qIndex) return q
      return { ...q, options: [...q.options, ''] }
    })
    setQuestions(updated)
  }

  function removeOption(qIndex: number, optIndex: number) {
    const updated = questions.map((q, i) => {
      if (i !== qIndex) return q
      return { ...q, options: q.options.filter((_, oi) => oi !== optIndex) }
    })
    setQuestions(updated)
  }

  async function handleCreateExam() {
    if (!form.title || !form.class || !form.startDate || !form.endDate) {
      toast.error('Please fill in required fields')
      return
    }
    const validQuestions = questions.filter(q => q.questionText && q.correctAnswer && q.marks > 0)
    if (validQuestions.length === 0) {
      toast.error('Add at least one valid question')
      return
    }
    try {
      setCreating(true)
      const res = await fetch('/api/online-exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          totalMarks: Number(form.totalMarks),
          duration: Number(form.duration),
          passingMarks: Number(form.passingMarks),
          questions: validQuestions,
          status: 'Draft',
        }),
      })
      if (!res.ok) throw new Error('Failed to create exam')
      toast.success('Online exam created successfully')
      setShowCreateModal(false)
      resetForm()
      fetchExams()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create exam')
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteExam(id: string) {
    if (!confirm('Delete this exam? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/online-exams/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Exam deleted')
      fetchExams()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  async function handleStartExam(id: string) {
    try {
      const res = await fetch(`/api/online-exams/${id}/start`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Exam activated')
      fetchExams()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to activate')
    }
  }

  function viewQuestions(exam: OnlineExam) {
    setSelectedExam(exam)
    setShowQuestionsModal(true)
  }

  async function viewResults(exam: OnlineExam) {
    setSelectedExam(exam)
    setShowResultsModal(true)
    setResultsLoading(true)
    try {
      const res = await fetch(`/api/online-exams/${exam.id}/results`)
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setResults(json.data ?? [])
    } catch {
      setResults([])
      toast.error('Failed to load results')
    } finally {
      setResultsLoading(false)
    }
  }

  const columns = [
    { key: 'title', label: 'Title', render: (_: unknown, row: OnlineExam) => <span className="font-medium">{row.title}</span> },
    { key: 'class', label: 'Class', render: (_: unknown, row: OnlineExam) => `Class ${row.class}` },
    { key: 'totalMarks', label: 'Total Marks' },
    { key: 'duration', label: 'Duration (min)' },
    {
      key: 'startDate',
      label: 'Start',
      render: (_: unknown, row: OnlineExam) => new Date(row.startDate).toLocaleDateString(),
    },
    {
      key: 'endDate',
      label: 'End',
      render: (_: unknown, row: OnlineExam) => new Date(row.endDate).toLocaleDateString(),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_: unknown, row: OnlineExam) => (
        <Badge variant={statusVariant[row.status] || 'outline'}>{row.status}</Badge>
      ),
    },
  ]

  const summaryCards = [
    { label: 'Total Exams', value: stats.totalExams, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Active Exams', value: stats.activeExams, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { label: 'Completed', value: stats.completedExams, icon: Award, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Avg Score', value: `${stats.averageScore}%`, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  ]

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Active', label: 'Active' },
    { value: 'Completed', label: 'Completed' },
  ]

  const resultsColumns = [
    { key: 'studentName', label: 'Student Name' },
    { key: 'marks', label: 'Marks', render: (_: unknown, row: ExamResult) => `${row.marks} / ${row.totalMarks}` },
    { key: 'grade', label: 'Grade' },
    { key: 'timeTaken', label: 'Time Taken', render: (_: unknown, row: ExamResult) => `${row.timeTaken} min` },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Online Exams / CBT</h1>
          <p className="text-muted-foreground mt-1">Manage computer-based tests and examinations</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> Create Exam
        </Button>
      </motion.div>

      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
        initial="hidden" animate="show">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <motion.div key={card.label} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
              <Card variant="stat">
                <div className={`p-2.5 rounded-lg w-fit ${card.bg}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-48">
                <Select
                  label="Status Filter"
                  options={statusOptions}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button variant="primary" onClick={fetchExams}>
                  Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {loading ? (
        <Loading text="Loading exams..." />
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle>Exam List</CardTitle>
            </CardHeader>
            <CardContent>
              <Table
                columns={columns}
                data={exams}
                loading={false}
                actions={(row: OnlineExam) => (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => viewQuestions(row)} title="View Questions">
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                    {(row.status === 'Active' || row.status === 'Completed') && (
                      <Button variant="ghost" size="sm" onClick={() => viewResults(row)} title="View Results">
                        {row.status === 'Active' ? <Eye className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                      </Button>
                    )}
                    {row.status === 'Draft' && (
                      <Button variant="ghost" size="sm" onClick={() => handleStartExam(row.id)} title="Activate Exam">
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteExam(row.id)} title="Delete">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm() }} title="Create Online Exam" size="lg">
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Exam Title *" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Enter exam title" />
            <Select label="Class *" value={form.class} onChange={(e) => setForm(f => ({ ...f, class: e.target.value }))} options={classOptions} placeholder="Select class" />
          </div>
          <Input label="Description" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input label="Total Marks" type="number" value={form.totalMarks} onChange={(e) => setForm(f => ({ ...f, totalMarks: e.target.value }))} />
            <Input label="Duration (min)" type="number" value={form.duration} onChange={(e) => setForm(f => ({ ...f, duration: e.target.value }))} />
            <Input label="Passing Marks" type="number" value={form.passingMarks} onChange={(e) => setForm(f => ({ ...f, passingMarks: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Start Date & Time *" type="datetime-local" value={form.startDate} onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))} />
            <Input label="End Date & Time *" type="datetime-local" value={form.endDate} onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))} />
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.shuffle} onChange={(e) => setForm(f => ({ ...f, shuffle: e.target.checked }))} className="rounded border-border" />
              Shuffle Questions
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.showResults} onChange={(e) => setForm(f => ({ ...f, showResults: e.target.checked }))} className="rounded border-border" />
              Show Results Immediately
            </label>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Questions ({questions.length})</h3>
              <Button variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Question
              </Button>
            </div>
            {questions.map((q, qi) => (
              <div key={qi} className="border border-border rounded-lg p-4 mb-3 space-y-3 relative">
                <button type="button" onClick={() => removeQuestion(qi)}
                  className="absolute top-2 right-2 p-1 rounded hover:bg-muted text-muted-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
                <Input
                  label={`Question ${qi + 1} *`}
                  value={q.questionText}
                  onChange={(e) => updateQuestion(qi, 'questionText', e.target.value)}
                  placeholder="Enter your question"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Type"
                    options={questionTypeOptions}
                    value={q.type}
                    onChange={(e) => updateQuestion(qi, 'type', e.target.value)}
                  />
                  <Input
                    label="Marks *"
                    type="number"
                    value={String(q.marks)}
                    onChange={(e) => updateQuestion(qi, 'marks', Number(e.target.value) || 0)}
                  />
                </div>
                {q.type === 'MCQ' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Options</label>
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <Input
                          placeholder={`Option ${oi + 1}`}
                          value={opt}
                          onChange={(e) => updateOption(qi, oi, e.target.value)}
                        />
                        <button type="button" onClick={() => removeOption(qi, oi)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground shrink-0">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => addOption(qi)}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Option
                    </Button>
                    <Select
                      label="Correct Answer *"
                      options={q.options.filter(o => o).map((o, oi) => ({ value: o, label: `Option ${oi + 1}: ${o}` }))}
                      value={q.correctAnswer}
                      onChange={(e) => updateQuestion(qi, 'correctAnswer', e.target.value)}
                    />
                  </div>
                )}
                {q.type === 'True/False' && (
                  <Select
                    label="Correct Answer *"
                    options={[{ value: 'True', label: 'True' }, { value: 'False', label: 'False' }]}
                    value={q.correctAnswer}
                    onChange={(e) => updateQuestion(qi, 'correctAnswer', e.target.value)}
                  />
                )}
                {q.type === 'Short Answer' && (
                  <Input
                    label="Correct Answer *"
                    value={q.correctAnswer}
                    onChange={(e) => updateQuestion(qi, 'correctAnswer', e.target.value)}
                    placeholder="Enter the correct answer"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => { setShowCreateModal(false); resetForm() }}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateExam} disabled={creating}>
              {creating ? 'Creating...' : 'Create Exam'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showQuestionsModal} onClose={() => { setShowQuestionsModal(false); setSelectedExam(null) }} title="Exam Questions" size="lg">
        {selectedExam && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{selectedExam.title} - {selectedExam.questions.length} questions</p>
            {selectedExam.questions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No questions added yet.</p>
            ) : (
              selectedExam.questions.map((q, idx) => (
                <div key={q.id || idx} className="border border-border rounded-lg p-3">
                  <p className="text-sm font-medium text-foreground">{idx + 1}. {q.questionText}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <Badge variant="info" size="sm">{q.type}</Badge>
                    <span>{q.marks} marks</span>
                    {q.type === 'MCQ' && q.options.length > 0 && (
                      <span>Options: {q.options.filter(o => o).join(', ')}</span>
                    )}
                    <span>Answer: {q.correctAnswer}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={showResultsModal} onClose={() => { setShowResultsModal(false); setSelectedExam(null); setResults([]) }} title="Exam Results" size="lg">
        {selectedExam && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{selectedExam.title} - Results</p>
            <Table
              columns={resultsColumns}
              data={results}
              loading={resultsLoading}
              emptyMessage="No results available"
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
