'use client'

import { useState } from 'react'
import { Download, Eye, FileText, GraduationCap, Search, User } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Modal from '@/components/ui/modal'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import { showToast } from '@/components/ui/toast'

type CertificateType = 'Bonafide' | 'Character' | 'Leaving' | 'Fee' | 'Custom'

const certificateTypes: { value: CertificateType; label: string }[] = [
  { value: 'Bonafide', label: 'Bonafide Certificate' },
  { value: 'Character', label: 'Character Certificate' },
  { value: 'Leaving', label: 'Leaving Certificate' },
  { value: 'Fee', label: 'Fee Certificate' },
  { value: 'Custom', label: 'Custom Certificate' },
]

interface Student {
  id: string
  name: string
  admissionNo: string
  class: string
  fatherName: string
}

interface GeneratedCertificate {
  id: string
  studentName: string
  type: CertificateType
  generatedDate: string
}

const students: Student[] = [
  { id: '1', name: 'Rahul Kumar', admissionNo: 'ADM001', class: 'Class 10', fatherName: 'Mr. Suresh Kumar' },
  { id: '2', name: 'Priya Sharma', admissionNo: 'ADM002', class: 'Class 10', fatherName: 'Mr. Rajesh Sharma' },
  { id: '3', name: 'Amit Singh', admissionNo: 'ADM003', class: 'Class 9', fatherName: 'Mr. Vikram Singh' },
  { id: '4', name: 'Sneha Patel', admissionNo: 'ADM004', class: 'Class 8', fatherName: 'Mr. Amit Patel' },
]

const certificateTemplates: Record<CertificateType, string> = {
  Bonafide: 'This is to certify that [Student Name], S/o [Father Name], is a bonafide student of [School Name] studying in [Class] during the academic year [Year].',
  Character: 'This is to certify that [Student Name], S/o [Father Name], bears a good moral character. He/She was a student of [School Name] in [Class].',
  Leaving: 'This is to certify that [Student Name], S/o [Father Name], was a student of [School Name] in [Class]. He/She is leaving the school on [Date].',
  Fee: 'This is certified that [Student Name], S/o [Father Name], studying in [Class] has paid all the fees up to [Date].',
  Custom: 'Custom Certificate Template - [Student Name], [Father Name], [Class]',
}

export default function CertificatesPage() {
  const [certType, setCertType] = useState<CertificateType>('Bonafide')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(false)
  const [generatedCerts, setGeneratedCerts] = useState<GeneratedCertificate[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const generatePreview = (student: Student) => {
    if (!student) return ''
    return certificateTemplates[certType]
      .replace(/\[Student Name\]/g, student.name)
      .replace(/\[Father Name\]/g, student.fatherName)
      .replace(/\[Class\]/g, student.class)
      .replace(/\[School Name\]/g, 'Springfield School')
      .replace(/\[Year\]/g, '2025-26')
      .replace(/\[Date\]/g, new Date().toLocaleDateString())
  }

  const handleGenerate = () => {
    if (!selectedStudent) {
      showToast('Please select a student', 'error')
      return
    }
    setLoading(true)
    setTimeout(() => {
      const newCert: GeneratedCertificate = {
        id: String(Date.now()),
        studentName: selectedStudent.name,
        type: certType,
        generatedDate: new Date().toLocaleDateString(),
      }
      setGeneratedCerts(prev => [newCert, ...prev])
      showToast(`${certType} certificate generated for ${selectedStudent.name}`, 'success')
      setLoading(false)
    }, 800)
  }

  const handleDownloadPDF = (cert: GeneratedCertificate) => {
    showToast(`Downloading ${cert.type} certificate for ${cert.studentName}`, 'success')
  }

  if (loading) return <Loading text="Generating certificate..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Certificate Generator</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Generate and manage student certificates</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Generate Certificate</CardTitle>
              <CardDescription>Select certificate type and student</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Certificate Type"
                options={certificateTypes}
                value={certType}
                onChange={e => setCertType(e.target.value as CertificateType)}
              />

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search Student</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or admission no..."
                    className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                {searchQuery && (
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    {filteredStudents.length === 0 ? (
                      <p className="p-3 text-sm text-gray-400">No students found</p>
                    ) : (
                      filteredStudents.map(s => (
                        <button
                          key={s.id}
                          className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedStudent?.id === s.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                          onClick={() => { setSelectedStudent(s); setSearchQuery('') }}
                        >
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{s.name}</p>
                            <p className="text-xs text-gray-500">{s.admissionNo} - {s.class}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {selectedStudent && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-900/20">
                  <p className="text-sm font-medium text-green-800 dark:text-green-400">
                    Selected: {selectedStudent.name} ({selectedStudent.admissionNo})
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="primary" onClick={handleGenerate}>
                  <FileText className="mr-2 h-4 w-4" /> Generate Certificate
                </Button>
                <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                  <Eye className="mr-2 h-4 w-4" /> Preview
                </Button>
              </div>
            </CardContent>
          </Card>

          {showPreview && selectedStudent && (
            <Card>
              <CardHeader>
                <CardTitle>Certificate Preview</CardTitle>
                <CardDescription>{certType} Certificate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 dark:border-gray-600">
                  <div className="mb-4 text-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Springfield School</h2>
                    <p className="text-sm text-gray-500">Affiliated to CBSE, New Delhi</p>
                  </div>
                  <div className="mb-4 text-center">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{certType} Certificate</h3>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <p>Certificate No: {Date.now()}</p>
                    <p>Date: {new Date().toLocaleDateString()}</p>
                    <hr className="my-3 border-gray-200 dark:border-gray-700" />
                    <p className="leading-relaxed">{generatePreview(selectedStudent)}</p>
                  </div>
                  <div className="mt-6 flex justify-between text-sm text-gray-500">
                    <div>___________________</div>
                    <div>___________________</div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <div>Principal</div>
                    <div>Student</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Generated Certificates</CardTitle>
              <CardDescription>Recently generated certificates</CardDescription>
            </CardHeader>
            <CardContent>
              {generatedCerts.length === 0 ? (
                <p className="text-sm text-gray-400">No certificates generated yet</p>
              ) : (
                <div className="space-y-3">
                  {generatedCerts.map(cert => (
                    <div key={cert.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{cert.studentName}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Badge variant="info">{cert.type}</Badge>
                          <span>{cert.generatedDate}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadPDF(cert)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
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
