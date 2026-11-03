import { NextRequest, NextResponse } from 'next/server'
import {
  applyAdmission,
  getApplications,
  updateApplication,
  reviewApplication,
  getAdmissionStats,
} from '@/services/admission-service'
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const stats = searchParams.get('stats')

    if (stats === 'true') {
      const data = await getAdmissionStats()
      return NextResponse.json({ success: true, data })
    }

    const applications = await getApplications(
      status || search
        ? { status: status || undefined, search: search || undefined }
        : undefined
    )

    return NextResponse.json({ success: true, data: applications })
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
    const { applicantName, applyingForClass } = body

    if (!applicantName || !applyingForClass) {
      return NextResponse.json(
        { success: false, message: 'applicantName and applyingForClass are required' },
        { status: 400 }
      )
    }

    const ok = await applyAdmission(body)
    if (!ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to submit admission application' },
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
    const { id, action, reviewedBy, status, remarks, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'id is required' },
        { status: 400 }
      )
    }

    if (action === 'review') {
      if (!reviewedBy || !status) {
        return NextResponse.json(
          { success: false, message: 'reviewedBy and status are required for review' },
          { status: 400 }
        )
      }
      const ok = await reviewApplication(id, reviewedBy, status, remarks || '')
      if (!ok) {
        return NextResponse.json(
          { success: false, message: 'Application not found or review failed' },
          { status: 404 }
        )
      }
    } else {
      const ok = await updateApplication(id, updates)
      if (!ok) {
        return NextResponse.json(
          { success: false, message: 'Application not found or update failed' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
})
