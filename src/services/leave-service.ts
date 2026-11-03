import { dbInsert, dbGetAll, dbUpdate, dbQuery } from '@/lib/db'
import { generateId } from '@/lib/utils'

export interface Leave {
  id: string
  userId: string
  userType: string
  leaveType: string
  startDate: string
  endDate: string
  reason: string
  status: string
  approvedBy: string
  remarks: string
  createdAt: string
}

export async function createLeave(leaveData: {
  userId: string
  userType: string
  leaveType: string
  startDate: string
  endDate: string
  reason?: string
}): Promise<boolean> {
  const leave: Record<string, unknown> = {
    id: generateId(),
    userId: leaveData.userId,
    userType: leaveData.userType,
    leaveType: leaveData.leaveType,
    startDate: leaveData.startDate,
    endDate: leaveData.endDate,
    reason: leaveData.reason || '',
    status: 'Pending',
    approvedBy: '',
    remarks: '',
    createdAt: new Date().toISOString(),
  }

  return dbInsert('leaves', leave)
}

export async function getLeaves(filters?: {
  userId?: string
  userType?: string
  status?: string
}): Promise<Leave[]> {
  try {
    let leaves: Leave[]

    if (filters?.userId) {
      leaves = await dbQuery<Leave>('leaves', { userId: filters.userId })
    } else if (filters?.userType && filters?.status) {
      const all = await dbGetAll<Leave>('leaves')
      leaves = all.filter(
        (l) => l.userType === filters.userType && l.status === filters.status
      )
    } else if (filters?.userType) {
      const all = await dbGetAll<Leave>('leaves')
      leaves = all.filter((l) => l.userType === filters.userType)
    } else if (filters?.status) {
      const all = await dbGetAll<Leave>('leaves')
      leaves = all.filter((l) => l.status === filters.status)
    } else {
      leaves = await dbGetAll<Leave>('leaves')
    }

    return leaves.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } catch {
    return []
  }
}

export async function updateLeaveStatus(
  id: string,
  status: string,
  approvedBy: string,
  remarks?: string
): Promise<boolean> {
  try {
    return dbUpdate('leaves', id, {
      status,
      approvedBy,
      remarks: remarks || '',
    })
  } catch {
    return false
  }
}

export async function getLeaveBalance(userId: string): Promise<{
  total: number
  approved: number
  pending: number
  rejected: number
  remaining: number
}> {
  try {
    const leaves = await dbQuery<Leave>('leaves', { userId })
    const approved = leaves.filter((l) => l.status === 'Approved').length
    const pending = leaves.filter((l) => l.status === 'Pending').length
    const rejected = leaves.filter((l) => l.status === 'Rejected').length
    const total = leaves.length
    const allowedPerYear = 12
    const remaining = Math.max(0, allowedPerYear - approved)

    return { total, approved, pending, rejected, remaining }
  } catch {
    return { total: 0, approved: 0, pending: 0, rejected: 0, remaining: 12 }
  }
}
