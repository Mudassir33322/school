'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { showToast } from '@/components/ui/toast'
import {
  Users,
  Eye,
  CalendarCheck,
  GraduationCap,
  DollarSign,
  ArrowRight,
  User,
} from 'lucide-react'
import type { Student } from '@/types'

export default function ChildrenListPage() {
  const [children, setChildren] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const res = await fetch('/api/parent/children')
        if (!res.ok) throw new Error('Failed to fetch children')
        const data = await res.json()
        setChildren(Array.isArray(data) ? data : data.children ?? [])
      } catch {
        showToast('Failed to load children data', 'error')
        setChildren([])
      } finally {
        setLoading(false)
      }
    }
    fetchChildren()
  }, [])

  if (loading) {
    return <Loading message="Loading children..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-gray-500 dark:text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          My Children
        </h1>
      </div>

      {children.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <User className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              No children linked to your account
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Please contact the school administration if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <Card key={child.id} className="overflow-hidden transition-shadow hover:shadow-md">
              <CardContent className="p-0">
                <div className="flex items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:from-gray-800 dark:to-gray-750">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900/30">
                    {child.photo ? (
                      <img
                        src={child.photo}
                        alt={`${child.firstName} ${child.lastName}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {child.firstName} {child.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {child.classId} | Section {child.sectionId}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Roll No: {child.rollNo}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700">
                  <Link
                    href={`/parent/children/${child.id}?tab=attendance`}
                    className="flex flex-col items-center gap-1 px-3 py-4 text-center text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <CalendarCheck className="h-5 w-5 text-blue-500" />
                    <span className="text-gray-700 dark:text-gray-300">Attendance</span>
                  </Link>
                  <Link
                    href={`/parent/children/${child.id}?tab=results`}
                    className="flex flex-col items-center gap-1 px-3 py-4 text-center text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <GraduationCap className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">Results</span>
                  </Link>
                  <Link
                    href={`/parent/children/${child.id}?tab=fees`}
                    className="flex flex-col items-center gap-1 px-3 py-4 text-center text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <DollarSign className="h-5 w-5 text-purple-500" />
                    <span className="text-gray-700 dark:text-gray-300">Fees</span>
                  </Link>
                </div>

                <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                  <Link href={`/parent/children/${child.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      View Full Profile
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
