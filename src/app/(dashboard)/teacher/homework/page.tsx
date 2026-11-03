'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Eye,
  ClipboardList,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Table from '@/components/ui/table'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'

interface Homework {
  id: string
  title: string
  subject: string
  class: string
  dueDate: string
  status: string
  submissionCount: number
  totalStudents: number
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

const statusOptions = [
  { value: 'Active', label: 'Active' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
]

const subjectOptions = [
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'Physics', label: 'Physics' },
  { value: 'Chemistry', label: 'Chemistry' },
  { value: 'Biology', label: 'Biology' },
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'History', label: 'History' },
  { value: 'Geography', label: 'Geography' },
  { value: 'Computer Science', label: 'Computer Science' },
]

export default function MyHomeworkPage() {
  const router = useRouter()
  const [homework, setHomework] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchHomework = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (subjectFilter) params.set('subject', subjectFilter)
      if (classFilter) params.set('class', classFilter)
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/homework?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch homework')
      const json = await res.json()
      setHomework(json.data ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load homework'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [search, subjectFilter, classFilter, statusFilter])

  useEffect(() => {
    fetchHomework()
  }, [fetchHomework])

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (_value: unknown, row: Homework) => (
        <span className={`font-medium ${isOverdue(row.dueDate) && row.status === 'Active' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
          {row.title}
        </span>
      ),
    },
    { key: 'subject', label: 'Subject' },
    {
      key: 'class',
      label: 'Class',
      render: (_value: unknown, row: Homework) => `Class ${row.class}`,
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (_value: unknown, row: Homework) => {
        const overdue = isOverdue(row.dueDate) && row.status === 'Active'
        return (
          <span className={overdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
            {new Date(row.dueDate).toLocaleDateString()}
            {overdue && <span className="ml-1">(Overdue)</span>}
          </span>
        )
      },
    },
    {
      key: 'submissionCount',
      label: 'Submissions',
      render: (_value: unknown, row: Homework) => (
        <span>{row.submissionCount ?? 0} / {row.totalStudents ?? 0}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_value: unknown, row: Homework) => (
        <Badge
          variant={
            row.status === 'Active' ? 'info' :
            row.status === 'Completed' ? 'success' : 'danger'
          }
        >
          {row.status}
        </Badge>
      ),
    },
  ]

  if (loading) return <Loading text="Loading homework..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Homework</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your homework assignments</p>
        </div>
        <Button variant="primary" onClick={() => router.push('/teacher/homework/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Assign Homework
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                label="Search"
                placeholder="Search by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') fetchHomework() }}
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                label="Subject"
                options={subjectOptions}
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              />
            </div>
            <div className="w-full md:w-40">
              <Select
                label="Class"
                options={classOptions}
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
              />
            </div>
            <div className="w-full md:w-40">
              <Select
                label="Status"
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button variant="primary" onClick={fetchHomework}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Homework List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            columns={columns}
            data={homework}
            loading={loading}
            actions={(row: Homework) => (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/teacher/homework/${row.id}`)}
                  title="View Submissions"
                >
                  <ClipboardList className="h-4 w-4" />
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>
    </div>
  )
}
