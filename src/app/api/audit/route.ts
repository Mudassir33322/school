import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogs, logAudit } from '@/services/audit-service'
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const entity = searchParams.get('entity') || undefined
    const userId = searchParams.get('userId') || undefined
    const action = searchParams.get('action') || undefined
    const dateFrom = searchParams.get('dateFrom') || undefined
    const dateTo = searchParams.get('dateTo') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await getAuditLogs({
      entity,
      userId,
      action,
      dateFrom,
      dateTo,
      page,
      limit,
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    })
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
    const { userId, userName, action, entity, entityId, oldData, newData, ipAddress } = body

    if (!userId || !action || !entity) {
      return NextResponse.json(
        { success: false, message: 'userId, action, and entity are required' },
        { status: 400 }
      )
    }

    const ip = ipAddress || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''

    const success = await logAudit(
      userId,
      userName || '',
      action,
      entity,
      entityId || '',
      oldData || {},
      newData || {},
      ip
    )

    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Failed to create audit log' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Audit log created' }, { status: 201 })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
})
