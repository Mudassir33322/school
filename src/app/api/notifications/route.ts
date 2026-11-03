import { NextRequest, NextResponse } from 'next/server';
import { getNotificationsForUser, markAsRead, markAllAsRead } from '@/services/notification-service';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
    }

    const notifications = await getNotificationsForUser(userId);
    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({ success: true, data: notifications, unreadCount });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const POST = withAuth(async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, notificationId, userId } = body;

    if (action === 'markRead' && notificationId) {
      const ok = await markAsRead(notificationId);
      return NextResponse.json({ success: ok });
    }

    if (action === 'markAllRead' && userId) {
      const ok = await markAllAsRead(userId);
      return NextResponse.json({ success: ok });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
