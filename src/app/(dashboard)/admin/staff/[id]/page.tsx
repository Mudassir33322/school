'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Pencil, Trash2, Mail, Phone, MapPin, Calendar, User,
  Briefcase, DollarSign, GraduationCap, Award, Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import Modal from '@/components/ui/modal'

interface Staff {
  id: string; firstName: string; lastName: string; employeeId: string
  department: string; designation: string; phone: string; email: string
  address: string; status: string; photo?: string; gender?: string
  dob?: string; joiningDate?: string; basicSalary?: number; createdAt?: string
}

type Tab = 'personal' | 'professional' | 'salary'

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'professional', label: 'Professional', icon: Briefcase },
  { id: 'salary', label: 'Salary', icon: DollarSign },
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

export default function StaffProfilePage() {
  const params = useParams(); const router = useRouter()
  const id = params?.id as string
  const [staff, setStaff] = useState<Staff | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('personal')
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { if (id) fetchStaffData() }, [id])

  async function fetchStaffData() {
    try {
      setLoading(true)
      const res = await fetch(`/api/staff/${id}`)
      if (!res.ok) throw new Error('Failed to fetch staff data')
      const json = await res.json()
      setStaff(json.data ?? json)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load staff data')
    } finally { setLoading(false) }
  }

  async function handleDelete() {
    if (!id) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete staff')
      toast.success('Staff deleted successfully')
      router.push('/admin/staff')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete staff')
    } finally { setDeleting(false) }
  }

  if (loading) return <Loading message="Loading staff profile..." />
  if (!staff) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Users className="h-12 w-12 text-muted-foreground" />
      <p className="text-lg font-medium text-foreground">Staff not found</p>
      <Button variant="primary" onClick={() => router.push('/admin/staff')}>Back to Staff</Button>
    </div>
  )

  const s = staff

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/admin/staff')}><ArrowLeft className="h-4 w-4" /></Button>
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
                ID: {s.employeeId || 'N/A'} | {s.department || 'N/A'} | {s.designation || 'N/A'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/admin/staff/${id}/edit`)}>
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
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {infoRow('Email', s.email, <Mail className="h-4 w-4" />)}
              {infoRow('Phone', s.phone, <Phone className="h-4 w-4" />)}
              {infoRow('Address', s.address, <MapPin className="h-4 w-4" />)}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'professional' && (
        <Card>
          <CardHeader><CardTitle>Professional Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {infoRow('Employee ID', s.employeeId)}
            {infoRow('Department', s.department)}
            {infoRow('Designation', s.designation)}
            {infoRow('Joining Date', s.joiningDate ? new Date(s.joiningDate).toLocaleDateString() : '-')}
            {infoRow('Status', s.status)}
          </CardContent>
        </Card>
      )}

      {activeTab === 'salary' && (
        <Card>
          <CardHeader><CardTitle>Salary Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {infoRow('Basic Salary', s.basicSalary ? `$${s.basicSalary.toLocaleString()}` : '-')}
          </CardContent>
        </Card>
      )}

      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Confirm Delete" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this staff member? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
