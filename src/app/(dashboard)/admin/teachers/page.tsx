'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Download,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Modal from '@/components/ui/modal'
import DataTable from '@/components/ui/data-table'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import { downloadCSV } from '@/lib/utils'

interface Teacher {
  id: string
  firstName: string
  lastName: string
  employeeId: string
  department: string
  designation: string
  subjects: string[]
  phone: string
  email: string
  status: string
  photo?: string
  gender?: string
}

interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

const departmentOptions = [
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'Science', label: 'Science' },
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Social Studies', label: 'Social Studies' },
  { value: 'Computer Science', label: 'Computer Science' },
  { value: 'Physical Education', label: 'Physical Education' },
  { value: 'Arts', label: 'Arts' },
  { value: 'Music', label: 'Music' },
]

const statusOptions = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'On Leave', label: 'On Leave' },
]

export default function TeacherListPage() {
  const router = useRouter()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1, limit: 10, total: 0, totalPages: 0,
  })
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (departmentFilter) params.set('department', departmentFilter)
      if (statusFilter) params.set('status', statusFilter)
      params.set('page', String(pagination.page))
      params.set('limit', String(pagination.limit))

      const res = await fetch(`/api/teachers?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch teachers')
      const json = await res.json()

      if (json.success) {
        setTeachers(json.data ?? [])
        if (json.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: json.pagination.total ?? 0,
            totalPages: json.pagination.totalPages ?? 0,
          }))
        }
      } else {
        setTeachers(json.data ?? [])
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load teachers')
    } finally {
      setLoading(false)
    }
  }, [search, departmentFilter, statusFilter, pagination.page, pagination.limit])

  useEffect(() => { fetchTeachers() }, [pagination.page])

  function handleSearch() {
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchTeachers()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch()
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/teachers/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete teacher')
      toast.success('Teacher deleted successfully')
      setDeleteModal(false)
      setDeleteId(null)
      fetchTeachers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete teacher')
    } finally {
      setDeleting(false)
    }
  }

  function handleExport() {
    const exportData = teachers.map((t) => ({
      Name: `${t.firstName} ${t.lastName}`,
      'Employee ID': t.employeeId,
      Department: t.department,
      Designation: t.designation,
      Subjects: Array.isArray(t.subjects) ? t.subjects.join(', ') : t.subjects || '',
      Phone: t.phone,
      Email: t.email,
      Status: t.status,
    }))
    downloadCSV(exportData, `teachers-${new Date().toISOString().split('T')[0]}`)
    toast.success('Teachers exported successfully')
  }

  const columns: ColumnDef<Teacher, unknown>[] = [
    {
      accessorKey: 'photo',
      header: 'Photo',
      cell: ({ row }) => {
        const t = row.original
        return t.photo ? (
          <img src={t.photo} alt={`${t.firstName} ${t.lastName}`} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
            {t.firstName?.charAt(0)}{t.lastName?.charAt(0)}
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium">{row.original.firstName} {row.original.lastName}</span>,
    },
    { accessorKey: 'employeeId', header: 'Employee ID' },
    { accessorKey: 'department', header: 'Department' },
    { accessorKey: 'designation', header: 'Designation' },
    {
      accessorKey: 'subjects',
      header: 'Subjects',
      cell: ({ row }) => (
        <span>{Array.isArray(row.original.subjects) ? row.original.subjects.join(', ') : row.original.subjects || '-'}</span>
      ),
    },
    { accessorKey: 'phone', header: 'Phone' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'Active' ? 'success' : row.original.status === 'On Leave' ? 'warning' : 'danger'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const t = row.original
        return (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/teachers/${t.id}`)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/teachers/${t.id}/edit`)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setDeleteId(t.id); setDeleteModal(true) }}>
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
          </div>
        )
      },
      enableSorting: false,
    },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teachers</h1>
          <p className="text-muted-foreground mt-1">Manage all teachers</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="primary" onClick={() => router.push('/admin/teachers/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Teacher
          </Button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  label="Search"
                  placeholder="Search by name, employee ID, department..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <div className="w-full md:w-48">
                <Select
                  label="Department"
                  options={departmentOptions}
                  value={departmentFilter}
                  onChange={(e) => { setDepartmentFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })) }}
                />
              </div>
              <div className="w-full md:w-48">
                <Select
                  label="Status"
                  options={statusOptions}
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })) }}
                />
              </div>
              <div className="flex items-end">
                <Button variant="primary" onClick={handleSearch}>Search</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Teacher List</CardTitle>
              <Badge variant="info">{pagination.total} total</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={teachers}
              loading={loading}
              searchKey="name"
              searchPlaceholder="Filter teachers..."
              pageSize={10}
              emptyMessage="No teachers found"
            />
          </CardContent>
        </Card>
      </motion.div>

      <Modal isOpen={deleteModal} onClose={() => { setDeleteModal(false); setDeleteId(null) }} title="Confirm Delete" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this teacher? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setDeleteModal(false); setDeleteId(null) }}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
