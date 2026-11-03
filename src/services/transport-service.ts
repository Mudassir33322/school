import { dbInsert, dbGetAll, dbUpdate, dbDelete, dbQuery } from '@/lib/db'
import { generateId } from '@/lib/utils'

export interface TransportRoute {
  id: string
  routeName: string
  vehicleId: string
  driverName: string
  driverPhone: string
  stops: string[]
  fare: number
  status: string
  createdAt: string
}

export interface TransportVehicle {
  id: string
  vehicleNumber: string
  vehicleType: string
  capacity: number
  driverName: string
  driverPhone: string
  routeId: string
  status: string
  insuranceExpiry: string
  lastService: string
  createdAt: string
}

export async function addRoute(data: {
  routeName: string
  vehicleId?: string
  driverName?: string
  driverPhone?: string
  stops?: string[]
  fare?: number
  status?: string
}): Promise<boolean> {
  const route: Record<string, unknown> = {
    id: generateId(),
    routeName: data.routeName,
    vehicleId: data.vehicleId || '',
    driverName: data.driverName || '',
    driverPhone: data.driverPhone || '',
    stops: data.stops || [],
    fare: data.fare || 0,
    status: data.status || 'Active',
    createdAt: new Date().toISOString(),
  }

  return dbInsert('transport_routes', route)
}

export async function getRoutes(filters?: {
  status?: string
}): Promise<TransportRoute[]> {
  try {
    let routes: TransportRoute[]

    if (filters?.status) {
      routes = await dbQuery<TransportRoute>('transport_routes', { status: filters.status })
    } else {
      routes = await dbGetAll<TransportRoute>('transport_routes')
    }

    return routes.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } catch {
    return []
  }
}

export async function updateRoute(
  id: string,
  updates: Partial<Omit<TransportRoute, 'id' | 'createdAt'>>
): Promise<boolean> {
  try {
    return dbUpdate('transport_routes', id, updates)
  } catch {
    return false
  }
}

export async function deleteRoute(id: string): Promise<boolean> {
  try {
    return dbDelete('transport_routes', id)
  } catch {
    return false
  }
}

export async function addVehicle(data: {
  vehicleNumber: string
  vehicleType?: string
  capacity?: number
  driverName?: string
  driverPhone?: string
  routeId?: string
  status?: string
  insuranceExpiry?: string
  lastService?: string
}): Promise<boolean> {
  const vehicle: Record<string, unknown> = {
    id: generateId(),
    vehicleNumber: data.vehicleNumber,
    vehicleType: data.vehicleType || 'Bus',
    capacity: data.capacity || 40,
    driverName: data.driverName || '',
    driverPhone: data.driverPhone || '',
    routeId: data.routeId || '',
    status: data.status || 'Active',
    insuranceExpiry: data.insuranceExpiry || '',
    lastService: data.lastService || '',
    createdAt: new Date().toISOString(),
  }

  return dbInsert('transport_vehicles', vehicle)
}

export async function getVehicles(filters?: {
  status?: string
}): Promise<TransportVehicle[]> {
  try {
    let vehicles: TransportVehicle[]

    if (filters?.status) {
      vehicles = await dbQuery<TransportVehicle>('transport_vehicles', { status: filters.status })
    } else {
      vehicles = await dbGetAll<TransportVehicle>('transport_vehicles')
    }

    return vehicles.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } catch {
    return []
  }
}

export async function updateVehicle(
  id: string,
  updates: Partial<Omit<TransportVehicle, 'id' | 'createdAt'>>
): Promise<boolean> {
  try {
    return dbUpdate('transport_vehicles', id, updates)
  } catch {
    return false
  }
}

export async function deleteVehicle(id: string): Promise<boolean> {
  try {
    return dbDelete('transport_vehicles', id)
  } catch {
    return false
  }
}
