import { dbInsert, dbGetAll, dbUpdate, dbDelete, dbQuery } from '@/lib/db'
import { generateId } from '@/lib/utils'

export interface Hostel {
  id: string
  name: string
  type: string
  wardenName: string
  wardenPhone: string
  totalRooms: number
  occupiedRooms: number
  address: string
  status: string
  createdAt: string
}

export interface HostelRoom {
  id: string
  hostelId: string
  roomNumber: string
  roomType: string
  capacity: number
  occupied: number
  rent: number
  facilities: string[]
  status: string
  createdAt: string
}

export async function addHostel(data: {
  name: string
  type?: string
  wardenName?: string
  wardenPhone?: string
  totalRooms?: number
  occupiedRooms?: number
  address?: string
  status?: string
}): Promise<boolean> {
  const hostel: Record<string, unknown> = {
    id: generateId(),
    name: data.name,
    type: data.type || 'Boys',
    wardenName: data.wardenName || '',
    wardenPhone: data.wardenPhone || '',
    totalRooms: data.totalRooms || 0,
    occupiedRooms: data.occupiedRooms || 0,
    address: data.address || '',
    status: data.status || 'Active',
    createdAt: new Date().toISOString(),
  }

  return dbInsert('hostels', hostel)
}

export async function getHostels(filters?: {
  status?: string
}): Promise<Hostel[]> {
  try {
    let hostels: Hostel[]

    if (filters?.status) {
      hostels = await dbQuery<Hostel>('hostels', { status: filters.status })
    } else {
      hostels = await dbGetAll<Hostel>('hostels')
    }

    return hostels.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } catch {
    return []
  }
}

export async function updateHostel(
  id: string,
  updates: Partial<Omit<Hostel, 'id' | 'createdAt'>>
): Promise<boolean> {
  try {
    return dbUpdate('hostels', id, updates)
  } catch {
    return false
  }
}

export async function deleteHostel(id: string): Promise<boolean> {
  try {
    return dbDelete('hostels', id)
  } catch {
    return false
  }
}

export async function addRoom(data: {
  hostelId: string
  roomNumber: string
  roomType?: string
  capacity?: number
  occupied?: number
  rent?: number
  facilities?: string[]
  status?: string
}): Promise<boolean> {
  const room: Record<string, unknown> = {
    id: generateId(),
    hostelId: data.hostelId,
    roomNumber: data.roomNumber,
    roomType: data.roomType || 'Standard',
    capacity: data.capacity || 4,
    occupied: data.occupied || 0,
    rent: data.rent || 0,
    facilities: data.facilities || [],
    status: data.status || 'Available',
    createdAt: new Date().toISOString(),
  }

  return dbInsert('hostel_rooms', room)
}

export async function getRooms(hostelId?: string): Promise<HostelRoom[]> {
  try {
    let rooms: HostelRoom[]

    if (hostelId) {
      rooms = await dbQuery<HostelRoom>('hostel_rooms', { hostelId })
    } else {
      rooms = await dbGetAll<HostelRoom>('hostel_rooms')
    }

    return rooms.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } catch {
    return []
  }
}

export async function updateRoom(
  id: string,
  updates: Partial<Omit<HostelRoom, 'id' | 'createdAt'>>
): Promise<boolean> {
  try {
    return dbUpdate('hostel_rooms', id, updates)
  } catch {
    return false
  }
}

export async function deleteRoom(id: string): Promise<boolean> {
  try {
    return dbDelete('hostel_rooms', id)
  } catch {
    return false
  }
}

export async function assignRoom(roomId: string, studentId: string): Promise<boolean> {
  try {
    const rooms = await dbQuery<HostelRoom>('hostel_rooms', { id: roomId })
    const room = rooms[0]
    if (!room) return false

    const newOccupied = room.occupied + 1
    const newStatus = newOccupied >= room.capacity ? 'Full' : 'Occupied'

    return dbUpdate('hostel_rooms', roomId, {
      occupied: newOccupied,
      status: newStatus,
    })
  } catch {
    return false
  }
}

export async function vacateRoom(roomId: string): Promise<boolean> {
  try {
    const rooms = await dbQuery<HostelRoom>('hostel_rooms', { id: roomId })
    const room = rooms[0]
    if (!room) return false

    const newOccupied = Math.max(0, room.occupied - 1)
    const newStatus = newOccupied === 0 ? 'Available' : newOccupied >= room.capacity ? 'Full' : 'Occupied'

    return dbUpdate('hostel_rooms', roomId, {
      occupied: newOccupied,
      status: newStatus,
    })
  } catch {
    return false
  }
}
