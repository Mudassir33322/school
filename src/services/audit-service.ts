import { dbInsert, dbGetAll, dbQueryRaw } from '@/lib/db'
import { generateId } from '@/lib/utils'

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  entity: string
  entityId: string
  oldData: Record<string, unknown>
  newData: Record<string, unknown>
  ipAddress: string
  createdAt: string
}

export interface AuditLogFilters {
  entity?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
  action?: string
  page?: number
  limit?: number
}

export async function logAudit(
  userId: string,
  userName: string,
  action: string,
  entity: string,
  entityId: string,
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
  ipAddress: string
): Promise<boolean> {
  const entry: Record<string, unknown> = {
    id: generateId(),
    userId,
    userName,
    action,
    entity,
    entityId,
    oldData,
    newData,
    ipAddress,
    createdAt: new Date().toISOString(),
  }

  return dbInsert('audit_logs', entry)
}

export async function getAuditLogs(
  filters: AuditLogFilters = {}
): Promise<{ data: AuditLog[]; total: number }> {
  try {
    const conditions: string[] = []
    const params: unknown[] = []

    if (filters.entity) {
      conditions.push('entity = ?')
      params.push(filters.entity)
    }
    if (filters.userId) {
      conditions.push('userId = ?')
      params.push(filters.userId)
    }
    if (filters.action) {
      conditions.push('action = ?')
      params.push(filters.action)
    }
    if (filters.dateFrom) {
      conditions.push('createdAt >= ?')
      params.push(filters.dateFrom)
    }
    if (filters.dateTo) {
      conditions.push('createdAt <= ?')
      params.push(filters.dateTo)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countResult = await dbQueryRaw<{ count: number }>(
      `SELECT COUNT(*) as count FROM audit_logs ${where}`,
      params
    )
    const total = countResult[0]?.count ?? 0

    const page = filters.page || 1
    const limit = filters.limit || 20
    const offset = (page - 1) * limit

    const data = await dbQueryRaw<AuditLog>(
      `SELECT * FROM audit_logs ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )

    return { data, total }
  } catch {
    return { data: [], total: 0 }
  }
}

export async function getRecentActivity(limit: number = 10): Promise<AuditLog[]> {
  try {
    return await dbQueryRaw<AuditLog>(
      `SELECT * FROM audit_logs ORDER BY createdAt DESC LIMIT ?`,
      [limit]
    )
  } catch {
    return []
  }
}
