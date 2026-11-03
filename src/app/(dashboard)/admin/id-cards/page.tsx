'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GraduationCap, Users, IdCard, Calendar } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function IDCardsDashboardPage() {
  const [stats] = useState({
    totalGenerated: 12,
    lastGeneratedDate: 'June 20, 2026',
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ID Card Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Generate and manage identity cards</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Student ID Cards</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Generate ID cards for students with QR codes, photos, and details
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/admin/id-cards/student">
                <Button variant="primary" className="w-full">
                  <IdCard className="mr-2 h-4 w-4" /> Manage Student IDs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Teacher ID Cards</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Generate ID cards for teachers and staff with QR codes and details
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/admin/id-cards/teacher">
                <Button variant="primary" className="w-full">
                  <IdCard className="mr-2 h-4 w-4" /> Manage Teacher IDs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
          <CardDescription>ID card generation summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <IdCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalGenerated}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total IDs Generated</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.lastGeneratedDate}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Last Generated</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
