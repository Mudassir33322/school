'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  AlertCircle,
  Users,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Receipt,
  FileText,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import Modal from '@/components/ui/modal'
import Select from '@/components/ui/select'
import Input from '@/components/ui/input'
import Table from '@/components/ui/table'
import { downloadCSV } from '@/lib/utils'

interface FeeRecord {
  id: string
  date: string
  studentName: string
  admissionNo: string
  category: string
  amount: number
  paidAmount: number
  dueDate: string
  status: 'Paid' | 'Unpaid' | 'Partial' | 'Overdue'
  receiptNo: string
  studentId: string
  paymentMode: string
  fine: number
  remarks: string
}

interface FeeSummary {
  totalCollection: number
  pendingFees: number
  defaultersCount: number
  collectionThisMonth: number
}

interface NewFeeForm {
  studentId: string
  category: string
  amount: string
  paidAmount: string
  dueDate: string
  paymentMode: string
  fine: string
  remarks: string
}

const statusVariant: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
  Paid: 'success', Unpaid: 'danger', Partial: 'warning', Overdue: 'default',
}

const categoryOptions = [
  { value: 'Admission', label: 'Admission Fee' },
  { value: 'Monthly', label: 'Monthly Fee' },
  { value: 'Exam', label: 'Exam Fee' },
  { value: 'Transport', label: 'Transport Fee' },
  { value: 'Fine', label: 'Fine' },
]

const statusOptions = [
  { value: '', label: 'All Status' }, { value: 'Paid', label: 'Paid' },
  { value: 'Unpaid', label: 'Unpaid' }, { value: 'Partial', label: 'Partial' },
  { value: 'Overdue', label: 'Overdue' },
]

const paymentModeOptions = [
  { value: 'Cash', label: 'Cash' }, { value: 'Card', label: 'Card' },
  { value: 'Online', label: 'Online' }, { value: 'Cheque', label: 'Cheque' },
  { value: 'Demand Draft', label: 'Demand Draft' },
]

const ITEMS_PER_PAGE = 10

export default function FeesPage() {
  const [fees, setFees] = useState<FeeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<FeeSummary>({ totalCollection: 0, pendingFees: 0, defaultersCount: 0, collectionThisMonth: 0 })
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'defaulters'>('all')
  const [form, setForm] = useState<NewFeeForm>({
    studentId: '', category: '', amount: '', paidAmount: '', dueDate: '', paymentMode: 'Cash', fine: '0', remarks: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [classes, setClasses] = useState<{ value: string; label: string }[]>([])
  const [sections, setSections] = useState<{ value: string; label: string }[]>([])

  useEffect(() => { fetchClasses(); fetchFees() }, [])
  useEffect(() => { if (classId) fetchSections() }, [classId])
  useEffect(() => { setCurrentPage(1) }, [statusFilter, categoryFilter, searchQuery, activeTab, classId, sectionId])

  async function fetchClasses() {
    try {
      const res = await fetch('/api/fees?type=classes')
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      if (json.data) { setClasses((json.data as { id: string; name: string }[]).map((c) => ({ value: c.id, label: c.name }))); return }
    } catch { /* fallback */ }
    setClasses(Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: `Class ${i + 1}` })))
  }

  async function fetchSections() {
    try {
      const res = await fetch(`/api/fees?type=sections&classId=${classId}`)
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      if (json.data) { setSections((json.data as { id: string; name: string }[]).map((s) => ({ value: s.id, label: s.name }))); return }
    } catch { /* fallback */ }
    setSections([{ value: 'A', label: 'Section A' }, { value: 'B', label: 'Section B' }])
  }

  async function fetchFees() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (classId) params.set('classId', classId)
      if (sectionId) params.set('sectionId', sectionId)
      if (statusFilter) params.set('status', statusFilter)
      if (categoryFilter) params.set('category', categoryFilter)
      if (searchQuery) params.set('search', searchQuery)
      const res = await fetch(`/api/fees?${params}`)
      if (!res.ok) throw new Error('Failed to fetch fees')
      const json = await res.json()
      const data = (json.data ?? []) as FeeRecord[]
      setFees(data)
      computeSummary(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load fees')
    } finally { setLoading(false) }
  }

  function computeSummary(records: FeeRecord[]) {
    const totalCollection = records.reduce((sum, r) => sum + r.paidAmount, 0)
    const pendingFees = records.filter((r) => r.status === 'Unpaid' || r.status === 'Partial' || r.status === 'Overdue')
      .reduce((sum, r) => sum + (r.amount - r.paidAmount), 0)
    const defaultersCount = records.filter((r) => r.status === 'Overdue').length
    const now = new Date()
    const thisMonth = records.filter((r) => { const d = new Date(r.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
    const collectionThisMonth = thisMonth.reduce((sum, r) => sum + r.paidAmount, 0)
    setSummary({ totalCollection, pendingFees, defaultersCount, collectionThisMonth })
  }

  async function handleAddFee() {
    if (!form.studentId || !form.category || !form.amount || !form.dueDate) { toast.error('Please fill in required fields'); return }
    try {
      setSubmitting(true)
      const res = await fetch('/api/fees', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: form.studentId, category: form.category, amount: Number(form.amount),
          paidAmount: Number(form.paidAmount) || 0, dueDate: form.dueDate, paymentMode: form.paymentMode,
          fine: Number(form.fine) || 0, remarks: form.remarks,
          status: Number(form.paidAmount) >= Number(form.amount) ? 'Paid' : Number(form.paidAmount) > 0 ? 'Partial' : 'Unpaid',
        }),
      })
      if (!res.ok) throw new Error('Failed to add fee')
      toast.success('Fee record added successfully')
      setShowAddModal(false)
      setForm({ studentId: '', category: '', amount: '', paidAmount: '', dueDate: '', paymentMode: 'Cash', fine: '0', remarks: '' })
      fetchFees()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to add fee') }
    finally { setSubmitting(false) }
  }

  function handleExport() {
    const data = fees.map((f) => ({
      Date: new Date(f.date).toLocaleDateString(),
      'Student Name': f.studentName,
      'Admission No': f.admissionNo,
      Category: f.category,
      Amount: f.amount,
      'Paid Amount': f.paidAmount,
      'Due Date': new Date(f.dueDate).toLocaleDateString(),
      Status: f.status,
      'Receipt No': f.receiptNo,
    }))
    downloadCSV(data, `fees-${new Date().toISOString().split('T')[0]}`)
    toast.success('Fees exported successfully')
  }

  const defaulters = fees.filter((r) => r.status === 'Overdue')
  const displayFees = activeTab === 'defaulters' ? defaulters : fees
  const totalPages = Math.ceil(displayFees.length / ITEMS_PER_PAGE)
  const paginatedFees = displayFees.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const columns = [
    { key: 'date', label: 'Date', render: (_: unknown, row: FeeRecord) => new Date(row.date).toLocaleDateString() },
    { key: 'studentName', label: 'Student Name' },
    { key: 'admissionNo', label: 'Admission No' },
    { key: 'category', label: 'Category' },
    { key: 'amount', label: 'Amount', render: (_: unknown, row: FeeRecord) => `₹${row.amount.toLocaleString()}` },
    { key: 'paidAmount', label: 'Paid', render: (_: unknown, row: FeeRecord) => `₹${row.paidAmount.toLocaleString()}` },
    { key: 'dueDate', label: 'Due Date', render: (_: unknown, row: FeeRecord) => new Date(row.dueDate).toLocaleDateString() },
    { key: 'status', label: 'Status', render: (_: unknown, row: FeeRecord) => <Badge variant={statusVariant[row.status] || 'default'}>{row.status}</Badge> },
    { key: 'receiptNo', label: 'Receipt No' },
  ]

  const summaryCards = [
    { label: 'Total Collection', value: `₹${summary.totalCollection.toLocaleString()}`, icon: DollarSign, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10 dark:bg-green-500/20' },
    { label: 'Pending Fees', value: `₹${summary.pendingFees.toLocaleString()}`, icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 dark:bg-red-500/20' },
    { label: 'Defaulters', value: summary.defaultersCount, icon: Users, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 dark:bg-orange-500/20' },
    { label: 'Collection This Month', value: `₹${summary.collectionThisMonth.toLocaleString()}`, icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-500/20' },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fee Management</h1>
          <p className="text-muted-foreground mt-1">Manage fees, payments, and receipts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Fee
          </Button>
          <Button variant="outline" onClick={fetchFees}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
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

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input placeholder="Search by name or admission no..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} icon={<Search className="h-4 w-4" />} />
              </div>
              <Select value={classId} onChange={(e) => setClassId(e.target.value)} options={[{ value: '', label: 'All Classes' }, ...classes]} />
              <Select value={sectionId} onChange={(e) => setSectionId(e.target.value)} options={[{ value: '', label: 'All Sections' }, ...sections]} />
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={statusOptions} />
              <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} options={[{ value: '', label: 'All Categories' }, ...categoryOptions]} />
              <Button variant="primary" onClick={fetchFees}>
                <Filter className="h-4 w-4 mr-2" /> Filter
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex items-center gap-2 border-b border-border">
        {(['all', 'defaulters'] as const).map((tab) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {tab === 'all' ? <FileText className="h-4 w-4 inline mr-1.5" /> : <AlertCircle className="h-4 w-4 inline mr-1.5" />}
            {tab === 'all' ? 'All Records' : `Defaulter List (${defaulters.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading text="Loading fee records..." />
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-0">
              <Table
                columns={columns}
                data={paginatedFees}
                loading={false}
                actions={(row: FeeRecord) => (
                  <Button size="sm" variant="ghost" onClick={() => toast.success(`Receipt ${row.receiptNo || 'generated'}`)}>
                    <Receipt className="h-4 w-4" />
                  </Button>
                )}
              />
            </CardContent>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, displayFees.length)} of {displayFees.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button key={page} size="sm" variant={page === currentPage ? 'primary' : 'outline'} onClick={() => setCurrentPage(page)}>
                      {page}
                    </Button>
                  ))}
                  <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Fee Record" size="md">
        <div className="space-y-4">
          <Input label="Student ID *" value={form.studentId} onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))} placeholder="Enter student ID" />
          <Select label="Category *" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} options={categoryOptions} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Amount *" type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="Total amount" />
            <Input label="Paid Amount" type="number" value={form.paidAmount} onChange={(e) => setForm((f) => ({ ...f, paidAmount: e.target.value }))} placeholder="Amount paid" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Due Date *" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
            <Select label="Payment Mode" value={form.paymentMode} onChange={(e) => setForm((f) => ({ ...f, paymentMode: e.target.value }))} options={paymentModeOptions} />
          </div>
          <Input label="Fine" type="number" value={form.fine} onChange={(e) => setForm((f) => ({ ...f, fine: e.target.value }))} placeholder="0" />
          <Input label="Remarks" value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} placeholder="Optional remarks" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddFee} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Fee Record'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
