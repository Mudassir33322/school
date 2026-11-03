'use client'

import { useState } from 'react'
import {
  Search,
  User,
  Mail,
  Phone,
  CheckCircle,
  Printer,
  Receipt,
  DollarSign,
  CreditCard,
  Banknote,
  Landmark,
  Wallet,
  AlertCircle,
  FileText,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import Modal from '@/components/ui/modal'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'

interface StudentInfo {
  id: string
  firstName: string
  lastName: string
  admissionNo: string
  className: string
  sectionName: string
  parentContact: string
  parentEmail: string
}

interface FeeCategory {
  key: string
  label: string
  selected: boolean
  amount: string
}

interface ReceiptData {
  receiptNo: string
  student: StudentInfo
  categories: FeeCategory[]
  totalAmount: number
  fine: number
  grandTotal: number
  paymentMode: string
  date: string
}

const paymentModes = [
  { value: 'Cash', label: 'Cash', icon: Banknote },
  { value: 'Card', label: 'Card', icon: CreditCard },
  { value: 'Online', label: 'Online', icon: Wallet },
  { value: 'Cheque', label: 'Cheque', icon: Landmark },
  { value: 'Demand Draft', label: 'Demand Draft', icon: FileText },
]

const defaultCategories: FeeCategory[] = [
  { key: 'Admission', label: 'Admission Fee', selected: false, amount: '' },
  { key: 'Monthly', label: 'Monthly Fee', selected: false, amount: '' },
  { key: 'Exam', label: 'Exam Fee', selected: false, amount: '' },
  { key: 'Transport', label: 'Transport Fee', selected: false, amount: '' },
]

export default function FeeCollectPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [student, setStudent] = useState<StudentInfo | null>(null)
  const [categories, setCategories] = useState<FeeCategory[]>(defaultCategories)
  const [fine, setFine] = useState('0')
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [submitting, setSubmitting] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)

  function toggleCategory(key: string) {
    setCategories((prev) =>
      prev.map((c) => (c.key === key ? { ...c, selected: !c.selected } : c))
    )
  }

  function updateCategoryAmount(key: string, amount: string) {
    setCategories((prev) =>
      prev.map((c) => (c.key === key ? { ...c, amount } : c))
    )
  }

  const selectedCategories = categories.filter((c) => c.selected)
  const totalAmount = selectedCategories.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
  const fineAmount = Number(fine) || 0
  const grandTotal = totalAmount + fineAmount

  async function handleSearch() {
    if (!searchQuery.trim()) {
      toast.error('Please enter a name or admission number')
      return
    }
    try {
      setSearching(true)
      const res = await fetch(`/api/fees?type=search&q=${encodeURIComponent(searchQuery)}`)
      if (!res.ok) throw new Error('Student not found')
      const json = await res.json()
      if (json.data) {
        const s = json.data as StudentInfo
        setStudent(s)
        setCategories(defaultCategories.map((c) => ({ ...c })))
        setFine('0')
        setPaymentMode('Cash')
        toast.success('Student found')
      } else {
        toast.error('No student found with that name or admission number')
        setStudent(null)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to search student')
      setStudent(null)
    } finally {
      setSearching(false)
    }
  }

  async function handleCollectFee() {
    if (!student) {
      toast.error('No student selected')
      return
    }
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one fee category')
      return
    }
    const invalid = selectedCategories.some((c) => !c.amount || Number(c.amount) <= 0)
    if (invalid) {
      toast.error('Please enter valid amounts for all selected categories')
      return
    }
    try {
      setSubmitting(true)
      const payload = {
        studentId: student.id,
        categories: selectedCategories.map((c) => ({
          category: c.key,
          amount: Number(c.amount),
        })),
        fine: fineAmount,
        paymentMode,
        totalAmount: grandTotal,
      }
      const res = await fetch('/api/fees/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to collect fee')
      const json = await res.json()
      const receiptData: ReceiptData = {
        receiptNo: json.receiptNo || `RCP-${Date.now()}`,
        student,
        categories: selectedCategories,
        totalAmount,
        fine: fineAmount,
        grandTotal,
        paymentMode,
        date: new Date().toISOString(),
      }
      setReceipt(receiptData)
      setShowReceipt(true)
      toast.success('Fee collected successfully!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to collect fee')
    } finally {
      setSubmitting(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  function handleReset() {
    setStudent(null)
    setSearchQuery('')
    setCategories(defaultCategories)
    setFine('0')
    setPaymentMode('Cash')
    setReceipt(null)
    setShowReceipt(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Fee Collection</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Collect fees from students</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name or admission no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button variant="primary" onClick={handleSearch} disabled={searching}>
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {searching && <Loading text="Searching for student..." />}

      {student && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {student.firstName} {student.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Admission No</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{student.admissionNo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Class & Section</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {student.className} - {student.sectionName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Parent Contact</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{student.parentContact}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fee Categories</CardTitle>
                  <CardDescription>Select fee categories and enter amounts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {categories.map((cat) => (
                    <div
                      key={cat.key}
                      className={`flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-3 transition-colors ${
                        cat.selected
                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <label className="flex items-center gap-3 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cat.selected}
                          onChange={() => toggleCategory(cat.key)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{cat.label}</span>
                      </label>
                      {cat.selected && (
                        <div className="flex items-center gap-2 sm:ml-auto">
                          <span className="text-sm text-gray-500">₹</span>
                          <input
                            type="number"
                            value={cat.amount}
                            onChange={(e) => updateCategoryAmount(cat.key, e.target.value)}
                            placeholder="Amount"
                            className="w-32 text-sm"
                            min="0"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fine & Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Fine (if late payment)"
                      type="number"
                      value={fine}
                      onChange={(e) => setFine(e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                    <Select
                      label="Payment Mode"
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      options={paymentModes}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fee Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedCategories.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No categories selected
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCategories.map((cat) => (
                        <div key={cat.key} className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{cat.label}</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            ₹{Number(cat.amount).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        ₹{totalAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Fine</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        ₹{fineAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                      <span className="text-gray-900 dark:text-gray-100">Grand Total</span>
                      <span className="text-primary">₹{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                variant="primary"
                className="w-full"
                size="lg"
                onClick={handleCollectFee}
                disabled={submitting || selectedCategories.length === 0}
              >
                {submitting ? (
                  'Processing...'
                ) : (
                  <>
                    <DollarSign className="h-5 w-5 mr-2" />
                    Collect Fee — ₹{grandTotal.toLocaleString()}
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}

      {!student && !searching && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Search className="h-16 w-16 text-gray-300 dark:text-gray-600" />
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400">Search for a student</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Enter student name or admission number to begin
          </p>
        </div>
      )}

      <Modal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        title="Payment Receipt"
        size="md"
      >
        {receipt && (
          <div className="space-y-4">
            <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-4">
              <Receipt className="h-10 w-10 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Payment Receipt</h3>
              <p className="text-sm text-gray-500">Receipt No: {receipt.receiptNo}</p>
              <p className="text-sm text-gray-500">{new Date(receipt.date).toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Student Name</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {receipt.student.firstName} {receipt.student.lastName}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Admission No</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{receipt.student.admissionNo}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Class & Section</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {receipt.student.className} - {receipt.student.sectionName}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Payment Mode</p>
                <Badge variant="info">{receipt.paymentMode}</Badge>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Category</th>
                    <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.categories.map((cat) => (
                    <tr key={cat.key}>
                      <td className="py-1.5 text-gray-900 dark:text-gray-100">{cat.label}</td>
                      <td className="text-right py-1.5 text-gray-900 dark:text-gray-100">
                        ₹{Number(cat.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {receipt.fine > 0 && (
                    <tr>
                      <td className="py-1.5 text-red-600 dark:text-red-400">Fine</td>
                      <td className="text-right py-1.5 text-red-600 dark:text-red-400">
                        ₹{receipt.fine.toLocaleString()}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 dark:border-gray-700 font-bold">
                    <td className="py-2 text-gray-900 dark:text-gray-100">Total</td>
                    <td className="text-right py-2 text-primary">
                      ₹{receipt.grandTotal.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Button variant="primary" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Collect Another Fee
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
