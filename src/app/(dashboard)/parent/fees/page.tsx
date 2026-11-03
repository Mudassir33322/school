'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { showToast } from '@/components/ui/toast'
import Select from '@/components/ui/select'
import Modal from '@/components/ui/modal'
import {
  DollarSign,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  Wallet,
  Receipt,
} from 'lucide-react'
import type { Student, Fee } from '@/types'

export default function FeesPage() {
  const [children, setChildren] = useState<Student[]>([])
  const [selectedChild, setSelectedChild] = useState('')
  const [fees, setFees] = useState<Fee[]>([])
  const [loading, setLoading] = useState(true)
  const [feesLoading, setFeesLoading] = useState(false)
  const [payModal, setPayModal] = useState<Fee | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('Cash')
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const res = await fetch('/api/parent/children')
        if (!res.ok) throw new Error('Failed to fetch children')
        const data = await res.json()
        const list = Array.isArray(data) ? data : data.children ?? []
        setChildren(list)
        if (list.length === 1) setSelectedChild(list[0].id)
      } catch {
        showToast('Failed to load children', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchChildren()
  }, [])

  useEffect(() => {
    if (!selectedChild) return
    const fetchFees = async () => {
      setFeesLoading(true)
      try {
        const res = await fetch(`/api/parent/children/${selectedChild}/fees`)
        if (!res.ok) throw new Error('Failed to fetch fees')
        const data = await res.json()
        setFees(Array.isArray(data) ? data : data.fees ?? [])
      } catch {
        showToast('Failed to load fee records', 'error')
        setFees([])
      } finally {
        setFeesLoading(false)
      }
    }
    fetchFees()
  }, [selectedChild])

  const totalPaid = fees.filter((f) => f.status === 'Paid').reduce((s, f) => s + f.amount, 0)
  const totalDue = fees.reduce((s, f) => s + (f.amount - f.paidAmount), 0)
  const totalAmount = fees.reduce((s, f) => s + f.amount, 0)
  const pendingCount = fees.filter((f) => f.status !== 'Paid').length

  const feeStatusBadge = (status: string) => {
    const variant =
      status === 'Paid'
        ? 'success'
        : status === 'Partial'
          ? 'warning'
          : status === 'Overdue'
            ? 'danger'
            : 'default'
    return (
      <Badge variant={variant as 'success' | 'warning' | 'danger' | 'default'}>{status}</Badge>
    )
  }

  const handlePayFee = (fee: Fee) => {
    setPayModal(fee)
    setPayAmount(String(fee.amount - fee.paidAmount))
    setPayMethod('Cash')
  }

  async function processPayment() {
    if (!payModal) return
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) {
      showToast('Enter a valid amount', 'error')
      return
    }
    setPaying(true)
    try {
      const res = await fetch('/api/fees/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeId: payModal.id,
          amount,
          paymentMode: payMethod,
        }),
      })
      if (!res.ok) throw new Error('Payment failed')
      showToast(`Payment of $${amount.toLocaleString()} successful!`, 'success')
      setPayModal(null)
      if (selectedChild) {
        const fRes = await fetch(`/api/parent/children/${selectedChild}/fees`)
        if (fRes.ok) {
          const fData = await fRes.json()
          setFees(Array.isArray(fData) ? fData : fData.fees ?? [])
        }
      }
    } catch {
      showToast('Payment failed. Please try again.', 'error')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return <Loading message="Loading fees..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="h-6 w-6 text-gray-500 dark:text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Fee Management
        </h1>
      </div>

      {children.length > 1 && (
        <div className="max-w-xs">
          <Select
            label="Select Child"
            options={children.map((c) => ({
              value: c.id,
              label: `${c.firstName} ${c.lastName} (${c.classId})`,
            }))}
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
          />
        </div>
      )}

      {!selectedChild && children.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Select a child to view fees
            </p>
          </CardContent>
        </Card>
      ) : !selectedChild ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              No children linked to your account
            </p>
          </CardContent>
        </Card>
      ) : feesLoading ? (
        <Loading message="Loading fee records..." />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card variant="stat">
              <CardContent className="flex flex-col items-center text-center">
                <Wallet className="mb-2 h-8 w-8 text-blue-500" />
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${totalAmount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Fees</p>
              </CardContent>
            </Card>
            <Card variant="stat">
              <CardContent className="flex flex-col items-center text-center">
                <CheckCircle2 className="mb-2 h-8 w-8 text-green-500" />
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${totalPaid.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Paid</p>
              </CardContent>
            </Card>
            <Card variant="stat">
              <CardContent className="flex flex-col items-center text-center">
                <AlertCircle className="mb-2 h-8 w-8 text-red-500" />
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  ${totalDue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Due</p>
              </CardContent>
            </Card>
            <Card variant="stat">
              <CardContent className="flex flex-col items-center text-center">
                <Clock className="mb-2 h-8 w-8 text-yellow-500" />
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {pendingCount}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fee Records</CardTitle>
                  <CardDescription>All fee transactions and dues</CardDescription>
                </div>
                <Button variant="primary" onClick={() => {
                  const pending = fees.find(f => f.status !== 'Paid')
                  if (pending) handlePayFee(pending)
                  else showToast('No pending fees', 'error')
                }}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay Fee
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {fees.length === 0 ? (
                <div className="px-6 pb-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No fee records found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Paid
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Receipt
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                      {fees.map((fee) => (
                        <tr
                          key={fee.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {fee.category}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                            ${fee.amount.toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                            ${fee.paidAmount.toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {new Date(fee.dueDate).toLocaleDateString()}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            {feeStatusBadge(fee.status)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {fee.receiptNo || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Modal isOpen={!!payModal} onClose={() => setPayModal(null)} title="Pay Fee" size="md">
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Category: <span className="font-medium text-gray-900 dark:text-gray-100">{payModal?.category}</span></p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total: <span className="font-medium text-gray-900 dark:text-gray-100">${payModal?.amount?.toLocaleString()}</span></p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Already Paid: <span className="font-medium text-gray-900 dark:text-gray-100">${payModal?.paidAmount?.toLocaleString()}</span></p>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400 mt-1">Due: ${(payModal ? payModal.amount - payModal.paidAmount : 0).toLocaleString()}</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Amount to Pay</label>
            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <Select
              label="Payment Method"
              value={payMethod}
              onChange={(e: any) => setPayMethod(e.target.value)}
              options={[
                { value: 'Cash', label: 'Cash' },
                { value: 'Bank Transfer', label: 'Bank Transfer' },
                { value: 'Online', label: 'Online' },
                { value: 'Cheque', label: 'Cheque' },
              ]}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setPayModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={processPayment} disabled={paying}>
              {paying ? 'Processing...' : `Pay $${parseFloat(payAmount || '0').toLocaleString()}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
