'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Users,
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

interface Staff {
  id: string
  firstName: string
  lastName: string
  employeeId: string
  designation: string
  department: string
  phone: string
  email: string
  status: string
  photo?: string
  gender?: string
  joiningDate?: string
  basicSalary?: number
}

interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

const departmentOptions = [
  { value: 'Administration', label: 'Administration' },
  { value: 'Accounts', label: 'Accounts' },
  { value: 'Library', label: 'Library' },
  { value: 'Laboratory', label: 'Laboratory' },
  { value: 'Transport', label: 'Transport' },
  { value: 'Security', label: 'Security' },
  { value: 'Maintenance', label: 'Maintenance' },
  { value: 'IT Support', label: 'IT Support' },
  { value: 'Canteen', label: 'Canteen' },
  { value: 'Housekeeping', label: 'Housekeeping' },
]

const designationOptions = [
  { value: 'Administrator', label: 'Administrator' },
  { value: 'Accountant', label: 'Accountant' },
  { value: 'Librarian', label: 'Librarian' },
  { value: 'Lab Assistant', label: 'Lab Assistant' },
  { value: 'Driver', label: 'Driver' },
  { value: 'Security Guard', label: 'Security Guard' },
  { value: 'Clerk', label: 'Clerk' },
  { value: 'Receptionist', label: 'Receptionist' },
  { value: 'IT Technician', label: 'IT Technician' },
  { value: 'Helper', label: 'Helper' },
]

const statusOptions = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'On Leave', label: 'On Leave' },
]

export default function StaffListPage() {
  const router = useRouter()
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [designationFilter, setDesignationFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (departmentFilter) params.set('department', departmentFilter)
      if (designationFilter) params.set('designation', designationFilter)
      params.set('page', String(pagination.page))
      params.set('limit', String(pagination.limit))

      const res = await fetch(`/api/staff?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch staff')
      const json = await res.json()

      if (json.success) {
        setStaffList(json.data ?? [])
        if (json.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: json.pagination.total ?? 0,
            totalPages: json.pagination.totalPages ?? 0,
          }))
        }
      } else {
        setStaffList(json.data ?? [])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load staff'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [search, departmentFilter, designationFilter, pagination.page, pagination.limit])

  useEffect(() => {
    fetchStaff()
  }, [pagination.page])

  function handleSearch() {
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchStaff()
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
      const res = await fetch(`/api/staff/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete staff')
      toast.success('Staff deleted successfully')
      setDeleteModal(false)
      setDeleteId(null)
      fetchStaff()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete staff'
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'photo',
      label: 'Photo',
      render: (_value: unknown, row: Staff) => (
        row.photo ? (
          <img
            src={row.photo}
            alt={`${row.firstName} ${row.lastName}`}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
            {row.firstName?.charAt(0)}{row.lastName?.charAt(0)}
          </div>
        )
      ),
    },
    { key: 'employeeId', label: 'Employee ID' },
    {
      key: 'name',
      label: 'Name',
      render: (_value: unknown, row: Staff) => (
        <span className="font-medium">{row.firstName} {row.lastName}</span>
      ),
    },
    { key: 'designation', label: 'Designation' },
    { key: 'department', label: 'Department' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'status',
      label: 'Status',
      render: (_value: unknown, row: Staff) => (
        <Badge
          variant={
            row.status === 'Active' ? 'success' :
            row.status === 'On Leave' ? 'warning' : 'danger'
          }
        >
          {row.status}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Staff</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage all staff members</p>
        </div>
        <Button variant="primary" onClick={() => router.push('/admin/staff/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Staff
        </Button>
      </div>

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
                label="Designation"
                options={designationOptions}
                value={designationFilter}
                onChange={(e) => { setDesignationFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })) }}
              />
            </div>
            <div className="flex items-end">
              <Button variant="primary" onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Staff List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            columns={columns}
            data={staffList}
            loading={loading}
            actions={(row: Staff) => (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/admin/staff/${row.id}`)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/admin/staff/${row.id}/edit`)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => confirmDelete(row.id)}
                >
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </div>
            )}
          />

          {staffList.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} staff
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                >
                  Previous
                </Button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === pagination.page ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setPagination((p) => ({ ...p, page }))}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
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
            Are you sure you want to delete this staff member? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => { setDeleteModal(false); setDeleteId(null) }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
