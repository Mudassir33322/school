import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth';
import {
  addHostel,
  getHostels,
  updateHostel,
  deleteHostel,
  addRoom,
  getRooms,
  updateRoom,
  deleteRoom,
  assignRoom,
  vacateRoom,
} from '@/services/hostel-service'

export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const type = searchParams.get('type') || 'hostels'
    const hostelId = searchParams.get('hostelId') || undefined
    const status = searchParams.get('status') || undefined

    if (type === 'rooms') {
      const rooms = await getRooms(hostelId)
      return NextResponse.json({ success: true, data: rooms })
    }

    const hostels = await getHostels(status ? { status } : undefined)
    return NextResponse.json({ success: true, data: hostels })
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
    const { type, action, ...data } = body

    if (!type) {
      return NextResponse.json(
        { success: false, message: 'type is required' },
        { status: 400 }
      )
    }

    if (type === 'rooms') {
      if (action === 'assign') {
        if (!data.roomId || !data.studentId) {
          return NextResponse.json(
            { success: false, message: 'roomId and studentId are required' },
            { status: 400 }
          )
        }
        const ok = await assignRoom(data.roomId, data.studentId)
        if (!ok) {
          return NextResponse.json(
            { success: false, message: 'Room not found or assignment failed' },
            { status: 404 }
          )
        }
        return NextResponse.json({ success: true })
      }

      if (action === 'vacate') {
        if (!data.roomId) {
          return NextResponse.json(
            { success: false, message: 'roomId is required' },
            { status: 400 }
          )
        }
        const ok = await vacateRoom(data.roomId)
        if (!ok) {
          return NextResponse.json(
            { success: false, message: 'Room not found or vacate failed' },
            { status: 404 }
          )
        }
        return NextResponse.json({ success: true })
      }

      if (!data.hostelId || !data.roomNumber) {
        return NextResponse.json(
          { success: false, message: 'hostelId and roomNumber are required' },
          { status: 400 }
        )
      }
      const ok = await addRoom(data)
      if (!ok) {
        return NextResponse.json(
          { success: false, message: 'Failed to create room' },
          { status: 500 }
        )
      }
      return NextResponse.json({ success: true }, { status: 201 })
    }

    if (!data.name) {
      return NextResponse.json(
        { success: false, message: 'name is required' },
        { status: 400 }
      )
    }
    const ok = await addHostel(data)
    if (!ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to create hostel' },
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

    if (type === 'rooms') {
      ok = await updateRoom(id, updates)
    } else {
      ok = await updateHostel(id, updates)
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

    if (type === 'rooms') {
      ok = await deleteRoom(id)
    } else {
      ok = await deleteHostel(id)
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
