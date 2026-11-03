import { NextRequest, NextResponse } from 'next/server'
import { issueBook, returnBook, getTransactions, getOverdueBooks } from '@/services/library-service'
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined
    const studentId = searchParams.get('studentId') || undefined
    const overdue = searchParams.get('overdue')

    if (overdue === 'true') {
      const data = await getOverdueBooks()
      return NextResponse.json({ success: true, data })
    }

    const data = await getTransactions({ search, status, studentId })
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
})

export const POST = withAuth(async function POST(request: NextRequest) {
  try {
    const { bookId, studentId, studentName, bookTitle } = await request.json()
    if (!bookId || !studentId) {
      return NextResponse.json({ success: false, message: 'bookId and studentId are required' }, { status: 400 })
    }
    const transaction = await issueBook(bookId, studentId, studentName || '', bookTitle || '')
    if (!transaction) {
      return NextResponse.json({ success: false, message: 'Book not available or issue failed' }, { status: 400 })
    }
    return NextResponse.json({ success: true, data: transaction }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
})

export const PUT = withAuth(async function PUT(request: NextRequest) {
  try {
    const { transactionId, action } = await request.json()
    if (!transactionId || action !== 'return') {
      return NextResponse.json({ success: false, message: 'transactionId and action=return are required' }, { status: 400 })
    }
    const ok = await returnBook(transactionId)
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Transaction not found or return failed' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: { transactionId, status: 'Returned' } })
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
})
