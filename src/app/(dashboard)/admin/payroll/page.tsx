'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { showToast } from '@/components/ui/toast'
import {
  DollarSign,
  Wallet,
  Percent,
  PiggyBank,
  Download,
  CheckCircle,
  Trash2,
  Eye,
  Plus,
  Search,
} from 'lucide-react'
import type { Payroll } from '@/types'

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

const YEARS = Array.from({ length: 10 }, (_, i) => {
  const y = new Date().getFullYear() - 5 + i
  return { value: String(y), label: String(y) }
})

type StatusFilter = 'All' | 'Paid' | 'Pending'

export default function PayrollPage() {
  const [month, setMonth] = useState(String(new Date().getMonth() + 1))
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const fetchPayrolls = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/payroll?month=${month}&year=${year}`)
      if (!res.ok) throw new Error('Failed to fetch payroll data')
      const data = await res.json()
      setPayrolls(Array.isArray(data) ? data : data.payrolls ?? [])
    } catch {
      showToast('Failed to load payroll data', 'error')
      setPayrolls([])
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => {
    fetchPayrolls()
  }, [fetchPayrolls])

  const handleGeneratePayroll = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/payroll/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: parseInt(month), year: parseInt(year) }),
      })
      if (!res.ok) throw new Error('Failed to generate payroll')
      showToast('Payroll generated successfully', 'success')
      fetchPayrolls()
    } catch {
      showToast('Failed to generate payroll', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const handleMarkPaid = async (id: string) => {
    try {
      const res = await fetch(`/api/payroll/${id}/paid`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Failed to update')
      showToast('Marked as paid', 'success')
      fetchPayrolls()
    } catch {
      showToast('Failed to update payroll', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payroll record?')) return
    try {
      const res = await fetch(`/api/payroll/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      showToast('Payroll record deleted', 'success')
      fetchPayrolls()
    } catch {
      showToast('Failed to delete payroll record', 'error')
    }
  }

  const handleViewPayslip = (payroll: Payroll) => {
    showToast('Payslip feature coming soon', 'success')
  }

  const filteredPayrolls = payrolls.filter((p) => {
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter
    const query = search.toLowerCase()
    const matchesSearch =
      !query ||
      p.employeeId.toLowerCase().includes(query) ||
      p.employeeName.toLowerCase().includes(query)
    return matchesStatus && matchesSearch
  })

  const totalSalary = filteredPayrolls.reduce((s, p) => s + p.basicSalary, 0)
  const totalAllowances = filteredPayrolls.reduce((s, p) => s + p.allowances, 0)
  const totalDeductions = filteredPayrolls.reduce((s, p) => s + p.deductions, 0)
  const netPayable = filteredPayrolls.reduce((s, p) => s + p.netSalary, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Payroll Management
        </h1>
        <Button
          variant="primary"
          onClick={handleGeneratePayroll}
          disabled={generating}
        >
          <Plus className="mr-2 h-4 w-4" />
          {generating ? 'Generating...' : 'Generate Payroll'}
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="w-full sm:w-40">
          <Select
            label="Month"
            options={MONTHS}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-40">
          <Select
            label="Year"
            options={YEARS}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>
        <div className="w-full sm:max-w-xs">
          <Input
            label="Search"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="stat">
          <CardContent className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Salary</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${totalSalary.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card variant="stat">
          <CardContent className="flex items-center gap-4">
            <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
              <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Allowances</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${totalAllowances.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card variant="stat">
          <CardContent className="flex items-center gap-4">
            <div className="rounded-lg bg-red-100 p-3 dark:bg-red-900/30">
              <Percent className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Deductions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${totalDeductions.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card variant="stat">
          <CardContent className="flex items-center gap-4">
            <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
              <PiggyBank className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Net Payable</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${netPayable.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['All', 'Paid', 'Pending'] as StatusFilter[]).map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Payroll</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <Loading message="Loading payroll data..." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                  <tr>
                    {['Employee ID', 'Name', 'Type', 'Basic Salary', 'Allowances', 'Deductions', 'Net Salary', 'Status', 'Actions'].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredPayrolls.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No payroll records found
                      </td>
                    </tr>
                  ) : (
                    filteredPayrolls.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-gray-900 dark:text-gray-100">
                          {p.employeeId}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                          {p.employeeName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 capitalize text-gray-700 dark:text-gray-300">
                          {p.employeeType}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-900 dark:text-gray-100">
                          ${p.basicSalary.toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-900 dark:text-gray-100">
                          ${p.allowances.toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-900 dark:text-gray-100">
                          ${p.deductions.toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                          ${p.netSalary.toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <Badge
                            variant={
                              p.status === 'Paid'
                                ? 'success'
                                : p.status === 'Pending'
                                  ? 'warning'
                                  : 'outline'
                            }
                          >
                            {p.status}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewPayslip(p)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {p.status === 'Pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkPaid(p.id)}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(p.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
