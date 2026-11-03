import { dbInsert, dbGetAll, dbUpdate, dbDelete } from '@/lib/db'
import { generateId } from '@/lib/utils'

export interface Admission {
  id: string
  applicantName: string
  fatherName: string
  motherName: string
  dateOfBirth: string
  gender: string
  phone: string
  email: string
  address: string
  previousSchool: string
  previousClass: string
  applyingForClass: string
  documents: string[]
  status: string
  remarks: string
  applicationDate: string
  reviewedBy: string
  reviewedAt: string
  createdAt: string
}

export async function applyAdmission(data: Omit<Admission, 'id' | 'createdAt' | 'applicationDate'>): Promise<boolean> {
  return dbInsert('admissions', {
    id: generateId(),
    ...data,
    applicationDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  })
}

export async function getApplications(filters?: { status?: string; search?: string }): Promise<Admission[]> {
  let applications = await dbGetAll<Admission>('admissions')
  if (filters) {
    if (filters.status) applications = applications.filter(a => a.status === filters.status)
    if (filters.search) {
      const s = filters.search.toLowerCase()
      applications = applications.filter(a => a.applicantName.toLowerCase().includes(s) || a.fatherName.toLowerCase().includes(s))
    }
  }
  return applications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function updateApplication(id: string, updates: Partial<Admission>): Promise<boolean> {
  return dbUpdate('admissions', id, updates)
}

export async function reviewApplication(id: string, reviewedBy: string, status: string, remarks: string): Promise<boolean> {
  return dbUpdate('admissions', id, {
    status,
    reviewedBy,
    reviewedAt: new Date().toISOString(),
    remarks,
  })
}

export async function getAdmissionStats(): Promise<Record<string, number>> {
  const applications = await dbGetAll<Admission>('admissions')
  const stats: Record<string, number> = {}
  for (const app of applications) {
    stats[app.status] = (stats[app.status] || 0) + 1
  }
  stats['Total'] = applications.length
  return stats
}

export async function deleteApplication(id: string): Promise<boolean> {
  return dbDelete('admissions', id)
}
