'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  BookOpen,
  Users,
  DollarSign,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Heart,
  Globe,
  Shield,
  Upload,
  IdCard,
  Printer,
  Download,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import Modal from '@/components/ui/modal'
import Table from '@/components/ui/table'
import StudentIDCard from '@/components/id-cards/student-card'

interface StudentData {
  id: string; firstName: string; lastName: string; admissionNo: string
  rollNo: string; class: string; section: string; status: string
  photo?: string; gender?: string; dob?: string; bloodGroup?: string
  religion?: string; caste?: string; nationality?: string
  guardianName?: string; guardianRelation?: string; guardianPhone?: string
  guardianEmail?: string; emergencyContactName?: string; emergencyPhone?: string
  address?: string; city?: string; state?: string; pincode?: string
  academicYear?: string; createdAt?: string
}

interface FeeRecord { id: string; feeType: string; amount: number; dueDate: string; paidDate?: string; status: string }
interface AttendanceRecord { id: string; date: string; status: string }

type Tab = 'personal' | 'academic' | 'parent' | 'documents' | 'activity'

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'academic', label: 'Academic', icon: BookOpen },
  { id: 'parent', label: 'Parent/Guardian', icon: Users },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'activity', label: 'Activity', icon: ClipboardCheck },
]

const infoRow = (label: string, value: string | undefined, icon?: React.ReactNode) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
    {icon && <div className="mt-0.5 text-muted-foreground">{icon}</div>}
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground break-words">{value || '-'}</p>
    </div>
  </div>
)

export default function StudentProfilePage() {
  const params = useParams(); const router = useRouter()
  const id = params?.id as string
  const [student, setStudent] = useState<StudentData | null>(null)
  const [fees, setFees] = useState<FeeRecord[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('personal')
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showIdCard, setShowIdCard] = useState(false)
  const [schoolName, setSchoolName] = useState('School Name')
  const cardRef = useRef<HTMLDivElement>(null)


  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(json => {
      const s = json.data || json
      if (s?.schoolName) setSchoolName(s.schoolName)
    }).catch(() => {})
  }, [])

  function handlePrintIdCard() {
    window.print()
  }

  async function handleDownloadIdCard() {
    if (!cardRef.current) return
    try {
      toast.loading('Generating PDF...')
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
      pdf.save(`id-card-${s?.admissionNo || 'student'}.pdf`)
      toast.dismiss()
      toast.success('PDF downloaded successfully')
    } catch {
      toast.dismiss()
      toast.error('Failed to generate PDF')
    }
  }

  useEffect(() => { if (id) fetchStudentData() }, [id])

  async function fetchStudentData() {
    try {
      setLoading(true)
      const [studentRes, feesRes, attendanceRes] = await Promise.all([
        fetch(`/api/students/${id}`), fetch(`/api/fees?studentId=${id}`), fetch(`/api/attendance?studentId=${id}`),
      ])
      if (!studentRes.ok) throw new Error('Failed to fetch student data')
      const studentJson = await studentRes.json()
      setStudent(studentJson.data ?? studentJson)
      if (feesRes.ok) { const j = await feesRes.json(); setFees(j.data ?? []) }
      if (attendanceRes.ok) { const j = await attendanceRes.json(); setAttendance(j.data ?? []) }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load student data')
    } finally { setLoading(false) }
  }

  async function handleDelete() {
    if (!id) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete student')
      toast.success('Student deleted successfully')
      router.push('/admin/students')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete student')
    } finally { setDeleting(false) }
  }

  if (loading) return <Loading message="Loading student profile..." />
  if (!student) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <GraduationCap className="h-12 w-12 text-muted-foreground" />
      <p className="text-lg font-medium text-foreground">Student not found</p>
      <Button variant="primary" onClick={() => router.push('/admin/students')}>Back to Students</Button>
    </div>
  )

  const s = student
  const presentCount = attendance.filter((a) => a.status === 'Present').length
  const totalAttendance = attendance.length
  const presentPercent = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/admin/students')}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex items-center gap-4">
            {s.photo ? (
              <img src={s.photo} alt={`${s.firstName} ${s.lastName}`} loading="lazy" className="h-16 w-16 rounded-full object-cover border-2 border-border" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-xl font-bold text-primary">
                {s.firstName?.charAt(0)}{s.lastName?.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">{s.firstName} {s.lastName}</h1>
                <Badge variant={s.status === 'Active' ? 'success' : 'danger'}>{s.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Adm: {s.admissionNo || 'N/A'} | Roll: {s.rollNo || 'N/A'} | {s.class || 'N/A'} - {s.section || 'N/A'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowIdCard(true)}>
            <IdCard className="h-4 w-4 mr-1.5" /> ID Card
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push(`/admin/students/${id}/edit`)}>
            <Pencil className="h-4 w-4 mr-1.5" /> Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteModal(true)}>
            <Trash2 className="h-4 w-4 mr-1.5" /> Delete
          </Button>
        </div>
      </div>

      <div className="border-b border-border">
        <nav className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              ><Icon className="h-4 w-4" />{tab.label}</button>
            )
          })}
        </nav>
      </div>

      {activeTab === 'personal' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {infoRow('Gender', s.gender, <User className="h-4 w-4" />)}
              {infoRow('Date of Birth', s.dob ? new Date(s.dob).toLocaleDateString() : '-', <Calendar className="h-4 w-4" />)}
              {infoRow('Blood Group', s.bloodGroup, <Heart className="h-4 w-4" />)}
              {infoRow('Nationality', s.nationality, <Globe className="h-4 w-4" />)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Contact & Address</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {infoRow('Religion', s.religion, <Shield className="h-4 w-4" />)}
              {infoRow('Caste', s.caste, <Users className="h-4 w-4" />)}
              {infoRow('Address', [s.address, s.city, s.state, s.pincode].filter(Boolean).join(', '), <MapPin className="h-4 w-4" />)}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'academic' && (
        <Card>
          <CardHeader><CardTitle>Academic Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {infoRow('Class', s.class)}
            {infoRow('Section', s.section)}
            {infoRow('Roll Number', s.rollNo)}
            {infoRow('Admission Number', s.admissionNo)}
            {infoRow('Academic Year', s.academicYear || new Date().getFullYear().toString())}
          </CardContent>
        </Card>
      )}

      {activeTab === 'parent' && (
        <Card>
          <CardHeader><CardTitle>Parent / Guardian Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {infoRow('Guardian Name', s.guardianName)}
            {infoRow('Relation', s.guardianRelation)}
            {infoRow('Phone', s.guardianPhone)}
            {infoRow('Email', s.guardianEmail)}
            {infoRow('Emergency Contact', s.emergencyContactName)}
            {infoRow('Emergency Phone', s.emergencyPhone)}
          </CardContent>
        </Card>
      )}

      {activeTab === 'documents' && (
        <Card>
          <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-xl bg-muted/30">
              <FileText className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">No documents uploaded</p>
              <p className="text-xs text-muted-foreground mt-1">Upload documents from the edit page</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push(`/admin/students/${id}/edit`)}>
                <Upload className="h-4 w-4 mr-1.5" /> Upload Documents
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Attendance Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-accent-light">
                  <p className="text-2xl font-bold text-accent">{presentPercent}%</p>
                  <p className="text-sm text-muted-foreground mt-1">Present</p>
                  <p className="text-xs text-muted-foreground/70">{presentCount} days</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-danger/10">
                  <p className="text-2xl font-bold text-danger">{100 - presentPercent}%</p>
                  <p className="text-sm text-muted-foreground mt-1">Absent</p>
                  <p className="text-xs text-muted-foreground/70">{totalAttendance - presentCount} days</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-primary-light">
                  <p className="text-2xl font-bold text-primary">{totalAttendance}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total Days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent Attendance</CardTitle></CardHeader>
            <CardContent>
              <Table
                columns={[
                  { key: 'date', label: 'Date', render: (v) => new Date(v as string).toLocaleDateString() },
                  { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'Present' ? 'success' : 'danger'}>{v as string}</Badge> },
                ]}
                data={attendance.slice(-10).reverse()}
                emptyMessage="No attendance records found"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Fee History</CardTitle></CardHeader>
            <CardContent>
              <Table
                columns={[
                  { key: 'feeType', label: 'Fee Type' },
                  { key: 'amount', label: 'Amount', render: (v) => `$${Number(v).toLocaleString()}` },
                  { key: 'dueDate', label: 'Due Date', render: (v) => new Date(v as string).toLocaleDateString() },
                  { key: 'status', label: 'Status', render: (v) => {
                    const st = v as string
                    return <Badge variant={st === 'Paid' ? 'success' : st === 'Partial' ? 'warning' : 'danger'}>{st}</Badge>
                  }},
                ]}
                data={fees}
                emptyMessage="No fee records found"
              />
            </CardContent>
          </Card>
        </div>
      )}

      <Modal isOpen={showIdCard} onClose={() => setShowIdCard(false)} title="Student ID Card" size="lg">
        {s && (
          <div className="space-y-4">
            <div ref={cardRef} className="flex justify-center">
              <StudentIDCard
                id={s.id}
                name={`${s.firstName} ${s.lastName}`}
                className={s.class || ''}
                section={s.section || ''}
                fatherName={s.guardianName || ''}
                rollNo={String(s.rollNo ?? '')}
                bloodGroup={s.bloodGroup || ''}
                photoUrl={s.photo || undefined}
                schoolName={schoolName}
              />
            </div>
            <div className="flex justify-center gap-3 print:hidden">
              <Button variant="outline" onClick={handlePrintIdCard}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
              <Button variant="outline" onClick={handleDownloadIdCard}>
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Confirm Delete" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this student? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
