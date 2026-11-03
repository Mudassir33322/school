'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  Wallet,
  AlertCircle,
  TrendingUp,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  CreditCard,
  Banknote,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Modal from '@/components/ui/modal'
import Table from '@/components/ui/table'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'

interface Payment {
  id: string
  studentName: string
  studentId: string
  amount: number
  method: 'Razorpay' | 'JazzCash' | 'EasyPaisa'
  transactionId: string
  gatewayResponse: string
  status: 'Pending' | 'Completed' | 'Failed'
  date: string
  receiptNo: string
}

interface PaymentStats {
  totalCollected: number
  pendingAmount: number
  failedAmount: number
  totalTransactions: number
}

const methodOptions = [
  { value: 'Razorpay', label: 'Razorpay' },
  { value: 'JazzCash', label: 'JazzCash' },
  { value: 'EasyPaisa', label: 'EasyPaisa' },
]

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Failed', label: 'Failed' },
]

const statusVariant: Record<string, 'warning' | 'success' | 'danger' | 'info'> = {
  Pending: 'warning',
  Completed: 'success',
  Failed: 'danger',
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [showProcessModal, setShowProcessModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [processing, setProcessing] = useState(false)
  const [stats, setStats] = useState<PaymentStats>({ totalCollected: 0, pendingAmount: 0, failedAmount: 0, totalTransactions: 0 })

  const [form, setForm] = useState({
    studentId: '',
    studentName: '',
    amount: '',
    method: 'Razorpay' as 'Razorpay' | 'JazzCash' | 'EasyPaisa',
  })

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/payments?${params}`)
      if (!res.ok) throw new Error('Failed to fetch payments')
      const json = await res.json()
      const data = json.data ?? []
      setPayments(data)
      const completed = data.filter((p: Payment) => p.status === 'Completed')
      const pending = data.filter((p: Payment) => p.status === 'Pending')
      const failed = data.filter((p: Payment) => p.status === 'Failed')
      setStats({
        totalCollected: completed.reduce((s: number, p: Payment) => s + p.amount, 0),
        pendingAmount: pending.reduce((s: number, p: Payment) => s + p.amount, 0),
        failedAmount: failed.reduce((s: number, p: Payment) => s + p.amount, 0),
        totalTransactions: data.length,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load payments')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  function resetForm() {
    setForm({ studentId: '', studentName: '', amount: '', method: 'Razorpay' })
  }

  function generateTransactionId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = 'TXN'
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  async function handleProcessPayment() {
    if (!form.studentId || !form.studentName || !form.amount || Number(form.amount) <= 0) {
      toast.error('Please fill in all required fields')
      return
    }
    setProcessing(true)
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    await delay(2000)
    try {
      const transactionId = generateTransactionId()
      const gatewayResponse = `Payment ${Math.random() > 0.2 ? 'approved' : 'declined'} | Ref: ${transactionId}`
      const simulatedStatus: 'Completed' | 'Failed' = Math.random() > 0.2 ? 'Completed' : 'Failed'
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: form.studentId,
          studentName: form.studentName,
          amount: Number(form.amount),
          method: form.method,
          transactionId,
          gatewayResponse,
          status: simulatedStatus,
        }),
      })
      if (!res.ok) throw new Error('Failed to process payment')
      toast.success(simulatedStatus === 'Completed' ? 'Payment processed successfully' : 'Payment failed')
      setShowProcessModal(false)
      resetForm()
      fetchPayments()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to process payment')
    } finally {
      setProcessing(false)
    }
  }

  function viewReceipt(payment: Payment) {
    setSelectedPayment(payment)
    setShowReceiptModal(true)
  }

  const columns = [
    { key: 'date', label: 'Date', render: (_: unknown, row: Payment) => new Date(row.date).toLocaleDateString() },
    { key: 'studentName', label: 'Student Name' },
    { key: 'amount', label: 'Amount', render: (_: unknown, row: Payment) => `PKR ${row.amount.toLocaleString()}` },
    {
      key: 'method',
      label: 'Method',
      render: (_: unknown, row: Payment) => {
        const Icon = row.method === 'Razorpay' ? CreditCard : Banknote
        return (
          <div className="flex items-center gap-1.5">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span>{row.method}</span>
          </div>
        )
      },
    },
    { key: 'transactionId', label: 'Transaction ID' },
    {
      key: 'status',
      label: 'Status',
      render: (_: unknown, row: Payment) => (
        <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
      ),
    },
  ]

  const summaryCards = [
    { label: 'Total Collected', value: `PKR ${stats.totalCollected.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Pending', value: `PKR ${stats.pendingAmount.toLocaleString()}`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { label: 'Failed', value: `PKR ${stats.failedAmount.toLocaleString()}`, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
    { label: 'Transactions', value: stats.totalTransactions, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Online Fee Payments</h1>
          <p className="text-muted-foreground mt-1">Process and manage online fee transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchPayments}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button variant="primary" onClick={() => setShowProcessModal(true)}>
            <DollarSign className="h-4 w-4 mr-2" /> Process Payment
          </Button>
        </div>
      </motion.div>

      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
        initial="hidden" animate="show">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <motion.div key={card.label} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
              <Card variant="stat">
                <div className={`p-2.5 rounded-lg w-fit ${card.bg}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-48">
                <Select
                  label="Status Filter"
                  options={statusOptions}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button variant="primary" onClick={fetchPayments}>
                  Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {loading ? (
        <Loading text="Loading payments..." />
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle>Payment Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table
                columns={columns}
                data={payments}
                loading={false}
                actions={(row: Payment) => (
                  <div className="flex items-center gap-1">
                    {row.status === 'Completed' && (
                      <Button variant="ghost" size="sm" onClick={() => viewReceipt(row)} title="View Receipt">
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => viewReceipt(row)} title="Details">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Modal isOpen={showProcessModal} onClose={() => { setShowProcessModal(false); resetForm() }} title="Process Payment" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Student ID *"
              value={form.studentId}
              onChange={(e) => setForm(f => ({ ...f, studentId: e.target.value }))}
              placeholder="Enter student ID"
            />
            <Input
              label="Student Name *"
              value={form.studentName}
              onChange={(e) => setForm(f => ({ ...f, studentName: e.target.value }))}
              placeholder="Enter student name"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Amount (PKR) *"
              type="number"
              value={form.amount}
              onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="Enter amount"
            />
            <Select
              label="Payment Method"
              options={methodOptions}
              value={form.method}
              onChange={(e) => setForm(f => ({ ...f, method: e.target.value as 'Razorpay' | 'JazzCash' | 'EasyPaisa' }))}
            />
          </div>
          {processing && (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full" />
              <p className="text-sm text-muted-foreground">Processing payment through {form.method}...</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowProcessModal(false); resetForm() }} disabled={processing}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleProcessPayment} disabled={processing}>
              {processing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay Now
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showReceiptModal} onClose={() => { setShowReceiptModal(false); setSelectedPayment(null) }} title="Payment Receipt" size="md">
        {selectedPayment && (
          <div className="space-y-4">
            <div className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-sm font-semibold text-foreground">Receipt #{selectedPayment.receiptNo}</h3>
                <Badge variant={statusVariant[selectedPayment.status]}>{selectedPayment.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Student Name</p>
                  <p className="font-medium text-foreground">{selectedPayment.studentName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Student ID</p>
                  <p className="font-medium text-foreground">{selectedPayment.studentId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium text-foreground">PKR {selectedPayment.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <p className="font-medium text-foreground">{selectedPayment.method}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Transaction ID</p>
                  <p className="font-medium text-foreground font-mono text-xs">{selectedPayment.transactionId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium text-foreground">{new Date(selectedPayment.date).toLocaleString()}</p>
                </div>
              </div>
              <div className="border-t border-border pt-2">
                <p className="text-muted-foreground text-sm">Gateway Response</p>
                <p className="text-sm text-foreground font-mono">{typeof selectedPayment.gatewayResponse === 'object' ? JSON.stringify(selectedPayment.gatewayResponse) : selectedPayment.gatewayResponse}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => toast.success('Receipt download started')}>
                <Download className="h-4 w-4 mr-2" /> Download Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
