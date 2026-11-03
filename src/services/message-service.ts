import { dbInsert, dbGetAll, dbUpdate, dbDelete, dbQuery } from '@/lib/db'
import { generateId } from '@/lib/utils'

export interface Message {
  id: string
  senderId: string
  senderName: string
  senderRole: string
  receiverId: string
  receiverName: string
  subject: string
  content: string
  read: boolean
  parentId: string
  attachments: string[]
  createdAt: string
}

export async function sendMessage(data: {
  senderId: string
  receiverId: string
  content: string
  subject?: string
  parentId?: string
}): Promise<boolean> {
  const users = await dbGetAll<Record<string, unknown>>('users')
  const sender = users.find(u => u.id === data.senderId) as Record<string, unknown> | undefined
  const receiver = users.find(u => u.id === data.receiverId) as Record<string, unknown> | undefined

  const message: Record<string, unknown> = {
    id: generateId(),
    senderId: data.senderId,
    senderName: sender ? String(sender.name || '') : '',
    senderRole: sender ? String(sender.role || '') : '',
    receiverId: data.receiverId,
    receiverName: receiver ? String(receiver.name || '') : '',
    subject: data.subject || '',
    content: data.content,
    read: false,
    parentId: data.parentId || '',
    attachments: [],
    createdAt: new Date().toISOString(),
  }

  return dbInsert('messages', message)
}

export async function getConversations(userId: string): Promise<Record<string, Message[]>> {
  try {
    const all = await dbGetAll<Message>('messages')
    const userMessages = all.filter(m => m.senderId === userId || m.receiverId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const conversations: Record<string, Message[]> = {}
    for (const msg of userMessages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId
      if (!conversations[partnerId]) {
        conversations[partnerId] = []
      }
      conversations[partnerId].push(msg)
    }

    return conversations
  } catch {
    return {}
  }
}

export async function getMessages(userId: string, otherUserId: string): Promise<Message[]> {
  try {
    const all = await dbGetAll<Message>('messages')
    return all
      .filter(m =>
        (m.senderId === userId && m.receiverId === otherUserId) ||
        (m.senderId === otherUserId && m.receiverId === userId)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  } catch {
    return []
  }
}

export async function markAsRead(messageId: string): Promise<boolean> {
  try {
    return dbUpdate('messages', messageId, { read: true })
  } catch {
    return false
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const all = await dbGetAll<Message>('messages')
    return all.filter(m => m.receiverId === userId && !m.read).length
  } catch {
    return 0
  }
}

export async function deleteMessage(id: string): Promise<boolean> {
  try {
    return dbDelete('messages', id)
  } catch {
    return false
  }
}
