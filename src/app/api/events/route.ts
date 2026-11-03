import { NextRequest, NextResponse } from 'next/server'
import { createEvent, getEvents, updateEvent, deleteEvent, getUpcomingEvents } from '@/services/event-service'
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const upcoming = searchParams.get('upcoming')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const eventType = searchParams.get('eventType')
    const targetAudience = searchParams.get('targetAudience')
    const search = searchParams.get('search')

    if (upcoming === 'true') {
      const events = await getUpcomingEvents(20)
      return NextResponse.json({ success: true, data: events })
    }

    const filters: Record<string, string | undefined> = {}
    if (startDate) filters.startDate = startDate
    if (endDate) filters.endDate = endDate
    if (eventType) filters.eventType = eventType
    if (targetAudience) filters.targetAudience = targetAudience
    if (search) filters.search = search

    const events = await getEvents(Object.keys(filters).length > 0 ? filters : undefined)
    return NextResponse.json({ success: true, data: events })
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
    const { title, description, eventType, startDate, endDate, startTime, endTime, location, targetAudience, color, createdBy, recurring, recurringPattern, attachments } = body

    if (!title || !eventType || !startDate) {
      return NextResponse.json(
        { success: false, message: 'title, eventType, and startDate are required' },
        { status: 400 }
      )
    }

    const ok = await createEvent({
      title, description, eventType, startDate, endDate: endDate || startDate,
      startTime: startTime || '', endTime: endTime || '',
      location: location || '', targetAudience: targetAudience || [],
      color: color || '#3b82f6', createdBy: createdBy || 'admin',
      recurring: false, recurringPattern: '', attachments: [],
    })

    if (!ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to create event' },
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
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'id is required' },
        { status: 400 }
      )
    }

    const ok = await updateEvent(id, updates)
    if (!ok) {
      return NextResponse.json(
        { success: false, message: 'Event not found or update failed' },
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

    const ok = await deleteEvent(id)
    if (!ok) {
      return NextResponse.json(
        { success: false, message: 'Event not found' },
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
