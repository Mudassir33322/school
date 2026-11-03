import { dbInsert, dbGetAll, dbUpdate, dbQuery } from '@/lib/db'
import { generateId } from '@/lib/utils'

export interface LibraryBook {
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
  status: string
  createdAt: string
}

export interface LibraryTransaction {
  id: string
  bookId: string
  studentId: string
  studentName: string
  bookTitle: string
  issueDate: string
  dueDate: string
  returnDate: string
  status: string
  fine: number
  remarks: string
  createdAt: string
}

export interface BookFilters {
  search?: string
  category?: string
}

export interface TransactionFilters {
  search?: string
  status?: string
  studentId?: string
}

export async function addBook(bookData: Partial<LibraryBook>): Promise<LibraryBook | null> {
  try {
    const book: Record<string, unknown> = {
      id: generateId(),
      title: bookData.title || '',
      author: bookData.author || '',
      isbn: bookData.isbn || '',
      category: bookData.category || '',
      publisher: bookData.publisher || '',
      edition: bookData.edition || '',
      totalCopies: bookData.totalCopies || 1,
      availableCopies: bookData.availableCopies ?? bookData.totalCopies ?? 1,
      shelfNo: bookData.shelfNo || '',
      status: 'Available',
      createdAt: new Date().toISOString(),
    }
    const ok = await dbInsert('library_books', book)
    return ok ? (book as unknown as LibraryBook) : null
  } catch {
    return null
  }
}

export async function getBooks(filters?: BookFilters): Promise<LibraryBook[]> {
  try {
    let books = await dbGetAll<LibraryBook>('library_books')

    if (filters?.search) {
      const s = filters.search.toLowerCase()
      books = books.filter(
        (b) =>
          b.title.toLowerCase().includes(s) ||
          b.author.toLowerCase().includes(s) ||
          b.isbn.toLowerCase().includes(s)
      )
    }

    if (filters?.category) {
      books = books.filter((b) => b.category === filters.category)
    }

    return books.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch {
    return []
  }
}

export async function updateBook(id: string, updates: Partial<LibraryBook>): Promise<boolean> {
  try {
    return dbUpdate('library_books', id, updates)
  } catch {
    return false
  }
}

export async function issueBook(
  bookId: string,
  studentId: string,
  studentName: string,
  bookTitle: string
): Promise<LibraryTransaction | null> {
  try {
    const books = await dbQuery<LibraryBook>('library_books', { id: bookId })
    const book = books[0]
    if (!book || book.availableCopies <= 0) return null

    const now = new Date()
    const dueDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

    const transaction: Record<string, unknown> = {
      id: generateId(),
      bookId,
      studentId,
      studentName,
      bookTitle,
      issueDate: now.toISOString(),
      dueDate: dueDate.toISOString(),
      returnDate: '',
      status: 'Issued',
      fine: 0,
      remarks: '',
      createdAt: now.toISOString(),
    }

    await dbInsert('library_transactions', transaction)
    await dbUpdate('library_books', bookId, { availableCopies: book.availableCopies - 1 })

    return transaction as unknown as LibraryTransaction
  } catch {
    return null
  }
}

export async function returnBook(transactionId: string): Promise<boolean> {
  try {
    const transactions = await dbQuery<LibraryTransaction>('library_transactions', { id: transactionId })
    const txn = transactions[0]
    if (!txn || txn.status === 'Returned') return false

    const now = new Date()
    const dueDate = new Date(txn.dueDate)
    let fine = 0
    if (now > dueDate) {
      const overdueDays = Math.ceil((now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000))
      fine = overdueDays * 10
    }

    await dbUpdate('library_transactions', transactionId, {
      returnDate: now.toISOString(),
      status: 'Returned',
      fine,
    })

    const books = await dbQuery<LibraryBook>('library_books', { id: txn.bookId })
    if (books[0]) {
      await dbUpdate('library_books', txn.bookId, {
        availableCopies: books[0].availableCopies + 1,
      })
    }

    return true
  } catch {
    return false
  }
}

export async function getTransactions(filters?: TransactionFilters): Promise<LibraryTransaction[]> {
  try {
    let txns = await dbGetAll<LibraryTransaction>('library_transactions')

    if (filters?.search) {
      const s = filters.search.toLowerCase()
      txns = txns.filter(
        (t) =>
          t.studentName.toLowerCase().includes(s) ||
          t.bookTitle.toLowerCase().includes(s)
      )
    }

    if (filters?.status) {
      txns = txns.filter((t) => t.status === filters.status)
    }

    if (filters?.studentId) {
      txns = txns.filter((t) => t.studentId === filters.studentId)
    }

    return txns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch {
    return []
  }
}

export async function getOverdueBooks(): Promise<LibraryTransaction[]> {
  try {
    const txns = await dbGetAll<LibraryTransaction>('library_transactions')
    const now = new Date()
    return txns
      .filter((t) => t.status === 'Issued' && new Date(t.dueDate) < now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  } catch {
    return []
  }
}
