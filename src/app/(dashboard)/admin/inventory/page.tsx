'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Package,
  Search,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  DollarSign,
  Layers,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Modal from '@/components/ui/modal'
import Table from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface InventoryItem {
  id: string
  name: string
  category: string
  code: string
  quantity: number
  unit: string
  unitPrice: number
  supplier: string
  minStock: number
  location: string
}

interface InventoryStats {
  totalItems: number
  totalValue: number
  lowStock: number
  categories: number
}

interface ItemForm {
  name: string
  category: string
  code: string
  quantity: string
  unit: string
  unitPrice: string
  supplier: string
  minStock: string
  location: string
}

interface AdjustForm {
  itemId: string
  itemName: string
  type: 'in' | 'out'
  quantity: string
  reason: string
}

const categoryOptions = [
  { value: 'Stationery', label: 'Stationery' },
  { value: 'Furniture', label: 'Furniture' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Lab Equipment', label: 'Lab Equipment' },
  { value: 'Sports', label: 'Sports' },
  { value: 'Cleaning', label: 'Cleaning' },
  { value: 'Miscellaneous', label: 'Miscellaneous' },
]

const unitOptions = [
  { value: 'Pcs', label: 'Pieces' },
  { value: 'Kg', label: 'Kilograms' },
  { value: 'Ltr', label: 'Liters' },
  { value: 'Box', label: 'Box' },
  { value: 'Set', label: 'Set' },
  { value: 'Pack', label: 'Pack' },
  { value: 'Roll', label: 'Roll' },
]

const emptyItemForm: ItemForm = {
  name: '',
  category: '',
  code: '',
  quantity: '',
  unit: '',
  unitPrice: '',
  supplier: '',
  minStock: '',
  location: '',
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'items' | 'lowstock'>('items')
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItemForm)
  const [submitting, setSubmitting] = useState(false)

  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustForm, setAdjustForm] = useState<AdjustForm>({ itemId: '', itemName: '', type: 'in', quantity: '', reason: '' })

  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryFilter) params.set('category', categoryFilter)
      const res = await fetch(`/api/inventory?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch inventory')
      const json = await res.json()
      setItems(json.data ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  function openAddItem() {
    setEditingItem(null)
    setItemForm(emptyItemForm)
    setShowItemModal(true)
  }

  function openEditItem(item: InventoryItem) {
    setEditingItem(item)
    setItemForm({
      name: item.name,
      category: item.category,
      code: item.code,
      quantity: String(item.quantity),
      unit: item.unit,
      unitPrice: String(item.unitPrice),
      supplier: item.supplier,
      minStock: String(item.minStock),
      location: item.location,
    })
    setShowItemModal(true)
  }

  async function handleSaveItem() {
    if (!itemForm.name || !itemForm.category || !itemForm.code) {
      toast.error('Please fill in required fields')
      return
    }
    try {
      setSubmitting(true)
      const method = editingItem ? 'PUT' : 'POST'
      const url = editingItem ? `/api/inventory/${editingItem.id}` : '/api/inventory'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...itemForm,
          quantity: Number(itemForm.quantity) || 0,
          unitPrice: Number(itemForm.unitPrice) || 0,
          minStock: Number(itemForm.minStock) || 0,
        }),
      })
      if (!res.ok) throw new Error('Failed to save item')
      toast.success(editingItem ? 'Item updated successfully' : 'Item added successfully')
      setShowItemModal(false)
      fetchItems()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save item')
    } finally {
      setSubmitting(false)
    }
  }

  function openAdjustModal(item: InventoryItem, type: 'in' | 'out') {
    setAdjustForm({ itemId: item.id, itemName: item.name, type, quantity: '', reason: '' })
    setShowAdjustModal(true)
  }

  async function handleAdjustStock() {
    if (!adjustForm.quantity || Number(adjustForm.quantity) <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }
    try {
      setSubmitting(true)
      const res = await fetch(`/api/inventory/${adjustForm.itemId}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: adjustForm.type,
          quantity: Number(adjustForm.quantity),
          reason: adjustForm.reason,
        }),
      })
      if (!res.ok) throw new Error('Failed to adjust stock')
      toast.success(`Stock ${adjustForm.type === 'in' ? 'added' : 'removed'} successfully`)
      setShowAdjustModal(false)
      fetchItems()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to adjust stock')
    } finally {
      setSubmitting(false)
    }
  }

  function confirmDelete(id: string) {
    setDeleteId(id)
    setDeleteModal(true)
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/inventory/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete item')
      toast.success('Item deleted successfully')
      setDeleteModal(false)
      setDeleteId(null)
      fetchItems()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete item')
    } finally {
      setDeleting(false)
    }
  }

  const lowStockItems = items.filter((item) => item.quantity <= item.minStock)
  const displayItems = activeTab === 'lowstock' ? lowStockItems : items

  const stats: InventoryStats = {
    totalItems: items.length,
    totalValue: items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    lowStock: lowStockItems.length,
    categories: new Set(items.map((item) => item.category)).size,
  }

  const summaryCards = [
    { label: 'Total Items', value: stats.totalItems, icon: Package, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-500/20' },
    { label: 'Total Value', value: `₹${stats.totalValue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10 dark:bg-green-500/20' },
    { label: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 dark:bg-red-500/20' },
    { label: 'Categories', value: stats.categories, icon: Layers, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 dark:bg-purple-500/20' },
  ]

  const columns = [
    { key: 'code', label: 'Code', render: (_: unknown, row: InventoryItem) => <span className="font-medium">{row.code}</span> },
    { key: 'name', label: 'Item Name' },
    { key: 'category', label: 'Category', render: (_: unknown, row: InventoryItem) => <Badge variant="primary">{row.category}</Badge> },
    { key: 'quantity', label: 'Qty', render: (_: unknown, row: InventoryItem) => (
      <span className={row.quantity <= row.minStock ? 'font-bold text-danger' : ''}>{row.quantity}</span>
    )},
    { key: 'unit', label: 'Unit' },
    { key: 'unitPrice', label: 'Unit Price', render: (_: unknown, row: InventoryItem) => `₹${row.unitPrice.toLocaleString()}` },
    { key: 'supplier', label: 'Supplier' },
    { key: 'minStock', label: 'Min Stock' },
    { key: 'location', label: 'Location' },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Manage stock, supplies, and inventory items</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchItems}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button variant="primary" onClick={openAddItem}>
            <Plus className="h-4 w-4 mr-2" /> Add Item
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
                <Input
                  placeholder="Search items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <div className="w-full sm:w-48">
                <Select
                  options={categoryOptions}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  placeholder="All Categories"
                />
              </div>
              <Button variant="primary" onClick={fetchItems}>
                <Search className="h-4 w-4 mr-2" /> Search
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex items-center gap-2 border-b border-border">
        {(['items', 'lowstock'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'items' ? <Package className="h-4 w-4 inline mr-1.5" /> : <AlertTriangle className="h-4 w-4 inline mr-1.5" />}
            {tab === 'items' ? 'All Items' : `Low Stock Alerts (${lowStockItems.length})`}
          </button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle>{activeTab === 'items' ? 'Inventory Items' : 'Low Stock Items'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table
              columns={columns}
              data={displayItems}
              loading={loading}
              actions={(row: InventoryItem) => (
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openAdjustModal(row, 'in')} title="Stock In">
                    <ArrowUpCircle className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openAdjustModal(row, 'out')} title="Stock Out">
                    <ArrowDownCircle className="h-4 w-4 text-red-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditItem(row)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => confirmDelete(row.id)}>
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              )}
            />
          </CardContent>
        </Card>
      </motion.div>

      <Modal isOpen={showItemModal} onClose={() => setShowItemModal(false)} title={editingItem ? 'Edit Item' : 'Add Item'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Item Name *"
              value={itemForm.name}
              onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Enter item name"
            />
            <Input
              label="Item Code *"
              value={itemForm.code}
              onChange={(e) => setItemForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="e.g. STN-001"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Category *"
              options={categoryOptions}
              value={itemForm.category}
              onChange={(e) => setItemForm((f) => ({ ...f, category: e.target.value }))}
            />
            <Select
              label="Unit"
              options={unitOptions}
              value={itemForm.unit}
              onChange={(e) => setItemForm((f) => ({ ...f, unit: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Quantity"
              type="number"
              value={itemForm.quantity}
              onChange={(e) => setItemForm((f) => ({ ...f, quantity: e.target.value }))}
              placeholder="0"
            />
            <Input
              label="Unit Price"
              type="number"
              value={itemForm.unitPrice}
              onChange={(e) => setItemForm((f) => ({ ...f, unitPrice: e.target.value }))}
              placeholder="0"
            />
            <Input
              label="Min Stock"
              type="number"
              value={itemForm.minStock}
              onChange={(e) => setItemForm((f) => ({ ...f, minStock: e.target.value }))}
              placeholder="0"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Supplier"
              value={itemForm.supplier}
              onChange={(e) => setItemForm((f) => ({ ...f, supplier: e.target.value }))}
              placeholder="Enter supplier name"
            />
            <Input
              label="Location"
              value={itemForm.location}
              onChange={(e) => setItemForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="e.g. Store Room A"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowItemModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveItem} disabled={submitting}>
              {submitting ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAdjustModal} onClose={() => setShowAdjustModal(false)} title={`Stock ${adjustForm.type === 'in' ? 'In' : 'Out'}`} size="md">
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">Item</p>
            <p className="font-medium">{adjustForm.itemName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={adjustForm.type === 'in' ? 'success' : 'outline'}
              size="sm"
              onClick={() => setAdjustForm((f) => ({ ...f, type: 'in' }))}
            >
              <ArrowUpCircle className="h-4 w-4 mr-1" /> Stock In
            </Button>
            <Button
              variant={adjustForm.type === 'out' ? 'danger' : 'outline'}
              size="sm"
              onClick={() => setAdjustForm((f) => ({ ...f, type: 'out' }))}
            >
              <ArrowDownCircle className="h-4 w-4 mr-1" /> Stock Out
            </Button>
          </div>
          <Input
            label="Quantity *"
            type="number"
            value={adjustForm.quantity}
            onChange={(e) => setAdjustForm((f) => ({ ...f, quantity: e.target.value }))}
            placeholder="Enter quantity"
          />
          <Input
            label="Reason"
            value={adjustForm.reason}
            onChange={(e) => setAdjustForm((f) => ({ ...f, reason: e.target.value }))}
            placeholder="Optional reason"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAdjustModal(false)}>Cancel</Button>
            <Button
              variant={adjustForm.type === 'in' ? 'success' : 'danger'}
              onClick={handleAdjustStock}
              disabled={submitting}
            >
              {submitting ? 'Processing...' : adjustForm.type === 'in' ? 'Add Stock' : 'Remove Stock'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteModal} onClose={() => { setDeleteModal(false); setDeleteId(null) }} title="Confirm Delete" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this item? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setDeleteModal(false); setDeleteId(null) }}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
