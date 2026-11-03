'use client'

import { useState } from 'react'
import { Search, Printer, Download, Users, User } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Modal from '@/components/ui/modal'
import { Loading } from '@/components/ui/loading'
import { showToast } from '@/components/ui/toast'
import TeacherIDCard from '@/components/id-cards/teacher-card'

interface Teacher {
  id: string
  name: string
  employeeId: string
  department: string
  designation: string
  email: string
  phone: string
  qualification: string
  photoUrl?: string
}

const teacherData: Teacher[] = [
  { id: '1', name: 'Mr. Rajesh Gupta', employeeId: 'EMP001', department: 'Mathematics', designation: 'Senior Teacher', email: 'rajesh.gupta@school.com', phone: '+91-9876543201', qualification: 'M.Sc. Mathematics' },
  { id: '2', name: 'Ms. Priya Sharma', employeeId: 'EMP002', department: 'Science', designation: 'Head of Department', email: 'priya.sharma@school.com', phone: '+91-9876543202', qualification: 'M.Sc. Physics' },
  { id: '3', name: 'Mr. Amit Singh', employeeId: 'EMP003', department: 'English', designation: 'Teacher', email: 'amit.singh@school.com', phone: '+91-9876543203', qualification: 'M.A. English' },
  { id: '4', name: 'Ms. Neha Verma', employeeId: 'EMP004', department: 'Computer Science', designation: 'Teacher', email: 'neha.verma@school.com', phone: '+91-9876543204', qualification: 'M.Tech CS' },
]

const departmentOptions = [
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'Science', label: 'Science' },
  { value: 'English', label: 'English' },
  { value: 'Computer Science', label: 'Computer Science' },
  { value: 'Social Studies', label: 'Social Studies' },
  { value: 'Arts', label: 'Arts' },
]

export default function TeacherIDCardsPage() {
  const [teachers] = useState<Teacher[]>(teacherData)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(false)
  const [bulkDepartment, setBulkDepartment] = useState('')
  const [generatedIds, setGeneratedIds] = useState<Teacher[]>([])

  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    if (!e.target.value) setSelectedTeacher(null)
  }

  const handleSelectTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setSearchQuery('')
    setGeneratedIds(prev => prev.some(t => t.id === teacher.id) ? prev : [teacher, ...prev])
  }

  const handlePrint = () => {
    if (!selectedTeacher) {
      showToast('Please select a teacher first', 'error')
      return
    }
    showToast('Print dialog opened', 'success')
    window.print()
  }

  const handleBulkGenerate = () => {
    if (!bulkDepartment) {
      showToast('Please select a department', 'error')
      return
    }
    setLoading(true)
    setTimeout(() => {
      const bulkTeachers = teachers.filter(t => t.department === bulkDepartment)
      if (bulkTeachers.length === 0) {
        showToast('No teachers found for the selected department', 'error')
      } else {
        setGeneratedIds(prev => {
          const existing = new Set(prev.map(t => t.id))
          const newOnes = bulkTeachers.filter(t => !existing.has(t.id))
          return [...newOnes, ...prev]
        })
        showToast(`Generated ${bulkTeachers.length} ID cards`, 'success')
      }
      setLoading(false)
    }, 800)
  }

  const handleDownloadPDF = () => {
    if (!selectedTeacher) {
      showToast('Please select a teacher', 'error')
      return
    }
    showToast('PDF download started', 'success')
  }

  if (loading) return <Loading text="Generating ID cards..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Teacher ID Cards</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Generate and manage staff identity cards</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Search Teacher</CardTitle>
              <CardDescription>Search by name or employee ID</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or employee ID..."
                  className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
              {searchQuery && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  {filteredTeachers.length === 0 ? (
                    <p className="p-3 text-sm text-gray-400">No teachers found</p>
                  ) : (
                    filteredTeachers.map(t => (
                      <button
                        key={t.id}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedTeacher?.id === t.id ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}
                        onClick={() => handleSelectTeacher(t)}
                      >
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{t.name}</p>
                          <p className="text-xs text-gray-500">{t.employeeId} - {t.department}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bulk Generate</CardTitle>
              <CardDescription>Generate ID cards by department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1">
                  <Select label="Department" options={departmentOptions} value={bulkDepartment} onChange={e => setBulkDepartment(e.target.value)} />
                </div>
                <Button variant="primary" onClick={handleBulkGenerate}>
                  <Users className="mr-2 h-4 w-4" /> Generate All
                </Button>
              </div>
            </CardContent>
          </Card>

          {selectedTeacher && (
            <div>
              <div className="flex justify-end gap-2 print:hidden">
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
                <Button variant="outline" onClick={handleDownloadPDF}>
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
              </div>
              <div className="mt-4 flex justify-center">
                <TeacherIDCard
                  id={selectedTeacher.id}
                  name={selectedTeacher.name}
                  employeeId={selectedTeacher.employeeId}
                  department={selectedTeacher.department}
                  designation={selectedTeacher.designation}
                  email={selectedTeacher.email}
                  phone={selectedTeacher.phone}
                  photoUrl={selectedTeacher.photoUrl}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Generated IDs</CardTitle>
              <CardDescription>Recently generated ID cards</CardDescription>
            </CardHeader>
            <CardContent>
              {generatedIds.length === 0 ? (
                <p className="text-sm text-gray-400">No ID cards generated yet</p>
              ) : (
                <div className="space-y-2">
                  {generatedIds.map(t => (
                    <button
                      key={t.id}
                      className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 ${selectedTeacher?.id === t.id ? 'border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-900/20' : 'border-gray-200'}`}
                      onClick={() => setSelectedTeacher(t)}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900 dark:text-gray-100">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.employeeId}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
