'use client'

import { useState, useEffect, useMemo } from 'react'
import { Download, DollarSign, CreditCard, AlertTriangle, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import Table from '@/components/ui/table'

interface FeeRecord {
  id: string
  date: string
  category: string
  amount: number
  paid: number
  status: string
  receiptNo?: string
  dueDate?: string
  studentId?: string
}

export default function MyFeesPage() {
  const [records, setRecords] = useState<FeeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFees()
  }, [])

  async function fetchFees() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/fees')
      if (!res.ok) throw new Error('Failed to fetch fee records')
      const json = await res.json()
      setRecords(json.data ?? [])
      toast.success('Fee records loaded')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load fees'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const totals = useMemo(() => {
    const totalFees = records.reduce((sum, r) => sum + (r.amount || 0), 0)
    const totalPaid = records
      .filter((r) => r.status === 'paid')
      .reduce((sum, r) => sum + (r.paid || r.amount || 0), 0)
    const totalPending = records
      .filter((r) => r.status !== 'paid')
      .reduce((sum, r) => sum + (r.amount || 0), 0)
    const pendingRecords = records.filter((r) => r.status !== 'paid')
    const earliestDue = pendingRecords.length > 0
      ? pendingRecords.reduce((earliest, r) => {
          if (!r.dueDate) return earliest
          return !earliest || new Date(r.dueDate) < new Date(earliest) ? r.dueDate : earliest
        }, '' as string)
      : null
    return { totalFees, totalPaid, totalPending, dueDate: earliestDue }
  }, [records])

  function getStatusBadge(status: string) {
    const s = status?.toLowerCase()
    if (s === 'paid') return <Badge variant="success">Paid</Badge>
    if (s === 'partial') return <Badge variant="warning">Partial</Badge>
    return <Badge variant="danger">Pending</Badge>
  }

  function handleDownloadReceipt(record: FeeRecord) {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.text('Fee Receipt', 105, 20, { align: 'center' })
      doc.setFontSize(12)
      doc.text(`Receipt No: ${record.receiptNo || 'N/A'}`, 20, 40)
      doc.text(`Date: ${new Date(record.date).toLocaleDateString()}`, 20, 50)
      doc.text(`Category: ${record.category}`, 20, 60)
      doc.text(`Amount: $${(record.amount || 0).toLocaleString()}`, 20, 70)
      doc.text(`Paid: $${(record.paid || 0).toLocaleString()}`, 20, 80)
      doc.text(`Status: ${record.status}`, 20, 90)
      doc.save(`fee-receipt-${record.receiptNo || record.id}.pdf`)
      toast.success('Receipt downloaded!')
    }).catch(() => toast.error('Failed to generate receipt'))
  }

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (_v: unknown, row: FeeRecord) => new Date(row.date).toLocaleDateString(),
    },
    { key: 'category', label: 'Category' },
    {
      key: 'amount',
      label: 'Amount',
      render: (_v: unknown, row: FeeRecord) => `$${(row.amount || 0).toLocaleString()}`,
    },
    {
      key: 'paid',
      label: 'Paid',
      render: (_v: unknown, row: FeeRecord) => `$${(row.paid || 0).toLocaleString()}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (_v: unknown, row: FeeRecord) => getStatusBadge(row.status),
    },
    { key: 'receiptNo', label: 'Receipt No', render: (_v: unknown, row: FeeRecord) => row.receiptNo || '-' },
  ]

  if (loading) return <Loading text="Loading fee records..." />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{error}</p>
        <Button variant="primary" onClick={fetchFees}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Fees</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">View your fee records and payments</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="stat">
          <div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Fees</p>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              ${totals.totalFees.toLocaleString()}
            </p>
          </div>
        </Card>
        <Card variant="stat">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-green-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Paid</p>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              ${totals.totalPaid.toLocaleString()}
            </p>
          </div>
        </Card>
        <Card variant="stat">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
              ${totals.totalPending.toLocaleString()}
            </p>
          </div>
        </Card>
        <Card variant="stat">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Due Date</p>
            </div>
            <p className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-1">
              {totals.dueDate ? new Date(totals.dueDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fee Records</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchFees}>
              <Calendar className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table
            columns={columns}
            data={records}
            actions={(row: FeeRecord) =>
              row.status === 'paid' ? (
                <Button variant="ghost" size="sm" onClick={() => handleDownloadReceipt(row)}>
                  <Download className="h-4 w-4 mr-1" />
                  Receipt
                </Button>
              ) : null
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
