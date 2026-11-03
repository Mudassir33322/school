import { dbInsert, dbGetAll, dbDelete } from '@/lib/db'
import { generateId } from '@/lib/utils'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'school.db')
const BACKUPS_DIR = path.join(process.cwd(), 'backups')

export interface Backup {
  id: string
  fileName: string
  fileSize: number
  backupType: string
  status: string
  createdBy: string
  notes: string
  createdAt: string
}

function ensureBackupsDir() {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true })
  }
}

export async function createBackup(notes?: string): Promise<boolean> {
  ensureBackupsDir()

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = `school-backup-${timestamp}.db`
  const filePath = path.join(BACKUPS_DIR, fileName)

  if (!fs.existsSync(DB_PATH)) {
    return false
  }

  fs.copyFileSync(DB_PATH, filePath)
  const stats = fs.statSync(filePath)

  return dbInsert('backups', {
    id: generateId(),
    fileName,
    fileSize: stats.size,
    backupType: 'Full',
    status: 'Completed',
    createdBy: 'system',
    notes: notes || '',
    createdAt: new Date().toISOString(),
  })
}

export async function getBackups(): Promise<Backup[]> {
  const backups = await dbGetAll<Backup>('backups')
  return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function restoreBackup(backupId: string): Promise<boolean> {
  const backup = (await dbGetAll<Backup>('backups')).find(b => b.id === backupId)
  if (!backup) return false

  const backupPath = path.join(BACKUPS_DIR, backup.fileName)
  if (!fs.existsSync(backupPath)) return false

  fs.copyFileSync(backupPath, DB_PATH)
  return true
}

export async function deleteBackup(id: string): Promise<boolean> {
  const backups = await dbGetAll<Backup>('backups')
  const backup = backups.find(b => b.id === id)
  if (backup) {
    const backupPath = path.join(BACKUPS_DIR, backup.fileName)
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath)
    }
  }
  return dbDelete('backups', id)
}
