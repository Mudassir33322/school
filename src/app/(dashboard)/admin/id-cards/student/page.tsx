'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Printer, Download, Users, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Modal from '@/components/ui/modal'
import { Loading } from '@/components/ui/loading'
import { showToast } from '@/components/ui/toast'
import StudentIDCard from '@/components/id-cards/student-card'

interface Student {
  id: string
  firstName: string
  lastName: string
  admissionNo: string
  rollNo: string
  class: string
  section: string
  guardianName: string
  address: string
  city: string
  state: string
  guardianPhone: string
  bloodGroup: string
  photo?: string
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
]

const sectionOptions = [
  { value: 'A', label: 'Section A' },
  { value: 'B', label: 'Section B' },
  { value: 'C', label: 'Section C' },
]

export default function StudentIDCardsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [bulkClass, setBulkClass] = useState('')
  const [bulkSection, setBulkSection] = useState('')
  const [generatedIds, setGeneratedIds] = useState<Student[]>([])
  const [schoolName, setSchoolName] = useState('School Name')
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchStudents()
    fetch('/api/settings').then(r => r.json()).then(json => {
      const s = json.data || json
      if (s?.schoolName) setSchoolName(s.schoolName)
    }).catch(() => {})
  }, [])

  async function fetchStudents() {
    try {
      setLoading(true)
      const res = await fetch('/api/students')
      if (!res.ok) throw new Error('Failed to fetch students')
      const json = await res.json()
      setStudents(json.data ?? [])
    } catch {
      showToast('Failed to load students', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(s => {
    const name = `${s.firstName} ${s.lastName}`.toLowerCase()
    const query = searchQuery.toLowerCase()
    return name.includes(query) || s.admissionNo.toLowerCase().includes(query)
  })

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    if (!e.target.value) setSelectedStudent(null)
  }

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student)
    setSearchQuery('')
    setGeneratedIds(prev => prev.some(s => s.id === student.id) ? prev : [student, ...prev])
  }

  const handlePrint = () => {
    if (!selectedStudent) {
      showToast('Please select a student first', 'error')
      return
    }
    window.print()
  }

  const handleBulkGenerate = async () => {
    if (!bulkClass) {
      showToast('Please select a class', 'error')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/students?classId=${bulkClass}`)
      const json = await res.json()
      const bulkStudents: Student[] = (json.data ?? []).filter((s: Student) =>
        !bulkSection || s.section === bulkSection
      )
      if (bulkStudents.length === 0) {
        showToast('No students found for the selected criteria', 'error')
      } else {
        setGeneratedIds(prev => {
          const existing = new Set(prev.map(s => s.id))
          const newOnes = bulkStudents.filter(s => !existing.has(s.id))
          return [...newOnes, ...prev]
        })
        showToast(`Generated ${bulkStudents.length} ID cards`, 'success')
      }
    } catch {
      showToast('Failed to generate ID cards', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!selectedStudent) {
      showToast('Please select a student', 'error')
      return
    }
    if (!cardRef.current) return
    const toastId = toast.loading('Generating PDF...')
    try {
      const [html2canvas, jsPDF] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const canvas = await html2canvas.default(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF.default('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`id-card-${selectedStudent.admissionNo || 'student'}.pdf`)
      toast.dismiss(toastId)
      showToast('PDF downloaded successfully', 'success')
    } catch {
      toast.dismiss(toastId)
      showToast('Failed to generate PDF', 'error')
    }
  }

  if (loading && students.length === 0) return <Loading text="Loading students..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Student ID Cards</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Generate and manage student identity cards</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Search Student</CardTitle>
              <CardDescription>Search by name or admission number</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or admission no..."
                  className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
              {searchQuery && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  {filteredStudents.length === 0 ? (
                    <p className="p-3 text-sm text-gray-400">No students found</p>
                  ) : (
                    filteredStudents.map(s => (
                      <button
                        key={s.id}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedStudent?.id === s.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        onClick={() => handleSelectStudent(s)}
                      >
                        {s.photo ? (
                          <img src={s.photo} alt="" loading="lazy" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-gray-500">{s.admissionNo} - Class {s.class}</p>
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
              <CardDescription>Generate ID cards for entire class/section</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1">
                  <Select label="Class" options={classOptions} value={bulkClass} onChange={e => setBulkClass(e.target.value)} />
                </div>
                <div className="flex-1">
                  <Select label="Section" options={sectionOptions} value={bulkSection} onChange={e => setBulkSection(e.target.value)} />
                </div>
                <Button variant="primary" onClick={handleBulkGenerate}>
                  <Users className="mr-2 h-4 w-4" /> Generate All
                </Button>
              </div>
            </CardContent>
          </Card>

          {selectedStudent && (
            <div ref={cardRef}>
              <div className="flex justify-end gap-2 print:hidden">
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
                <Button variant="outline" onClick={handleDownloadPDF}>
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
              </div>
              <div className="mt-4 flex justify-center">
                <StudentIDCard
                  id={selectedStudent.id}
                  name={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                  className={selectedStudent.class}
                  section={selectedStudent.section}
                  fatherName={selectedStudent.guardianName}
                  rollNo={String(selectedStudent.rollNo ?? '')}
                  bloodGroup={selectedStudent.bloodGroup}
                  photoUrl={selectedStudent.photo}
                  schoolName={schoolName}
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
                  {generatedIds.map(s => (
                    <button
                      key={s.id}
                      className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 ${selectedStudent?.id === s.id ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20' : 'border-gray-200'}`}
                      onClick={() => setSelectedStudent(s)}
                    >
                      {s.photo ? (
                        <img src={s.photo} alt="" loading="lazy" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900 dark:text-gray-100">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-gray-500">{s.admissionNo}</p>
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
