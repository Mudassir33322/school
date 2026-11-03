import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth';
import {
  sendMessage,
  getConversations,
  getMessages,
  markAsRead,
  getUnreadCount,
  deleteMessage,
} from '@/services/message-service'

export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId')
    const otherUserId = searchParams.get('otherUserId')
    const unread = searchParams.get('unread')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId is required' },
        { status: 400 }
      )
    }

    if (unread === 'true') {
      const count = await getUnreadCount(userId)
      return NextResponse.json({ success: true, data: { count } })
    }

    if (otherUserId) {
      const messages = await getMessages(userId, otherUserId)
      return NextResponse.json({ success: true, data: messages })
    }

    const conversations = await getConversations(userId)
    return NextResponse.json({ success: true, data: conversations })
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
    const { senderId, receiverId, content, subject, parentId } = body

    if (!senderId || !receiverId || !content) {
      return NextResponse.json(
        { success: false, message: 'senderId, receiverId, and content are required' },
        { status: 400 }
      )
    }

    const ok = await sendMessage({ senderId, receiverId, content, subject, parentId })
    if (!ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to send message' },
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
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'id is required' },
        { status: 400 }
      )
    }

    const ok = await markAsRead(id)
    if (!ok) {
      return NextResponse.json(
        { success: false, message: 'Message not found or update failed' },
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
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'id is required' },
        { status: 400 }
      )
    }

    const ok = await deleteMessage(id)
    if (!ok) {
      return NextResponse.json(
        { success: false, message: 'Message not found or delete failed' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: { id } })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
})
