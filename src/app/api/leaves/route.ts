import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth';
import {
  createLeave,
  getLeaves,
  updateLeaveStatus,
  getLeaveBalance,
} from '@/services/leave-service'

export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId')
    const userType = searchParams.get('userType')
    const status = searchParams.get('status')
    const balance = searchParams.get('balance')

    if (balance === 'true' && userId) {
      const leaveBalance = await getLeaveBalance(userId)
      return NextResponse.json({ success: true, data: leaveBalance })
    }

    const leaves = await getLeaves(
      userId || userType || status
        ? { userId: userId || undefined, userType: userType || undefined, status: status || undefined }
        : undefined
    )

    return NextResponse.json({ success: true, data: leaves })
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
    const { userId, userType, leaveType, startDate, endDate, reason } = body

    if (!userId || !userType || !leaveType || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'userId, userType, leaveType, startDate, and endDate are required' },
        { status: 400 }
      )
    }

    const ok = await createLeave({ userId, userType, leaveType, startDate, endDate, reason })
    if (!ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to create leave request' },
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
    const { id, status, approvedBy, remarks } = await request.json()

    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: 'id and status are required' },
        { status: 400 }
      )
    }

    const ok = await updateLeaveStatus(id, status, approvedBy || '', remarks)
    if (!ok) {
      return NextResponse.json(
        { success: false, message: 'Leave request not found or update failed' },
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
