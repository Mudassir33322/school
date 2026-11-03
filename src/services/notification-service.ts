import { dbGetAll, dbInsert } from '@/lib/db'
import { generateId } from '@/lib/utils'

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  read: boolean
  link?: string
  createdAt: string
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'warning' | 'success' | 'error' = 'info',
  link?: string
): Promise<boolean> {
  const notification: Record<string, unknown> = {
    id: generateId(),
    userId,
    title,
    message,
    type,
    read: false,
    link: link || '',
    createdAt: new Date().toISOString(),
  }

  return dbInsert('notifications', notification)
}

export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
  try {
    const all = await dbGetAll<Notification>('notifications')
    return all
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50)
  } catch {
    return []
  }
}

export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    const { dbUpdate } = await import('@/lib/db')
    return dbUpdate('notifications', notificationId, { read: true })
  } catch {
    return false
  }
}

export async function markAllAsRead(userId: string): Promise<boolean> {
  try {
    const notifications = await getNotificationsForUser(userId)
    const unread = notifications.filter((n) => !n.read)
    const { dbUpdate } = await import('@/lib/db')
    for (const n of unread) {
      await dbUpdate('notifications', n.id, { read: true })
    }
    return true
  } catch {
    return false
  }
}

export async function checkFeeReminders(): Promise<void> {
  try {
    const fees = await dbGetAll<Record<string, unknown>>('fees')
    const today = new Date()
    const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)

    for (const fee of fees) {
      if (fee.status === 'Unpaid' || fee.status === 'Partial') {
        const dueDate = new Date(fee.dueDate as string)
        if (dueDate <= threeDaysLater && dueDate >= today) {
          await createNotification(
            String(fee.studentId),
            'Fee Due Reminder',
            `Fee of ₹${fee.amount} is due on ${dueDate.toLocaleDateString()}. Please pay before the due date.`,
            'warning',
            '/student/fees'
          )
        }
      }
    }
  } catch {
    // silently fail
  }
}

export async function checkAttendanceAlerts(): Promise<void> {
  try {
    const attendance = await dbGetAll<Record<string, unknown>>('attendance')
    const studentAbsences: Record<string, number> = {}

    for (const record of attendance) {
      if (record.status === 'Absent') {
        const studentId = String(record.studentId)
        studentAbsences[studentId] = (studentAbsences[studentId] || 0) + 1
      }
    }

    for (const [studentId, absences] of Object.entries(studentAbsences)) {
      if (absences >= 3) {
        await createNotification(
          studentId,
          'Attendance Warning',
          `You have been absent ${absences} times. Please ensure regular attendance.`,
          'error',
          '/student/attendance'
        )
      }
    }
  } catch {
    // silently fail
  }
}
