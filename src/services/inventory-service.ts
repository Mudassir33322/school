import { dbInsert, dbGetAll, dbUpdate, dbDelete, dbQuery, dbQueryRaw } from '@/lib/db'
import { generateId } from '@/lib/utils'

export interface InventoryItem {
  id: string
  itemName: string
  category: string
  itemCode: string
  quantity: number
  unit: string
  unitPrice: number
  supplier: string
  minStock: number
  location: string
  status: string
  lastRestocked: string
  createdAt: string
}

export interface InventoryFilters {
  search?: string
  category?: string
}

export async function addItem(data: Partial<InventoryItem>): Promise<InventoryItem | null> {
  try {
    const item: Record<string, unknown> = {
      id: generateId(),
      itemName: data.itemName || '',
      category: data.category || '',
      itemCode: data.itemCode || '',
      quantity: data.quantity || 0,
      unit: data.unit || 'pcs',
      unitPrice: data.unitPrice || 0,
      supplier: data.supplier || '',
      minStock: data.minStock || 0,
      location: data.location || '',
      status: data.quantity && data.quantity > 0 ? 'In Stock' : 'Out of Stock',
      lastRestocked: '',
      createdAt: new Date().toISOString(),
    }
    const ok = await dbInsert('inventory', item)
    return ok ? (item as unknown as InventoryItem) : null
  } catch {
    return null
  }
}

export async function getItems(filters?: InventoryFilters): Promise<InventoryItem[]> {
  try {
    let items = await dbGetAll<InventoryItem>('inventory')

    if (filters?.search) {
      const s = filters.search.toLowerCase()
      items = items.filter(
        (i) =>
          i.itemName.toLowerCase().includes(s) ||
          i.itemCode.toLowerCase().includes(s) ||
          i.supplier.toLowerCase().includes(s)
      )
    }

    if (filters?.category) {
      items = items.filter((i) => i.category === filters.category)
    }

    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch {
    return []
  }
}

export async function updateItem(id: string, updates: Partial<InventoryItem>): Promise<boolean> {
  try {
    return dbUpdate('inventory', id, updates)
  } catch {
    return false
  }
}

export async function deleteItem(id: string): Promise<boolean> {
  try {
    return dbDelete('inventory', id)
  } catch {
    return false
  }
}

export async function adjustStock(
  id: string,
  quantity: number,
  type: 'in' | 'out'
): Promise<boolean> {
  try {
    const items = await dbQuery<InventoryItem>('inventory', { id })
    const item = items[0]
    if (!item) return false

    const newQuantity = type === 'in' ? item.quantity + quantity : item.quantity - quantity
    if (newQuantity < 0) return false

    const status = newQuantity === 0 ? 'Out of Stock' : newQuantity <= item.minStock ? 'Low Stock' : 'In Stock'

    return dbUpdate('inventory', id, {
      quantity: newQuantity,
      status,
      lastRestocked: type === 'in' ? new Date().toISOString() : item.lastRestocked,
    })
  } catch {
    return false
  }
}

export async function getLowStockItems(): Promise<InventoryItem[]> {
  try {
    const items = await dbGetAll<InventoryItem>('inventory')
    return items
      .filter((i) => i.quantity <= i.minStock && i.minStock > 0)
      .sort((a, b) => a.quantity - b.quantity)
  } catch {
    return []
  }
}
