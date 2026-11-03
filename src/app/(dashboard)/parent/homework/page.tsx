'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { showToast } from '@/components/ui/toast'
import Select from '@/components/ui/select'
import {
  BookOpen,
  Calendar,
  Users,
  Filter,
  CheckCircle2,
  Clock,
  FileText,
} from 'lucide-react'
import type { Student, Homework, Subject } from '@/types'

export default function HomeworkPage() {
  const [children, setChildren] = useState<Student[]>([])
  const [selectedChild, setSelectedChild] = useState('')
  const [homework, setHomework] = useState<Homework[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [hwLoading, setHwLoading] = useState(false)
  const [filter, setFilter] = useState<'All' | 'Active' | 'Completed'>('All')

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const res = await fetch('/api/parent/children')
        if (!res.ok) throw new Error('Failed to fetch children')
        const data = await res.json()
        const list = Array.isArray(data) ? data : data.children ?? []
        setChildren(list)
        if (list.length === 1) setSelectedChild(list[0].id)
      } catch {
        showToast('Failed to load children', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchChildren()
  }, [])

  useEffect(() => {
    if (!selectedChild) return
    const fetchHomework = async () => {
      setHwLoading(true)
      try {
        const res = await fetch(`/api/parent/children/${selectedChild}/homework`)
        if (!res.ok) throw new Error('Failed to fetch homework')
        const data = await res.json()
        setHomework(Array.isArray(data) ? data : data.homework ?? [])
      } catch {
        showToast('Failed to load homework', 'error')
        setHomework([])
      } finally {
        setHwLoading(false)
      }
    }
    fetchHomework()

    const fetchSubjects = async () => {
      try {
        const res = await fetch('/api/subjects')
        if (res.ok) {
          const data = await res.json()
          setSubjects(Array.isArray(data) ? data : data.subjects ?? [])
        }
      } catch {
        // subjects are optional enrichment
      }
    }
    fetchSubjects()
  }, [selectedChild])

  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]))

  const filteredHomework = homework.filter((h) => {
    if (filter === 'All') return true
    return h.status === filter
  })

  const statusBadge = (status: string) => {
    const variant = status === 'Active' ? 'warning' : 'success'
    return (
      <div className="flex items-center gap-1">
        {status === 'Active' ? (
          <Clock className="h-3 w-3 text-yellow-500" />
        ) : (
          <CheckCircle2 className="h-3 w-3 text-green-500" />
        )}
        <Badge variant={variant as 'warning' | 'success'}>{status}</Badge>
      </div>
    )
  }

  if (loading) {
    return <Loading message="Loading homework..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-gray-500 dark:text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Homework
        </h1>
      </div>

      {children.length > 1 && (
        <div className="max-w-xs">
          <Select
            label="Select Child"
            options={children.map((c) => ({
              value: c.id,
              label: `${c.firstName} ${c.lastName} (${c.classId})`,
            }))}
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
          />
        </div>
      )}

      {!selectedChild && children.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Select a child to view homework
            </p>
          </CardContent>
        </Card>
      ) : !selectedChild ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              No children linked to your account
            </p>
          </CardContent>
        </Card>
      ) : hwLoading ? (
        <Loading message="Loading homework..." />
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              {(['All', 'Active', 'Completed'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {f}
                </Button>
              ))}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredHomework.length} assignment{filteredHomework.length !== 1 ? 's' : ''}
            </p>
          </div>

          {filteredHomework.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 className="mb-4 h-16 w-16 text-green-300 dark:text-green-600" />
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {filter === 'All'
                    ? 'No homework assigned'
                    : filter === 'Active'
                      ? 'No pending homework'
                      : 'No completed homework'}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {filter === 'Active' ? 'All caught up!' : ''}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredHomework.map((hw) => (
                <Card key={hw.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {hw.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {subjectMap.get(hw.subjectId) || hw.subjectId}
                        </p>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {hw.description}
                        </p>
                      </div>
                      <div className="ml-4">{statusBadge(hw.status)}</div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="h-3 w-3" />
                      Due: {new Date(hw.dueDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
