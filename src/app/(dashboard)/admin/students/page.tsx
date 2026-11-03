'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  IdCard,
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
import StudentIDCard from '@/components/id-cards/student-card'
import { downloadCSV } from '@/lib/utils'

interface Student {
  id: string
  firstName: string
  lastName: string
  admissionNo: string
  rollNo: string
  class: string
  section: string
  parentContact: string
  status: string
  photo?: string
  gender?: string
  dob?: string
  bloodGroup?: string
  guardianName?: string
}

interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function StudentListPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [idCardStudent, setIdCardStudent] = useState<Student | null>(null)
  const [showIdCard, setShowIdCard] = useState(false)
  const [schoolName, setSchoolName] = useState('School Name')

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(json => {
      const s = json.data || json
      if (s?.schoolName) setSchoolName(s.schoolName)
    }).catch(() => {})
  }, [])

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (classFilter) params.set('class', classFilter)
      if (sectionFilter) params.set('section', sectionFilter)
      if (statusFilter) params.set('status', statusFilter)
      params.set('page', String(pagination.page))
      params.set('limit', String(pagination.limit))

      const res = await fetch(`/api/students?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch students')
      const json = await res.json()

      if (json.success) {
        setStudents(json.data ?? [])
        if (json.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: json.pagination.total ?? 0,
            totalPages: json.pagination.totalPages ?? 0,
          }))
        }
      } else {
        setStudents(json.data ?? [])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load students'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [search, classFilter, sectionFilter, statusFilter, pagination.page, pagination.limit])

  useEffect(() => {
    fetchStudents()
  }, [pagination.page])

  function handleSearch() {
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchStudents()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch()
  }

  function confirmDelete(id: string) {
    setDeleteId(id)
    setDeleteModal(true)
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/students/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete student')
      toast.success('Student deleted successfully')
      setDeleteModal(false)
      setDeleteId(null)
      fetchStudents()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete student'
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  function handleExport() {
    const exportData = students.map((s) => ({
      Name: `${s.firstName} ${s.lastName}`,
      'Admission No': s.admissionNo,
      'Roll No': s.rollNo,
      Class: s.class,
      Section: s.section,
      'Parent Contact': s.parentContact,
      Status: s.status,
      Gender: s.gender || '',
    }))
    downloadCSV(exportData, `students-${new Date().toISOString().split('T')[0]}`)
    toast.success('Students exported successfully')
  }

  const columns: ColumnDef<Student, unknown>[] = [
    {
      accessorKey: 'photo',
      header: 'Photo',
      cell: ({ row }) => {
        const s = row.original
        return s.photo ? (
          <img src={s.photo} alt={`${s.firstName} ${s.lastName}`} loading="lazy" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
            {s.firstName?.charAt(0)}{s.lastName?.charAt(0)}
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
    { accessorKey: 'admissionNo', header: 'Admission No' },
    { accessorKey: 'rollNo', header: 'Roll No' },
    { accessorKey: 'class', header: 'Class' },
    { accessorKey: 'section', header: 'Section' },
    { accessorKey: 'parentContact', header: 'Parent Contact' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'Active' ? 'success' : 'danger'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/students/${s.id}`)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setIdCardStudent(s); setShowIdCard(true) }}>
              <IdCard className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/students/${s.id}/edit`)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => confirmDelete(s.id)}>
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
          </div>
        )
      },
      enableSorting: false,
    },
  ]

  const classOptions = [
    { value: '1', label: 'Class 1' }, { value: '2', label: 'Class 2' },
    { value: '3', label: 'Class 3' }, { value: '4', label: 'Class 4' },
    { value: '5', label: 'Class 5' }, { value: '6', label: 'Class 6' },
    { value: '7', label: 'Class 7' }, { value: '8', label: 'Class 8' },
    { value: '9', label: 'Class 9' }, { value: '10', label: 'Class 10' },
    { value: '11', label: 'Class 11' }, { value: '12', label: 'Class 12' },
  ]

  const sectionOptions = [
    { value: 'A', label: 'Section A' }, { value: 'B', label: 'Section B' }, { value: 'C', label: 'Section C' },
  ]

  const statusOptions = [
    { value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' },
  ]

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground mt-1">Manage all students</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="primary" onClick={() => router.push('/admin/students/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Student
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
                  placeholder="Search by name, admission no, roll no..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <div className="w-full md:w-48">
                <Select
                  label="Class"
                  options={classOptions}
                  value={classFilter}
                  onChange={(e) => { setClassFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })) }}
                />
              </div>
              <div className="w-full md:w-48">
                <Select
                  label="Section"
                  options={sectionOptions}
                  value={sectionFilter}
                  onChange={(e) => { setSectionFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })) }}
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
              <CardTitle>Student List</CardTitle>
              <Badge variant="info">{pagination.total} total</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={students}
              loading={loading}
              searchKey="name"
              searchPlaceholder="Filter students..."
              pageSize={10}
              emptyMessage="No students found"
            />
          </CardContent>
        </Card>
      </motion.div>

      <Modal isOpen={showIdCard} onClose={() => setShowIdCard(false)} title="Student ID Card" size="lg">
        {idCardStudent && (
          <div className="flex justify-center py-4">
            <StudentIDCard
              id={idCardStudent.id}
              name={`${idCardStudent.firstName} ${idCardStudent.lastName}`}
              className={idCardStudent.class || ''}
              section={idCardStudent.section || ''}
              fatherName={idCardStudent.guardianName || ''}
              rollNo={String(idCardStudent.rollNo ?? '')}
              bloodGroup={idCardStudent.bloodGroup || ''}
              photoUrl={idCardStudent.photo || undefined}
              schoolName={schoolName}
            />
          </div>
        )}
      </Modal>

      <Modal
        isOpen={deleteModal}
        onClose={() => { setDeleteModal(false); setDeleteId(null) }}
        title="Confirm Delete"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this student? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setDeleteModal(false); setDeleteId(null) }}>
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
