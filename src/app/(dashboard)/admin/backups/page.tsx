'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Database,
  Download,
  Upload,
  Trash2,
  Clock,
  HardDrive,
  RefreshCw,
  FileArchive,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Modal from '@/components/ui/modal'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'

interface Backup {
  id: string
  filename: string
  size: string
  type: string
  status: string
  date: string
  createdBy: string
  notes: string
}

const statusBadge: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  Completed: 'success',
  InProgress: 'warning',
  Failed: 'danger',
  Pending: 'info',
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [createNotes, setCreateNotes] = useState('')
  const [creating, setCreating] = useState(false)
  const [restoreModal, setRestoreModal] = useState(false)
  const [restoreId, setRestoreId] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchBackups = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/backups')
      if (!res.ok) throw new Error('Failed to fetch backups')
      const json = await res.json()
      setBackups(json.data ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load backups')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBackups() }, [fetchBackups])

  const totalCount = backups.length
  const lastBackupDate = backups.length > 0
    ? backups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
    : null

  async function handleCreateBackup() {
    try {
      setCreating(true)
      const res = await fetch('/api/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: createNotes }),
      })
      if (!res.ok) throw new Error('Failed to create backup')
      toast.success('Backup created successfully')
      setCreateModal(false)
      setCreateNotes('')
      fetchBackups()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create backup')
    } finally {
      setCreating(false)
    }
  }

  function confirmRestore(id: string) {
    setRestoreId(id)
    setRestoreModal(true)
  }

  async function handleRestore() {
    if (!restoreId) return
    try {
      setRestoring(true)
      const res = await fetch('/api/backups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: restoreId }),
      })
      if (!res.ok) throw new Error('Failed to restore backup')
      toast.success('Backup restored successfully')
      setRestoreModal(false)
      setRestoreId(null)
      fetchBackups()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to restore backup')
    } finally {
      setRestoring(false)
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
      const res = await fetch(`/api/backups?id=${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete backup')
      toast.success('Backup deleted successfully')
      setDeleteModal(false)
      setDeleteId(null)
      fetchBackups()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete backup')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Backup & Restore</h1>
          <p className="text-muted-foreground mt-1">Manage database backups and restore points</p>
        </div>
        <Button variant="primary" onClick={() => setCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> Create Backup
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card variant="compact">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-muted text-primary">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalCount}</p>
                <p className="text-xs text-muted-foreground">Total Backups</p>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card variant="compact">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-muted text-info">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">
                  {lastBackupDate ? new Date(lastBackupDate).toLocaleDateString() : 'Never'}
                </p>
                <p className="text-xs text-muted-foreground">Last Backup Date</p>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card variant="compact">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-muted text-accent">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">Auto-Enabled</p>
                <p className="text-xs text-muted-foreground">Auto Backup Status</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Backup History</CardTitle>
              <Button variant="outline" size="sm" onClick={fetchBackups}>
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <Loading text="Loading backups..." />
            ) : backups.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <Database className="h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium text-foreground">No backups found</p>
                <p className="text-sm text-muted-foreground">Create your first backup to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      {['Filename', 'Size', 'Type', 'Status', 'Date', 'Created By', 'Notes', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    <AnimatePresence>
                      {backups.map((backup) => (
                        <motion.tr
                          key={backup.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-foreground">
                            <div className="flex items-center gap-2">
                              <FileArchive className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="truncate max-w-[200px]">{backup.filename}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <HardDrive className="h-3.5 w-3.5" />
                              {backup.size}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            <Badge variant="outline">{backup.type}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            <Badge variant={statusBadge[backup.status] || 'default'}>
                              {backup.status === 'Completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {backup.status === 'Failed' && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {backup.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(backup.date).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{backup.createdBy}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground max-w-[150px] truncate">{backup.notes || '-'}</td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => confirmRestore(backup.id)}
                                disabled={backup.status !== 'Completed'}
                                title="Restore"
                              >
                                <Upload className="h-3.5 w-3.5 mr-1" /> Restore
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`/api/backups?id=${backup.id}&download=true`, '_blank')}
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmDelete(backup.id)}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4 text-danger" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card variant="compact">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <RefreshCw className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Automatic Backups</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Automatic backups are configured to run daily at 2:00 AM. The system retains the last 30 backups.
                Backups include all database tables, uploaded files, and system configurations.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create Backup" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create a manual backup of the entire system. This will include all database tables and files.
          </p>
          <Input
            label="Notes (optional)"
            value={createNotes}
            onChange={(e) => setCreateNotes(e.target.value)}
            placeholder="Describe this backup..."
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateBackup} disabled={creating}>
              {creating ? 'Creating...' : 'Create Backup'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={restoreModal} onClose={() => { setRestoreModal(false); setRestoreId(null) }} title="Confirm Restore" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Warning</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Restoring a backup will replace all current data with the backup contents. This action cannot be undone.
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Are you sure you want to restore this backup?</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setRestoreModal(false); setRestoreId(null) }}>Cancel</Button>
            <Button variant="danger" onClick={handleRestore} disabled={restoring}>
              {restoring ? 'Restoring...' : 'Restore Backup'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteModal} onClose={() => { setDeleteModal(false); setDeleteId(null) }} title="Confirm Delete" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this backup? This action cannot be undone.</p>
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
