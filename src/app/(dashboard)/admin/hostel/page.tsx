'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Building2,
  Search,
  Plus,
  Pencil,
  Trash2,
  BedDouble,
  Users,
  DoorOpen,
  Phone,
  AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Modal from '@/components/ui/modal'
import Table from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface Hostel {
  id: string
  name: string
  type: string
  wardenName: string
  wardenPhone: string
  totalRooms: number
  address: string
  totalOccupied: number
  totalAvailable: number
}

interface Room {
  id: string
  hostelId: string
  hostelName: string
  roomNumber: string
  type: string
  capacity: number
  rent: number
  facilities: string
  status: string
  occupantName?: string
  occupantId?: string
}

interface HostelForm {
  name: string
  type: string
  wardenName: string
  wardenPhone: string
  totalRooms: string
  address: string
}

interface RoomForm {
  hostelId: string
  roomNumber: string
  type: string
  capacity: string
  rent: string
  facilities: string
}

interface AssignForm {
  roomId: string
  occupantName: string
  occupantId: string
}

const hostelTypeOptions = [
  { value: 'Boys', label: 'Boys' },
  { value: 'Girls', label: 'Girls' },
]

const roomTypeOptions = [
  { value: 'Standard', label: 'Standard' },
  { value: 'Deluxe', label: 'Deluxe' },
]

const emptyHostelForm: HostelForm = {
  name: '',
  type: '',
  wardenName: '',
  wardenPhone: '',
  totalRooms: '',
  address: '',
}

const emptyRoomForm: RoomForm = {
  hostelId: '',
  roomNumber: '',
  type: '',
  capacity: '',
  rent: '',
  facilities: '',
}

export default function HostelPage() {
  const [activeTab, setActiveTab] = useState<'hostels' | 'rooms'>('hostels')
  const [hostels, setHostels] = useState<Hostel[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const [showHostelModal, setShowHostelModal] = useState(false)
  const [editingHostel, setEditingHostel] = useState<Hostel | null>(null)
  const [hostelForm, setHostelForm] = useState<HostelForm>(emptyHostelForm)
  const [submitting, setSubmitting] = useState(false)

  const [showRoomModal, setShowRoomModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [roomForm, setRoomForm] = useState<RoomForm>(emptyRoomForm)

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignForm, setAssignForm] = useState<AssignForm>({ roomId: '', occupantName: '', occupantId: '' })
  const [selectedHostelForRooms, setSelectedHostelForRooms] = useState('')

  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'hostel' | 'room'; id: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchHostels = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (typeFilter) params.set('type', typeFilter)
      const res = await fetch(`/api/hostel?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch hostels')
      const json = await res.json()
      setHostels(json.data ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load hostels')
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter])

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedHostelForRooms) params.set('hostelId', selectedHostelForRooms)
      if (search) params.set('search', search)
      const res = await fetch(`/api/hostel/rooms?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch rooms')
      const json = await res.json()
      setRooms(json.data ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load rooms')
    } finally {
      setLoading(false)
    }
  }, [selectedHostelForRooms, search])

  useEffect(() => {
    if (activeTab === 'hostels') fetchHostels()
    else fetchRooms()
  }, [activeTab, fetchHostels, fetchRooms])

  function openAddHostel() {
    setEditingHostel(null)
    setHostelForm(emptyHostelForm)
    setShowHostelModal(true)
  }

  function openEditHostel(hostel: Hostel) {
    setEditingHostel(hostel)
    setHostelForm({
      name: hostel.name,
      type: hostel.type,
      wardenName: hostel.wardenName,
      wardenPhone: hostel.wardenPhone,
      totalRooms: String(hostel.totalRooms),
      address: hostel.address,
    })
    setShowHostelModal(true)
  }

  async function handleSaveHostel() {
    if (!hostelForm.name || !hostelForm.type) {
      toast.error('Please fill in required fields')
      return
    }
    try {
      setSubmitting(true)
      const method = editingHostel ? 'PUT' : 'POST'
      const url = editingHostel ? `/api/hostel/${editingHostel.id}` : '/api/hostel'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...hostelForm,
          totalRooms: Number(hostelForm.totalRooms) || 0,
        }),
      })
      if (!res.ok) throw new Error('Failed to save hostel')
      toast.success(editingHostel ? 'Hostel updated successfully' : 'Hostel added successfully')
      setShowHostelModal(false)
      fetchHostels()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save hostel')
    } finally {
      setSubmitting(false)
    }
  }

  function openAddRoom() {
    setEditingRoom(null)
    setRoomForm({ ...emptyRoomForm, hostelId: selectedHostelForRooms })
    setShowRoomModal(true)
  }

  function openEditRoom(room: Room) {
    setEditingRoom(room)
    setRoomForm({
      hostelId: room.hostelId,
      roomNumber: room.roomNumber,
      type: room.type,
      capacity: String(room.capacity),
      rent: String(room.rent),
      facilities: room.facilities,
    })
    setShowRoomModal(true)
  }

  async function handleSaveRoom() {
    if (!roomForm.hostelId || !roomForm.roomNumber || !roomForm.type) {
      toast.error('Please fill in required fields')
      return
    }
    try {
      setSubmitting(true)
      const method = editingRoom ? 'PUT' : 'POST'
      const url = editingRoom ? `/api/hostel/rooms/${editingRoom.id}` : '/api/hostel/rooms'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...roomForm,
          capacity: Number(roomForm.capacity) || 1,
          rent: Number(roomForm.rent) || 0,
        }),
      })
      if (!res.ok) throw new Error('Failed to save room')
      toast.success(editingRoom ? 'Room updated successfully' : 'Room added successfully')
      setShowRoomModal(false)
      fetchRooms()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save room')
    } finally {
      setSubmitting(false)
    }
  }

  function openAssignRoom(room: Room) {
    setAssignForm({ roomId: room.id, occupantName: '', occupantId: '' })
    setShowAssignModal(true)
  }

  async function handleAssignRoom() {
    if (!assignForm.occupantName || !assignForm.occupantId) {
      toast.error('Please fill in occupant details')
      return
    }
    try {
      setSubmitting(true)
      const res = await fetch(`/api/hostel/rooms/${assignForm.roomId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ occupantName: assignForm.occupantName, occupantId: assignForm.occupantId }),
      })
      if (!res.ok) throw new Error('Failed to assign room')
      toast.success('Room assigned successfully')
      setShowAssignModal(false)
      fetchRooms()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign room')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVacateRoom(roomId: string) {
    try {
      const res = await fetch(`/api/hostel/rooms/${roomId}/vacate`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to vacate room')
      toast.success('Room vacated successfully')
      fetchRooms()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to vacate room')
    }
  }

  function confirmDelete(type: 'hostel' | 'room', id: string) {
    setDeleteTarget({ type, id })
    setDeleteModal(true)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      const url = deleteTarget.type === 'hostel'
        ? `/api/hostel/${deleteTarget.id}`
        : `/api/hostel/rooms/${deleteTarget.id}`
      const res = await fetch(url, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success(`${deleteTarget.type === 'hostel' ? 'Hostel' : 'Room'} deleted successfully`)
      setDeleteModal(false)
      setDeleteTarget(null)
      if (deleteTarget.type === 'hostel') fetchHostels()
      else fetchRooms()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const totalHostels = hostels.length
  const totalRooms = hostels.reduce((sum, h) => sum + h.totalRooms, 0)
  const totalOccupied = hostels.reduce((sum, h) => sum + h.totalOccupied, 0)
  const totalAvailable = totalRooms - totalOccupied

  const summaryCards = [
    { label: 'Total Hostels', value: totalHostels, icon: Building2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-500/20' },
    { label: 'Total Rooms', value: totalRooms, icon: BedDouble, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 dark:bg-purple-500/20' },
    { label: 'Occupied', value: totalOccupied, icon: Users, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 dark:bg-orange-500/20' },
    { label: 'Available', value: totalAvailable, icon: DoorOpen, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10 dark:bg-green-500/20' },
  ]

  const hostelColumns = [
    { key: 'name', label: 'Hostel Name', render: (_: unknown, row: Hostel) => <span className="font-medium">{row.name}</span> },
    { key: 'type', label: 'Type', render: (_: unknown, row: Hostel) => <Badge variant={row.type === 'Boys' ? 'info' : 'primary'}>{row.type}</Badge> },
    { key: 'wardenName', label: 'Warden' },
    { key: 'wardenPhone', label: 'Warden Phone', render: (_: unknown, row: Hostel) => (
      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{row.wardenPhone}</span>
    )},
    { key: 'totalRooms', label: 'Total Rooms' },
    { key: 'totalOccupied', label: 'Occupied', render: (_: unknown, row: Hostel) => (
      <Badge variant={row.totalOccupied >= row.totalRooms ? 'danger' : 'warning'}>{row.totalOccupied}</Badge>
    )},
    { key: 'totalAvailable', label: 'Available', render: (_: unknown, row: Hostel) => (
      <Badge variant="success">{row.totalAvailable}</Badge>
    )},
  ]

  const roomColumns = [
    { key: 'hostelName', label: 'Hostel' },
    { key: 'roomNumber', label: 'Room No', render: (_: unknown, row: Room) => <span className="font-medium">{row.roomNumber}</span> },
    { key: 'type', label: 'Type', render: (_: unknown, row: Room) => <Badge variant={row.type === 'Deluxe' ? 'primary' : 'default'}>{row.type}</Badge> },
    { key: 'capacity', label: 'Capacity' },
    { key: 'rent', label: 'Rent', render: (_: unknown, row: Room) => `₹${row.rent.toLocaleString()}` },
    { key: 'facilities', label: 'Facilities', render: (_: unknown, row: Room) => row.facilities || '-' },
    { key: 'status', label: 'Status', render: (_: unknown, row: Room) => (
      <Badge variant={row.status === 'Occupied' ? 'danger' : row.status === 'Maintenance' ? 'warning' : 'success'}>{row.status}</Badge>
    )},
    { key: 'occupantName', label: 'Occupant', render: (_: unknown, row: Room) => row.occupantName || '-' },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hostel Management</h1>
          <p className="text-muted-foreground mt-1">Manage hostels, rooms, and assignments</p>
        </div>
        <Button variant="primary" onClick={activeTab === 'hostels' ? openAddHostel : openAddRoom}>
          <Plus className="h-4 w-4 mr-2" />
          {activeTab === 'hostels' ? 'Add Hostel' : 'Add Room'}
        </Button>
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
                  placeholder={activeTab === 'hostels' ? 'Search hostels...' : 'Search rooms...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              {activeTab === 'hostels' ? (
                <div className="w-full sm:w-48">
                  <Select
                    options={hostelTypeOptions}
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    placeholder="All Types"
                  />
                </div>
              ) : (
                <div className="w-full sm:w-48">
                  <Select
                    options={hostels.map((h) => ({ value: h.id, label: h.name }))}
                    value={selectedHostelForRooms}
                    onChange={(e) => setSelectedHostelForRooms(e.target.value)}
                    placeholder="All Hostels"
                  />
                </div>
              )}
              <Button variant="primary" onClick={activeTab === 'hostels' ? fetchHostels : fetchRooms}>
                <Search className="h-4 w-4 mr-2" /> Search
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex items-center gap-2 border-b border-border">
        {(['hostels', 'rooms'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => { setActiveTab(tab); setSearch('') }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'hostels' ? <Building2 className="h-4 w-4 inline mr-1.5" /> : <BedDouble className="h-4 w-4 inline mr-1.5" />}
            {tab === 'hostels' ? 'Hostels' : 'Rooms'}
          </button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        {activeTab === 'hostels' ? (
          <Card>
            <CardHeader>
              <CardTitle>Hostel List</CardTitle>
            </CardHeader>
            <CardContent>
              <Table
                columns={hostelColumns}
                data={hostels}
                loading={loading}
                actions={(row: Hostel) => (
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditHostel(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => confirmDelete('hostel', row.id)}>
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Room List</CardTitle>
            </CardHeader>
            <CardContent>
              <Table
                columns={roomColumns}
                data={rooms}
                loading={loading}
                actions={(row: Room) => (
                  <div className="flex items-center justify-end gap-2">
                    {row.status === 'Available' ? (
                      <Button variant="ghost" size="sm" onClick={() => openAssignRoom(row)} title="Assign">
                        <Users className="h-4 w-4 text-primary" />
                      </Button>
                    ) : row.status === 'Occupied' ? (
                      <Button variant="ghost" size="sm" onClick={() => handleVacateRoom(row.id)} title="Vacate">
                        <AlertCircle className="h-4 w-4 text-warning" />
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="sm" onClick={() => openEditRoom(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => confirmDelete('room', row.id)}>
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        )}
      </motion.div>

      <Modal isOpen={showHostelModal} onClose={() => setShowHostelModal(false)} title={editingHostel ? 'Edit Hostel' : 'Add Hostel'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Hostel Name *"
              value={hostelForm.name}
              onChange={(e) => setHostelForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Enter hostel name"
            />
            <Select
              label="Type *"
              options={hostelTypeOptions}
              value={hostelForm.type}
              onChange={(e) => setHostelForm((f) => ({ ...f, type: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Warden Name"
              value={hostelForm.wardenName}
              onChange={(e) => setHostelForm((f) => ({ ...f, wardenName: e.target.value }))}
              placeholder="Enter warden name"
            />
            <Input
              label="Warden Phone"
              value={hostelForm.wardenPhone}
              onChange={(e) => setHostelForm((f) => ({ ...f, wardenPhone: e.target.value }))}
              placeholder="Enter warden phone"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Total Rooms"
              type="number"
              value={hostelForm.totalRooms}
              onChange={(e) => setHostelForm((f) => ({ ...f, totalRooms: e.target.value }))}
              placeholder="0"
            />
            <Input
              label="Address"
              value={hostelForm.address}
              onChange={(e) => setHostelForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Enter address"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowHostelModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveHostel} disabled={submitting}>
              {submitting ? 'Saving...' : editingHostel ? 'Update Hostel' : 'Add Hostel'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showRoomModal} onClose={() => setShowRoomModal(false)} title={editingRoom ? 'Edit Room' : 'Add Room'} size="lg">
        <div className="space-y-4">
          <Select
            label="Hostel *"
            options={hostels.map((h) => ({ value: h.id, label: h.name }))}
            value={roomForm.hostelId}
            onChange={(e) => setRoomForm((f) => ({ ...f, hostelId: e.target.value }))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Room Number *"
              value={roomForm.roomNumber}
              onChange={(e) => setRoomForm((f) => ({ ...f, roomNumber: e.target.value }))}
              placeholder="e.g. 101"
            />
            <Select
              label="Room Type *"
              options={roomTypeOptions}
              value={roomForm.type}
              onChange={(e) => setRoomForm((f) => ({ ...f, type: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Capacity"
              type="number"
              value={roomForm.capacity}
              onChange={(e) => setRoomForm((f) => ({ ...f, capacity: e.target.value }))}
              placeholder="1"
            />
            <Input
              label="Rent"
              type="number"
              value={roomForm.rent}
              onChange={(e) => setRoomForm((f) => ({ ...f, rent: e.target.value }))}
              placeholder="0"
            />
          </div>
          <Input
            label="Facilities"
            value={roomForm.facilities}
            onChange={(e) => setRoomForm((f) => ({ ...f, facilities: e.target.value }))}
            placeholder="e.g. AC, WiFi, Attached Bathroom"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowRoomModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveRoom} disabled={submitting}>
              {submitting ? 'Saving...' : editingRoom ? 'Update Room' : 'Add Room'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Room" size="md">
        <div className="space-y-4">
          <Input
            label="Occupant Name *"
            value={assignForm.occupantName}
            onChange={(e) => setAssignForm((f) => ({ ...f, occupantName: e.target.value }))}
            placeholder="Enter occupant name"
          />
          <Input
            label="Occupant ID *"
            value={assignForm.occupantId}
            onChange={(e) => setAssignForm((f) => ({ ...f, occupantId: e.target.value }))}
            placeholder="Enter student/staff ID"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAssignRoom} disabled={submitting}>
              {submitting ? 'Assigning...' : 'Assign Room'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteModal} onClose={() => { setDeleteModal(false); setDeleteTarget(null) }} title="Confirm Delete" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this {deleteTarget?.type}? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setDeleteModal(false); setDeleteTarget(null) }}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
