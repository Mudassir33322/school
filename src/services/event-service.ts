import { dbInsert, dbGetAll, dbUpdate, dbDelete } from '@/lib/db'
import { generateId } from '@/lib/utils'

export interface Event {
  id: string
  title: string
  description: string
  eventType: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  location: string
  targetAudience: string[]
  color: string
  createdBy: string
  recurring: boolean
  recurringPattern: string
  attachments: string[]
  createdAt: string
}

export async function createEvent(data: Omit<Event, 'id' | 'createdAt'>): Promise<boolean> {
  return dbInsert('events', { id: generateId(), ...data, createdAt: new Date().toISOString() })
}

export async function getEvents(filters?: { startDate?: string; endDate?: string; eventType?: string; targetAudience?: string; search?: string }): Promise<Event[]> {
  let events = await dbGetAll<Event>('events')
  if (filters) {
    if (filters.startDate) events = events.filter(e => e.startDate >= filters.startDate!)
    if (filters.endDate) events = events.filter(e => e.startDate <= filters.endDate!)
    if (filters.eventType) events = events.filter(e => e.eventType === filters.eventType)
    if (filters.targetAudience) events = events.filter(e => Array.isArray(e.targetAudience) && e.targetAudience.includes(filters.targetAudience!))
    if (filters.search) {
      const s = filters.search.toLowerCase()
      events = events.filter(e => e.title.toLowerCase().includes(s) || e.description.toLowerCase().includes(s))
    }
  }
  return events.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<boolean> {
  return dbUpdate('events', id, updates)
}

export async function deleteEvent(id: string): Promise<boolean> {
  return dbDelete('events', id)
}

export async function getUpcomingEvents(limit = 10): Promise<Event[]> {
  const today = new Date().toISOString().split('T')[0]
  const events = await dbGetAll<Event>('events')
  return events
    .filter(e => e.startDate >= today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, limit)
}
