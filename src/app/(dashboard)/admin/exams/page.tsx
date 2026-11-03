'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ClipboardCheck,
  FileSpreadsheet,
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

interface Exam {
  id: string
  name: string
  type: string
  class: string
  startDate: string
  endDate: string
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

export default function ExamListPage() {
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  function confirmDelete(id: string) {
    setDeleteId(id)
    setDeleteModal(true)
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/exams/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete exam')
      toast.success('Exam deleted successfully')
      setDeleteModal(false)
      setDeleteId(null)
      fetchExams()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete exam'
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

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
    {
      key: 'startDate',
      label: 'Start Date',
      render: (_value: unknown, row: Exam) =>
        new Date(row.startDate).toLocaleDateString(),
    },
    {
      key: 'endDate',
      label: 'End Date',
      render: (_value: unknown, row: Exam) =>
        new Date(row.endDate).toLocaleDateString(),
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Exams</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage examinations</p>
        </div>
        <Button variant="primary" onClick={() => router.push('/admin/exams/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Exam
        </Button>
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
                  onClick={() => router.push(`/admin/exams/${row.id}`)}
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/admin/exams/${row.id}/edit`)}
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => confirmDelete(row.id)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/admin/exams/${row.id}/marks`)}
                  title="Enter Marks"
                >
                  <ClipboardCheck className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/admin/exams/${row.id}/results`)}
                  title="Generate Results"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={deleteModal}
        onClose={() => { setDeleteModal(false); setDeleteId(null) }}
        title="Confirm Delete"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this exam? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => { setDeleteModal(false); setDeleteId(null) }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
