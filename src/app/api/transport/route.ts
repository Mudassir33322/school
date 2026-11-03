import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth';
import {
  addRoute,
  getRoutes,
  updateRoute,
  deleteRoute,
  addVehicle,
  getVehicles,
  updateVehicle,
  deleteVehicle,
} from '@/services/transport-service'

export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const type = searchParams.get('type') || 'routes'
    const status = searchParams.get('status') || undefined

    if (type === 'vehicles') {
      const vehicles = await getVehicles(status ? { status } : undefined)
      return NextResponse.json({ success: true, data: vehicles })
    }

    const routes = await getRoutes(status ? { status } : undefined)
    return NextResponse.json({ success: true, data: routes })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const POST = withAuth(async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, ...data } = body

    if (!type) {
      return NextResponse.json(
        { success: false, message: 'type is required' },
        { status: 400 }
      )
    }

    let ok: boolean

    if (type === 'vehicles') {
      if (!data.vehicleNumber) {
        return NextResponse.json(
          { success: false, message: 'vehicleNumber is required' },
          { status: 400 }
        )
      }
      ok = await addVehicle(data)
    } else {
      if (!data.routeName) {
        return NextResponse.json(
          { success: false, message: 'routeName is required' },
          { status: 400 }
        )
      }
      ok = await addRoute(data)
    }

    if (!ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to create' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const PUT = withAuth(async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, type, ...updates } = body

    if (!id || !type) {
      return NextResponse.json(
        { success: false, message: 'id and type are required' },
        { status: 400 }
      )
    }

    let ok: boolean

    if (type === 'vehicles') {
      ok = await updateVehicle(id, updates)
    } else {
      ok = await updateRoute(id, updates)
    }

    if (!ok) {
      return NextResponse.json(
        { success: false, message: 'Not found or update failed' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const DELETE = withAuth(async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, type } = body

    if (!id || !type) {
      return NextResponse.json(
        { success: false, message: 'id and type are required' },
        { status: 400 }
      )
    }

    let ok: boolean

    if (type === 'vehicles') {
      ok = await deleteVehicle(id)
    } else {
      ok = await deleteRoute(id)
    }

    if (!ok) {
      return NextResponse.json(
        { success: false, message: 'Not found or delete failed' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
})
