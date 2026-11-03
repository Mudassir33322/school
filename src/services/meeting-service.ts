import { dbInsert, dbGetAll, dbUpdate, dbDelete } from '@/lib/db'
import { generateId } from '@/lib/utils'

export interface Meeting {
  id: string
  title: string
  description: string
  meetingType: string
  meetingLink: string
  meetingId: string
  password: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  participants: string[]
  organizerId: string
  status: string
  createdAt: string
}

export async function createMeeting(data: Omit<Meeting, 'id' | 'createdAt'>): Promise<boolean> {
  return dbInsert('meetings', { id: generateId(), ...data, createdAt: new Date().toISOString() })
}

export async function getMeetings(filters?: { status?: string; date?: string; search?: string }): Promise<Meeting[]> {
  let meetings = await dbGetAll<Meeting>('meetings')
  if (filters) {
    if (filters.status) meetings = meetings.filter(m => m.status === filters.status)
    if (filters.date) meetings = meetings.filter(m => m.scheduledDate === filters.date)
    if (filters.search) {
      const s = filters.search.toLowerCase()
      meetings = meetings.filter(m => m.title.toLowerCase().includes(s) || m.description.toLowerCase().includes(s))
    }
  }
  return meetings.sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
}

export async function updateMeeting(id: string, updates: Partial<Meeting>): Promise<boolean> {
  return dbUpdate('meetings', id, updates)
}

export async function deleteMeeting(id: string): Promise<boolean> {
  return dbDelete('meetings', id)
}

export async function getUpcomingMeetings(limit = 10): Promise<Meeting[]> {
  const today = new Date().toISOString().split('T')[0]
  const meetings = await dbGetAll<Meeting>('meetings')
  return meetings
    .filter(m => m.scheduledDate >= today && m.status === 'Scheduled')
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, limit)
}
