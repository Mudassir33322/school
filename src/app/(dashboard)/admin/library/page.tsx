'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Plus,
  Search,
  RotateCcw,
  AlertTriangle,
  Clock,
  CheckCircle,
  Pencil,
  Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Modal from '@/components/ui/modal'
import Table from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'

interface Book {
  id: string
  title: string
  author: string
  isbn: string
  category: string
  publisher: string
  edition: string
  totalCopies: number
  availableCopies: number
  shelfNo: string
}

interface Transaction {
  id: string
  bookId: string
  bookTitle: string
  studentId: string
  studentName: string
  issueDate: string
  dueDate: string
  returnDate: string | null
  fine: number
  status: string
}

const emptyBookForm = {
  title: '',
  author: '',
  isbn: '',
  category: '',
  publisher: '',
  edition: '',
  totalCopies: 1,
  shelfNo: '',
}

const emptyIssueForm = {
  bookId: '',
  studentId: '',
}

const categoryOptions = [
  { value: 'Fiction', label: 'Fiction' },
  { value: 'Non-Fiction', label: 'Non-Fiction' },
  { value: 'Science', label: 'Science' },
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'History', label: 'History' },
  { value: 'Literature', label: 'Literature' },
  { value: 'Reference', label: 'Reference' },
  { value: 'Other', label: 'Other' },
]

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<'books' | 'overdue'>('books')
  const [books, setBooks] = useState<Book[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const [showBookModal, setShowBookModal] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [bookForm, setBookForm] = useState(emptyBookForm)
  const [savingBook, setSavingBook] = useState(false)

  const [showIssueModal, setShowIssueModal] = useState(false)
  const [issueForm, setIssueForm] = useState(emptyIssueForm)
  const [issuing, setIssuing] = useState(false)

  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const stats = {
    total: books.reduce((a, b) => a + b.totalCopies, 0),
    available: books.reduce((a, b) => a + b.availableCopies, 0),
    issued: books.reduce((a, b) => a + (b.totalCopies - b.availableCopies), 0),
    overdue: transactions.filter((t) => t.status === 'Overdue').length,
  }

  const filteredBooks = books.filter((b) => {
    const matchSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()) || b.isbn.includes(search)
    const matchCategory = !categoryFilter || b.category === categoryFilter
    return matchSearch && matchCategory
  })

  const overdueTransactions = transactions.filter((t) => t.status === 'Overdue')

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/library/books')
      if (!res.ok) throw new Error('Failed to fetch books')
      const json = await res.json()
      setBooks(json.data ?? json)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load books')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch('/api/library/transactions')
      if (!res.ok) throw new Error('Failed to fetch transactions')
      const json = await res.json()
      setTransactions(json.data ?? json)
    } catch {
      toast.error('Failed to load transactions')
    }
  }, [])

  useEffect(() => {
    fetchBooks()
    fetchTransactions()
  }, [fetchBooks, fetchTransactions])

  function openAddBook() {
    setEditingBook(null)
    setBookForm(emptyBookForm)
    setShowBookModal(true)
  }

  function openEditBook(book: Book) {
    setEditingBook(book)
    setBookForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      publisher: book.publisher,
      edition: book.edition,
      totalCopies: book.totalCopies,
      shelfNo: book.shelfNo,
    })
    setShowBookModal(true)
  }

  async function handleSaveBook() {
    try {
      setSavingBook(true)
      const url = editingBook ? `/api/library/books/${editingBook.id}` : '/api/library/books'
      const method = editingBook ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookForm),
      })
      if (!res.ok) throw new Error(editingBook ? 'Failed to update book' : 'Failed to add book')
      toast.success(editingBook ? 'Book updated' : 'Book added')
      setShowBookModal(false)
      fetchBooks()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save book')
    } finally {
      setSavingBook(false)
    }
  }

  function confirmDeleteBook(id: string) {
    setDeleteId(id)
    setDeleteModal(true)
  }

  async function handleDeleteBook() {
    if (!deleteId) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/library/books/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete book')
      toast.success('Book deleted')
      setDeleteModal(false)
      setDeleteId(null)
      fetchBooks()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete book')
    } finally {
      setDeleting(false)
    }
  }

  async function handleIssueBook() {
    try {
      setIssuing(true)
      const res = await fetch('/api/library/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueForm),
      })
      if (!res.ok) throw new Error('Failed to issue book')
      toast.success('Book issued')
      setShowIssueModal(false)
      setIssueForm(emptyIssueForm)
      fetchBooks()
      fetchTransactions()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to issue book')
    } finally {
      setIssuing(false)
    }
  }

  async function handleReturnBook(transactionId: string) {
    try {
      const res = await fetch(`/api/library/transactions/${transactionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Returned' }),
      })
      if (!res.ok) throw new Error('Failed to return book')
      toast.success('Book returned')
      fetchBooks()
      fetchTransactions()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to return book')
    }
  }

  function calculateFine(dueDate: string): number {
    const due = new Date(dueDate)
    const now = new Date()
    const diff = Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff * 5 : 0
  }

  const bookColumns = [
    { key: 'title', label: 'Title' },
    { key: 'author', label: 'Author' },
    { key: 'isbn', label: 'ISBN' },
    { key: 'category', label: 'Category', render: (v: unknown) => <Badge variant="info">{v as string}</Badge> },
    { key: 'shelfNo', label: 'Shelf' },
    { key: 'availableCopies', label: 'Available', render: (v: unknown, row: Book) => (
      <span className={v === 0 ? 'text-danger font-medium' : 'text-foreground'}>{v as number}/{row.totalCopies}</span>
    )},
  ]

  const overdueColumns = [
    { key: 'bookTitle', label: 'Book' },
    { key: 'studentName', label: 'Student' },
    { key: 'studentId', label: 'Student ID' },
    { key: 'issueDate', label: 'Issue Date', render: (v: unknown) => new Date(v as string).toLocaleDateString() },
    { key: 'dueDate', label: 'Due Date', render: (v: unknown) => new Date(v as string).toLocaleDateString() },
    { key: 'fine', label: 'Fine', render: (v: unknown, row: Transaction) => (
      <Badge variant="danger">${(v as number) || calculateFine(row.dueDate)}</Badge>
    )},
  ]

  const statCards = [
    { label: 'Total Books', value: stats.total, icon: BookOpen, color: 'text-primary' },
    { label: 'Available', value: stats.available, icon: CheckCircle, color: 'text-accent' },
    { label: 'Issued', value: stats.issued, icon: Clock, color: 'text-info' },
    { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-danger' },
  ]

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Library Management</h1>
          <p className="text-muted-foreground mt-1">Manage books and transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setShowIssueModal(true); setIssueForm(emptyIssueForm) }}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Issue Book
          </Button>
          <Button variant="primary" onClick={openAddBook}>
            <Plus className="h-4 w-4 mr-2" />
            Add Book
          </Button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="flex gap-2 border-b border-border">
          <button
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'books'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('books')}
          >
            Books ({books.length})
          </button>
          <button
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overdue'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('overdue')}
          >
            Overdue ({overdueTransactions.length})
          </button>
        </div>
      </motion.div>

      {activeTab === 'books' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    label="Search"
                    placeholder="Search by title, author, ISBN..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select
                    label="Category"
                    options={categoryOptions}
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardContent className="pt-0">
              <Table
                columns={bookColumns}
                data={filteredBooks}
                loading={loading}
                emptyMessage="No books found"
                actions={(row) => (
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditBook(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => confirmDeleteBook(row.id)}>
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeTab === 'overdue' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle>Overdue Books</CardTitle>
            </CardHeader>
            <CardContent>
              <Table
                columns={overdueColumns}
                data={overdueTransactions}
                loading={loading}
                emptyMessage="No overdue books"
                actions={(row) => (
                  <Button variant="primary" size="sm" onClick={() => handleReturnBook(row.id)}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Return
                  </Button>
                )}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Modal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        title={editingBook ? 'Edit Book' : 'Add Book'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Title"
              value={bookForm.title}
              onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
              placeholder="Enter book title"
            />
            <Input
              label="Author"
              value={bookForm.author}
              onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
              placeholder="Enter author name"
            />
            <Input
              label="ISBN"
              value={bookForm.isbn}
              onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
              placeholder="Enter ISBN"
            />
            <Select
              label="Category"
              options={categoryOptions}
              value={bookForm.category}
              onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
            />
            <Input
              label="Publisher"
              value={bookForm.publisher}
              onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
              placeholder="Enter publisher"
            />
            <Input
              label="Edition"
              value={bookForm.edition}
              onChange={(e) => setBookForm({ ...bookForm, edition: e.target.value })}
              placeholder="Enter edition"
            />
            <Input
              label="Total Copies"
              type="number"
              min={1}
              value={bookForm.totalCopies}
              onChange={(e) => setBookForm({ ...bookForm, totalCopies: Number(e.target.value) })}
            />
            <Input
              label="Shelf No"
              value={bookForm.shelfNo}
              onChange={(e) => setBookForm({ ...bookForm, shelfNo: e.target.value })}
              placeholder="e.g. A1-B3"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowBookModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveBook} disabled={savingBook}>
              {savingBook ? 'Saving...' : editingBook ? 'Update Book' : 'Add Book'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        title="Issue Book"
        size="sm"
      >
        <div className="space-y-4">
          <Select
            label="Select Book"
            options={books.filter((b) => b.availableCopies > 0).map((b) => ({ value: b.id, label: b.title }))}
            value={issueForm.bookId}
            onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })}
          />
          <Input
            label="Student ID"
            value={issueForm.studentId}
            onChange={(e) => setIssueForm({ ...issueForm, studentId: e.target.value })}
            placeholder="Enter student ID"
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowIssueModal(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleIssueBook}
              disabled={issuing || !issueForm.bookId || !issueForm.studentId}
            >
              {issuing ? 'Issuing...' : 'Issue Book'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteModal}
        onClose={() => { setDeleteModal(false); setDeleteId(null) }}
        title="Confirm Delete"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this book? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setDeleteModal(false); setDeleteId(null) }}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteBook} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
