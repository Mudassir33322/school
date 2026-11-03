'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Eye,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Table from '@/components/ui/table'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'

interface Student {
  id: string
  firstName: string
  lastName: string
  rollNo: string
  class: string
  section: string
  parentContact: string
  photo?: string
  attendancePercent: number
}

export default function MyStudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (classFilter) params.set('class', classFilter)
      if (sectionFilter) params.set('section', sectionFilter)

      const res = await fetch(`/api/students?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch students')
      const json = await res.json()
      setStudents(json.data ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load students'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [search, classFilter, sectionFilter])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  function handleSearch() {
    fetchStudents()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch()
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

  const sectionOptions = [
    { value: 'A', label: 'Section A' },
    { value: 'B', label: 'Section B' },
    { value: 'C', label: 'Section C' },
  ]

  const columns = [
    { key: 'rollNo', label: 'Roll No' },
    {
      key: 'photo',
      label: 'Photo',
      render: (_value: unknown, row: Student) => (
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
    {
      key: 'name',
      label: 'Name',
      render: (_value: unknown, row: Student) => (
        <span className="font-medium">{row.firstName} {row.lastName}</span>
      ),
    },
    { key: 'class', label: 'Class' },
    { key: 'section', label: 'Section' },
    { key: 'parentContact', label: 'Parent Contact' },
    {
      key: 'attendancePercent',
      label: 'Attendance %',
      render: (_value: unknown, row: Student) => {
        const pct = row.attendancePercent ?? 0
        return (
          <Badge variant={pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'danger'}>
            {pct}%
          </Badge>
        )
      },
    },
  ]

  if (loading) return <Loading text="Loading students..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Students</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">View students assigned to your classes</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                label="Search"
                placeholder="Search by name or roll no..."
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
                onChange={(e) => setClassFilter(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                label="Section"
                options={sectionOptions}
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
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
          <CardTitle>Student List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            columns={columns}
            data={students}
            loading={loading}
            actions={(row: Student) => (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/teacher/students/${row.id}`)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>
    </div>
  )
}
