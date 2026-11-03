'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Pencil, Trash2, Mail, Phone, MapPin, Calendar, User,
  BookOpen, Briefcase, DollarSign, ClipboardCheck, GraduationCap, Award,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import Modal from '@/components/ui/modal'

interface Teacher {
  id: string; firstName: string; lastName: string; employeeId: string
  department: string; designation: string; subjects: string[]; classes: string[]
  phone: string; email: string; address: string; status: string
  photo?: string; gender?: string; dob?: string; qualification?: string
  experience?: number; joiningDate?: string; basicSalary?: number; createdAt?: string
}

type Tab = 'personal' | 'professional' | 'salary' | 'documents'

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'professional', label: 'Professional', icon: Briefcase },
  { id: 'salary', label: 'Salary', icon: DollarSign },
  { id: 'documents', label: 'Documents', icon: BookOpen },
]

const infoRow = (label: string, value: string | undefined | number, icon?: React.ReactNode) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
    {icon && <div className="mt-0.5 text-muted-foreground">{icon}</div>}
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground break-words">{value ?? '-'}</p>
    </div>
  </div>
)

export default function TeacherProfilePage() {
  const params = useParams(); const router = useRouter()
  const id = params?.id as string
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('personal')
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { if (id) fetchTeacherData() }, [id])

  async function fetchTeacherData() {
    try {
      setLoading(true)
      const res = await fetch(`/api/teachers/${id}`)
      if (!res.ok) throw new Error('Failed to fetch teacher data')
      const json = await res.json()
      setTeacher(json.data ?? json)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load teacher data')
    } finally { setLoading(false) }
  }

  async function handleDelete() {
    if (!id) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/teachers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete teacher')
      toast.success('Teacher deleted successfully')
      router.push('/admin/teachers')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete teacher')
    } finally { setDeleting(false) }
  }

  if (loading) return <Loading message="Loading teacher profile..." />
  if (!teacher) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <GraduationCap className="h-12 w-12 text-muted-foreground" />
      <p className="text-lg font-medium text-foreground">Teacher not found</p>
      <Button variant="primary" onClick={() => router.push('/admin/teachers')}>Back to Teachers</Button>
    </div>
  )

  const t = teacher

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/admin/teachers')}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex items-center gap-4">
            {t.photo ? (
              <img src={t.photo} alt={`${t.firstName} ${t.lastName}`} loading="lazy" className="h-16 w-16 rounded-full object-cover border-2 border-border" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-xl font-bold text-primary">
                {t.firstName?.charAt(0)}{t.lastName?.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">{t.firstName} {t.lastName}</h1>
                <Badge variant={t.status === 'Active' ? 'success' : 'danger'}>{t.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                ID: {t.employeeId || 'N/A'} | {t.department || 'N/A'} | {t.designation || 'N/A'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/admin/teachers/${id}/edit`)}>
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
              {infoRow('Gender', t.gender, <User className="h-4 w-4" />)}
              {infoRow('Date of Birth', t.dob ? new Date(t.dob).toLocaleDateString() : '-', <Calendar className="h-4 w-4" />)}
              {infoRow('Qualification', t.qualification, <Award className="h-4 w-4" />)}
              {infoRow('Experience', t.experience ? `${t.experience} years` : '-', <Briefcase className="h-4 w-4" />)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {infoRow('Email', t.email, <Mail className="h-4 w-4" />)}
              {infoRow('Phone', t.phone, <Phone className="h-4 w-4" />)}
              {infoRow('Address', t.address, <MapPin className="h-4 w-4" />)}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'professional' && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Professional Information</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {infoRow('Employee ID', t.employeeId)}
              {infoRow('Department', t.department)}
              {infoRow('Designation', t.designation)}
              {infoRow('Joining Date', t.joiningDate ? new Date(t.joiningDate).toLocaleDateString() : '-')}
              {infoRow('Status', t.status)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Subjects & Classes</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Assigned Subjects</p>
                  {t.subjects && t.subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {t.subjects.map((subject) => (
                        <span key={subject} className="inline-flex items-center rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary">
                          {subject}
                        </span>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No subjects assigned</p>}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Assigned Classes</p>
                  {t.classes && t.classes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {t.classes.map((cls) => (
                        <span key={cls} className="inline-flex items-center rounded-full bg-accent-light px-3 py-1 text-xs font-medium text-accent">
                          Class {cls}
                        </span>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No classes assigned</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'salary' && (
        <Card>
          <CardHeader><CardTitle>Salary Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {infoRow('Basic Salary', t.basicSalary ? `$${t.basicSalary.toLocaleString()}` : '-')}
          </CardContent>
        </Card>
      )}

      {activeTab === 'documents' && (
        <Card>
          <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-xl bg-muted/30">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">No documents uploaded</p>
              <p className="text-xs text-muted-foreground mt-1">Upload documents from the edit page</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Confirm Delete" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this teacher? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
