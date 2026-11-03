import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth';
import {
  createMeeting,
  getMeetings,
  updateMeeting,
  deleteMeeting,
} from '@/services/meeting-service'

export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const status = searchParams.get('status')
    const date = searchParams.get('date')
    const search = searchParams.get('search')

    const meetings = await getMeetings(
      status || date || search
        ? { status: status || undefined, date: date || undefined, search: search || undefined }
        : undefined
    )

    return NextResponse.json({ success: true, data: meetings })
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
    const { title, meetingType, meetingLink, scheduledDate, scheduledTime } = body

    if (!title || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { success: false, message: 'title, scheduledDate, and scheduledTime are required' },
        { status: 400 }
      )
    }

    const ok = await createMeeting(body)
    if (!ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to create meeting' },
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
    const { id, ...updates } = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'id is required' },
        { status: 400 }
      )
    }

    const ok = await updateMeeting(id, updates)
    if (!ok) {
      return NextResponse.json(
        { success: false, message: 'Meeting not found or update failed' },
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
    const { searchParams } = request.nextUrl
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'id is required' },
        { status: 400 }
      )
    }

    const ok = await deleteMeeting(id)
    if (!ok) {
      return NextResponse.json(
        { success: false, message: 'Meeting not found' },
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
