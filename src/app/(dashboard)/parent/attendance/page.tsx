'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { showToast } from '@/components/ui/toast'
import Select from '@/components/ui/select'
import {
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
} from 'lucide-react'
import type { Student, Attendance } from '@/types'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function AttendancePage() {
  const [children, setChildren] = useState<Student[]>([])
  const [selectedChild, setSelectedChild] = useState('')
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [attLoading, setAttLoading] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

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
    const fetchAttendance = async () => {
      setAttLoading(true)
      try {
        const month = String(currentMonth + 1).padStart(2, '0')
        const res = await fetch(
          `/api/parent/children/${selectedChild}/attendance?month=${month}&year=${currentYear}`
        )
        if (!res.ok) throw new Error('Failed to fetch attendance')
        const data = await res.json()
        setAttendance(Array.isArray(data) ? data : data.attendance ?? [])
      } catch {
        showToast('Failed to load attendance', 'error')
        setAttendance([])
      } finally {
        setAttLoading(false)
      }
    }
    fetchAttendance()
  }, [selectedChild, currentMonth, currentYear])

  const attPresent = attendance.filter((a) => a.status === 'Present').length
  const attAbsent = attendance.filter((a) => a.status === 'Absent').length
  const attLate = attendance.filter((a) => a.status === 'Late').length
  const attTotal = attendance.length
  const attPct = attTotal ? Math.round((attPresent / attTotal) * 100) : 0

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'Present':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'Absent':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'Late':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const statusBadge = (status: string) => {
    const variant =
      status === 'Present'
        ? 'success'
        : status === 'Absent'
          ? 'danger'
          : status === 'Late'
            ? 'warning'
            : 'default'
    return <Badge variant={variant as 'success' | 'danger' | 'warning' | 'default'}>{status}</Badge>
  }

  if (loading) {
    return <Loading message="Loading attendance..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarCheck className="h-6 w-6 text-gray-500 dark:text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Attendance
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
              Select a child to view attendance
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
      ) : attLoading ? (
        <Loading message="Loading attendance records..." />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[160px] text-center text-sm font-medium text-gray-900 dark:text-gray-100">
                {MONTHS[currentMonth]} {currentYear}
              </span>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card variant="stat">
              <CardContent className="flex flex-col items-center text-center">
                <CheckCircle2 className="mb-2 h-8 w-8 text-green-500" />
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{attPresent}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Present</p>
              </CardContent>
            </Card>
            <Card variant="stat">
              <CardContent className="flex flex-col items-center text-center">
                <AlertCircle className="mb-2 h-8 w-8 text-red-500" />
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{attAbsent}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Absent</p>
              </CardContent>
            </Card>
            <Card variant="stat">
              <CardContent className="flex flex-col items-center text-center">
                <Clock className="mb-2 h-8 w-8 text-yellow-500" />
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{attLate}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Late</p>
              </CardContent>
            </Card>
            <Card variant="stat">
              <CardContent className="flex flex-col items-center text-center">
                <CalendarCheck className="mb-2 h-8 w-8 text-blue-500" />
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{attPct}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Attendance</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Progress</CardTitle>
              <CardDescription>Overall attendance percentage for this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{attPct}%</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {attPresent}/{attTotal} days
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${attPct}%` }}
                  />
                </div>
                <div className="flex text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500" /> Present ({attPresent})
                  </span>
                  <span className="ml-3 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-500" /> Absent ({attAbsent})
                  </span>
                  <span className="ml-3 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-yellow-500" /> Late ({attLate})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <CardTitle>Attendance Records</CardTitle>
              </div>
              <CardDescription>Daily attendance details</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {attendance.length === 0 ? (
                <div className="px-6 pb-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No attendance records for this month
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Remarks
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                      {attendance.map((record) => (
                        <tr
                          key={record.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                            {new Date(record.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            <div className="flex items-center gap-2">
                              {statusIcon(record.status)}
                              {statusBadge(record.status)}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {record.remarks || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
