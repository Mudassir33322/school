'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Eye,
  ClipboardCheck,
  FileSpreadsheet,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Table from '@/components/ui/table'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'

interface Exam {
  id: string
  name: string
  type: string
  class: string
  subject: string
  date: string
  status: string
}

const typeOptions = [
  { value: 'Mid-Term', label: 'Mid-Term' },
  { value: 'Final', label: 'Final' },
  { value: 'Unit Test', label: 'Unit Test' },
  { value: 'Practical', label: 'Practical' },
]

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

const statusVariant: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
  Upcoming: 'info',
  'In Progress': 'warning',
  Completed: 'success',
  Cancelled: 'danger',
}

export default function MyExamsPage() {
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')

  const fetchExams = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (typeFilter) params.set('type', typeFilter)
      if (classFilter) params.set('class', classFilter)

      const res = await fetch(`/api/exams?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch exams')
      const json = await res.json()
      setExams(json.data ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load exams'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, classFilter])

  useEffect(() => {
    fetchExams()
  }, [fetchExams])

  const columns = [
    { key: 'name', label: 'Exam Name' },
    {
      key: 'type',
      label: 'Type',
      render: (_value: unknown, row: Exam) => (
        <Badge variant="info">{row.type}</Badge>
      ),
    },
    {
      key: 'class',
      label: 'Class',
      render: (_value: unknown, row: Exam) => `Class ${row.class}`,
    },
    { key: 'subject', label: 'Subject' },
    {
      key: 'date',
      label: 'Date',
      render: (_value: unknown, row: Exam) =>
        new Date(row.date).toLocaleDateString(),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_value: unknown, row: Exam) => (
        <Badge variant={statusVariant[row.status] || 'default'}>
          {row.status}
        </Badge>
      ),
    },
  ]

  if (loading) return <Loading text="Loading exams..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Exams</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">View exams for your classes</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                label="Search"
                placeholder="Search by exam name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') fetchExams() }}
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                label="Type"
                options={typeOptions}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                label="Class"
                options={classOptions}
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button variant="primary" onClick={fetchExams}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exam List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            columns={columns}
            data={exams}
            loading={loading}
            actions={(row: Exam) => (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/teacher/exams/${row.id}/marks`)}
                  title="Enter Marks"
                >
                  <ClipboardCheck className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/admin/exams/${row.id}`)}
                  title="View Results"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>
    </div>
  )
}
