import { NextRequest, NextResponse } from 'next/server'
import { addBook, getBooks, updateBook } from '@/services/library-service'
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const search = searchParams.get('search') || undefined
    const category = searchParams.get('category') || undefined

    const data = await getBooks({ search, category })
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
})

export const POST = withAuth(async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const book = await addBook(body)
    if (!book) {
      return NextResponse.json({ success: false, message: 'Failed to add book' }, { status: 500 })
    }
    return NextResponse.json({ success: true, data: book }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
})

export const PUT = withAuth(async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json()
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 })
    }
    const ok = await updateBook(id, updates)
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Book not found or update failed' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: { id, ...updates } })
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
})
