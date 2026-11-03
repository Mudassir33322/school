'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Megaphone,
  Calendar,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Modal from '@/components/ui/modal'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'

interface Notice {
  id: string
  title: string
  content: string
  type: string
  targetAudience: string[]
  date: string
}

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'Notice', label: 'Notice' },
  { value: 'Announcement', label: 'Announcement' },
  { value: 'Holiday', label: 'Holiday' },
  { value: 'Event', label: 'Event' },
]

const typeBadgeVariant: Record<string, 'info' | 'warning' | 'success' | 'danger'> = {
  Notice: 'info',
  Announcement: 'warning',
  Holiday: 'success',
  Event: 'danger',
}

const typeBorderColor: Record<string, string> = {
  Notice: 'border-l-blue-500',
  Announcement: 'border-l-yellow-500',
  Holiday: 'border-l-green-500',
  Event: 'border-l-red-500',
}

export default function NoticeListPage() {
  const router = useRouter()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchNotices = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (typeFilter) params.set('type', typeFilter)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const res = await fetch(`/api/notices?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch notices')
      const json = await res.json()
      setNotices(json.data ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load notices'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, startDate, endDate])

  useEffect(() => {
    fetchNotices()
  }, [fetchNotices])

  function confirmDelete(id: string) {
    setDeleteId(id)
    setDeleteModal(true)
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/notices/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete notice')
      toast.success('Notice deleted successfully')
      setDeleteModal(false)
      setDeleteId(null)
      fetchNotices()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete notice'
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notice Board</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage notices and announcements</p>
        </div>
        <Button variant="primary" onClick={() => router.push('/admin/notices/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Notice
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
                onKeyDown={(e) => { if (e.key === 'Enter') fetchNotices() }}
              />
            </div>
            <div className="w-full md:w-40">
              <Select
                label="Type"
                options={typeOptions}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              />
            </div>
            <div className="w-full md:w-44">
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="w-full md:w-44">
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button variant="primary" onClick={fetchNotices}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Loading text="Loading notices..." />
      ) : notices.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-3">
              <Megaphone className="h-12 w-12 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No notices found</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {search || typeFilter || startDate || endDate
                  ? 'Try adjusting your search or filters'
                  : 'Create your first notice to get started'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={`rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm border-l-4 ${typeBorderColor[notice.type] || 'border-l-gray-500'} p-5 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between mb-3">
                <Badge variant={typeBadgeVariant[notice.type] || 'default'}>
                  {notice.type}
                </Badge>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/admin/notices/${notice.id}`)}
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/admin/notices/${notice.id}/edit`)}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => confirmDelete(notice.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              </div>

              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1">
                {notice.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                {notice.content}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(notice.date).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {notice.targetAudience?.join(', ') || 'All'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={deleteModal}
        onClose={() => { setDeleteModal(false); setDeleteId(null) }}
        title="Confirm Delete"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this notice? This action cannot be undone.
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
