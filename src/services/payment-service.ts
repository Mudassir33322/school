import { dbInsert, dbGetAll, dbUpdate, dbQuery } from '@/lib/db'
import { generateId } from '@/lib/utils'

export interface Payment {
  id: string
  studentId: string
  studentName: string
  feeId: string
  amount: number
  method: string
  transactionId: string
  status: string
  gatewayResponse: Record<string, unknown>
  receiptUrl: string
  paidAt: string
  createdAt: string
}

export interface PaymentFilters {
  studentId?: string
  status?: string
}

export async function createPayment(data: Partial<Payment>): Promise<Payment | null> {
  try {
    const payment: Record<string, unknown> = {
      id: generateId(),
      studentId: data.studentId || '',
      studentName: data.studentName || '',
      feeId: data.feeId || '',
      amount: data.amount || 0,
      method: data.method || '',
      transactionId: '',
      status: 'Pending',
      gatewayResponse: {},
      receiptUrl: '',
      paidAt: '',
      createdAt: new Date().toISOString(),
    }
    const ok = await dbInsert('payments', payment)
    return ok ? (payment as unknown as Payment) : null
  } catch {
    return null
  }
}

export async function getPayments(filters?: PaymentFilters): Promise<Payment[]> {
  try {
    let payments = await dbGetAll<Payment>('payments')

    if (filters?.studentId) {
      payments = payments.filter((p) => p.studentId === filters.studentId)
    }

    if (filters?.status) {
      payments = payments.filter((p) => p.status === filters.status)
    }

    return payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch {
    return []
  }
}

export async function updatePaymentStatus(
  id: string,
  status: string,
  transactionId?: string
): Promise<boolean> {
  try {
    const updates: Record<string, unknown> = { status }
    if (transactionId) updates.transactionId = transactionId
    if (status === 'Completed') updates.paidAt = new Date().toISOString()
    return dbUpdate('payments', id, updates)
  } catch {
    return false
  }
}

export async function getPaymentSummary(): Promise<{
  totalCollected: number
  pending: number
  failed: number
  totalTransactions: number
}> {
  try {
    const payments = await dbGetAll<Payment>('payments')
    const totalCollected = payments
      .filter((p) => p.status === 'Completed')
      .reduce((sum, p) => sum + p.amount, 0)
    const pending = payments
      .filter((p) => p.status === 'Pending')
      .reduce((sum, p) => sum + p.amount, 0)
    const failed = payments
      .filter((p) => p.status === 'Failed')
      .reduce((sum, p) => sum + p.amount, 0)

    return { totalCollected, pending, failed, totalTransactions: payments.length }
  } catch {
    return { totalCollected: 0, pending: 0, failed: 0, totalTransactions: 0 }
  }
}

export async function processRazorpayPayment(data: {
  studentId: string
  studentName?: string
  feeId?: string
  amount: number
}): Promise<Payment | null> {
  try {
    const payment = await createPayment({
      studentId: data.studentId,
      studentName: data.studentName || '',
      feeId: data.feeId || '',
      amount: data.amount,
      method: 'Razorpay',
    })
    if (!payment) return null

    const simulatedSuccess = Math.random() > 0.1
    const transactionId = `rzp_${generateId()}`

    if (simulatedSuccess) {
      await updatePaymentStatus(payment.id, 'Completed', transactionId)
      await dbUpdate('payments', payment.id, {
        gatewayResponse: { razorpay_order_id: `order_${generateId()}`, status: 'captured' },
      })
    } else {
      await updatePaymentStatus(payment.id, 'Failed', transactionId)
    }

    const updated = await dbQuery<Payment>('payments', { id: payment.id })
    return updated[0] || null
  } catch {
    return null
  }
}

export async function processJazzCashPayment(data: {
  studentId: string
  studentName?: string
  feeId?: string
  amount: number
}): Promise<Payment | null> {
  try {
    const payment = await createPayment({
      studentId: data.studentId,
      studentName: data.studentName || '',
      feeId: data.feeId || '',
      amount: data.amount,
      method: 'JazzCash',
    })
    if (!payment) return null

    const simulatedSuccess = Math.random() > 0.1
    const transactionId = `jc_${generateId()}`

    if (simulatedSuccess) {
      await updatePaymentStatus(payment.id, 'Completed', transactionId)
      await dbUpdate('payments', payment.id, {
        gatewayResponse: { jazzcash_ref: transactionId, status: 'SUCCESS' },
      })
    } else {
      await updatePaymentStatus(payment.id, 'Failed', transactionId)
    }

    const updated = await dbQuery<Payment>('payments', { id: payment.id })
    return updated[0] || null
  } catch {
    return null
  }
}

export async function processEasyPaisaPayment(data: {
  studentId: string
  studentName?: string
  feeId?: string
  amount: number
}): Promise<Payment | null> {
  try {
    const payment = await createPayment({
      studentId: data.studentId,
      studentName: data.studentName || '',
      feeId: data.feeId || '',
      amount: data.amount,
      method: 'EasyPaisa',
    })
    if (!payment) return null

    const simulatedSuccess = Math.random() > 0.1
    const transactionId = `ep_${generateId()}`

    if (simulatedSuccess) {
      await updatePaymentStatus(payment.id, 'Completed', transactionId)
      await dbUpdate('payments', payment.id, {
        gatewayResponse: { easypaisa_trx_id: transactionId, status: 'SUCCESS' },
      })
    } else {
      await updatePaymentStatus(payment.id, 'Failed', transactionId)
    }

    const updated = await dbQuery<Payment>('payments', { id: payment.id })
    return updated[0] || null
  } catch {
    return null
  }
}
