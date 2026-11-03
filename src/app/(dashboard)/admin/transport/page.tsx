'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Route,
  Bus,
  MapPin,
  Pencil,
  Trash2,
  CheckCircle,
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

interface RouteItem {
  id: string
  routeName: string
  driverName: string
  driverPhone: string
  stops: string[]
  fare: number
  status: string
}

interface Vehicle {
  id: string
  vehicleNumber: string
  type: string
  capacity: number
  driverName: string
  driverPhone: string
  insuranceExpiry: string
  status: string
}

const emptyRouteForm = {
  routeName: '',
  driverName: '',
  driverPhone: '',
  stops: '',
  fare: 0,
}

const emptyVehicleForm = {
  vehicleNumber: '',
  type: '',
  capacity: 0,
  driverName: '',
  driverPhone: '',
  insuranceExpiry: '',
}

const vehicleTypeOptions = [
  { value: 'Bus', label: 'Bus' },
  { value: 'Van', label: 'Van' },
  { value: 'Mini Bus', label: 'Mini Bus' },
  { value: 'Tempo', label: 'Tempo' },
]

export default function TransportPage() {
  const [activeTab, setActiveTab] = useState<'routes' | 'vehicles'>('routes')
  const [routes, setRoutes] = useState<RouteItem[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  const [showRouteModal, setShowRouteModal] = useState(false)
  const [editingRoute, setEditingRoute] = useState<RouteItem | null>(null)
  const [routeForm, setRouteForm] = useState(emptyRouteForm)
  const [savingRoute, setSavingRoute] = useState(false)

  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm)
  const [savingVehicle, setSavingVehicle] = useState(false)

  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'route' | 'vehicle'; id: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const stats = {
    totalRoutes: routes.length,
    totalVehicles: vehicles.length,
    active: routes.filter((r) => r.status === 'Active').length + vehicles.filter((v) => v.status === 'Active').length,
  }

  const fetchRoutes = useCallback(async () => {
    try {
      const res = await fetch('/api/transport?tab=routes')
      if (!res.ok) throw new Error('Failed to fetch routes')
      const json = await res.json()
      setRoutes(json.routes?.data ?? json.routes ?? json.data ?? [])
    } catch {
      toast.error('Failed to load routes')
    }
  }, [])

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch('/api/transport?tab=vehicles')
      if (!res.ok) throw new Error('Failed to fetch vehicles')
      const json = await res.json()
      setVehicles(json.vehicles?.data ?? json.vehicles ?? json.data ?? [])
    } catch {
      toast.error('Failed to load vehicles')
    }
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchRoutes(), fetchVehicles()])
    setLoading(false)
  }, [fetchRoutes, fetchVehicles])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  function openAddRoute() {
    setEditingRoute(null)
    setRouteForm(emptyRouteForm)
    setShowRouteModal(true)
  }

  function openEditRoute(route: RouteItem) {
    setEditingRoute(route)
    setRouteForm({
      routeName: route.routeName,
      driverName: route.driverName,
      driverPhone: route.driverPhone,
      stops: route.stops.join(', '),
      fare: route.fare,
    })
    setShowRouteModal(true)
  }

  async function handleSaveRoute() {
    try {
      setSavingRoute(true)
      const url = editingRoute ? `/api/transport/routes/${editingRoute.id}` : '/api/transport/routes'
      const method = editingRoute ? 'PUT' : 'POST'
      const body = {
        ...routeForm,
        stops: routeForm.stops.split(',').map((s) => s.trim()).filter(Boolean),
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(editingRoute ? 'Failed to update route' : 'Failed to add route')
      toast.success(editingRoute ? 'Route updated' : 'Route added')
      setShowRouteModal(false)
      fetchRoutes()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save route')
    } finally {
      setSavingRoute(false)
    }
  }

  function openAddVehicle() {
    setEditingVehicle(null)
    setVehicleForm(emptyVehicleForm)
    setShowVehicleModal(true)
  }

  function openEditVehicle(vehicle: Vehicle) {
    setEditingVehicle(vehicle)
    setVehicleForm({
      vehicleNumber: vehicle.vehicleNumber,
      type: vehicle.type,
      capacity: vehicle.capacity,
      driverName: vehicle.driverName,
      driverPhone: vehicle.driverPhone,
      insuranceExpiry: vehicle.insuranceExpiry?.split('T')[0] ?? '',
    })
    setShowVehicleModal(true)
  }

  async function handleSaveVehicle() {
    try {
      setSavingVehicle(true)
      const url = editingVehicle ? `/api/transport/vehicles/${editingVehicle.id}` : '/api/transport/vehicles'
      const method = editingVehicle ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleForm),
      })
      if (!res.ok) throw new Error(editingVehicle ? 'Failed to update vehicle' : 'Failed to add vehicle')
      toast.success(editingVehicle ? 'Vehicle updated' : 'Vehicle added')
      setShowVehicleModal(false)
      fetchVehicles()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save vehicle')
    } finally {
      setSavingVehicle(false)
    }
  }

  function confirmDelete(type: 'route' | 'vehicle', id: string) {
    setDeleteTarget({ type, id })
    setDeleteModal(true)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      const endpoint = deleteTarget.type === 'route'
        ? `/api/transport/routes/${deleteTarget.id}`
        : `/api/transport/vehicles/${deleteTarget.id}`
      const res = await fetch(endpoint, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success(`${deleteTarget.type === 'route' ? 'Route' : 'Vehicle'} deleted`)
      setDeleteModal(false)
      setDeleteTarget(null)
      if (deleteTarget.type === 'route') fetchRoutes()
      else fetchVehicles()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const routeColumns = [
    { key: 'routeName', label: 'Route Name' },
    { key: 'driverName', label: 'Driver' },
    { key: 'driverPhone', label: 'Phone' },
    { key: 'stops', label: 'Stops', render: (v: unknown) => (
      <div className="flex flex-wrap gap-1">
        {(v as string[]).slice(0, 3).map((stop, i) => (
          <Badge key={i} variant="outline">{stop}</Badge>
        ))}
        {(v as string[]).length > 3 && <Badge variant="default">+{(v as string[]).length - 3}</Badge>}
      </div>
    )},
    { key: 'fare', label: 'Fare', render: (v: unknown) => `$${v}` },
    { key: 'status', label: 'Status', render: (v: unknown) => (
      <Badge variant={v === 'Active' ? 'success' : 'danger'}>{v as string}</Badge>
    )},
  ]

  const vehicleColumns = [
    { key: 'vehicleNumber', label: 'Vehicle No' },
    { key: 'type', label: 'Type', render: (v: unknown) => <Badge variant="info">{v as string}</Badge> },
    { key: 'capacity', label: 'Capacity' },
    { key: 'driverName', label: 'Driver' },
    { key: 'driverPhone', label: 'Phone' },
    { key: 'insuranceExpiry', label: 'Insurance Expiry', render: (v: unknown) => {
      const date = v ? new Date(v as string) : null
      const isExpired = date && date < new Date()
      return (
        <span className={isExpired ? 'text-danger font-medium' : ''}>
          {date ? date.toLocaleDateString() : '-'}
        </span>
      )
    }},
    { key: 'status', label: 'Status', render: (v: unknown) => (
      <Badge variant={v === 'Active' ? 'success' : 'danger'}>{v as string}</Badge>
    )},
  ]

  const statCards = [
    { label: 'Total Routes', value: stats.totalRoutes, icon: Route, color: 'text-primary' },
    { label: 'Total Vehicles', value: stats.totalVehicles, icon: Bus, color: 'text-info' },
    { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-accent' },
  ]

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transport Management</h1>
          <p className="text-muted-foreground mt-1">Manage routes and vehicles</p>
        </div>
        <Button variant="primary" onClick={activeTab === 'routes' ? openAddRoute : openAddVehicle}>
          <Plus className="h-4 w-4 mr-2" />
          {activeTab === 'routes' ? 'Add Route' : 'Add Vehicle'}
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((stat) => (
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
              activeTab === 'routes'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('routes')}
          >
            <Route className="h-4 w-4 inline mr-2" />
            Routes ({routes.length})
          </button>
          <button
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'vehicles'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('vehicles')}
          >
            <Bus className="h-4 w-4 inline mr-2" />
            Vehicles ({vehicles.length})
          </button>
        </div>
      </motion.div>

      {activeTab === 'routes' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle>Route List</CardTitle>
            </CardHeader>
            <CardContent>
              <Table
                columns={routeColumns}
                data={routes}
                loading={loading}
                emptyMessage="No routes found"
                actions={(row) => (
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditRoute(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => confirmDelete('route', row.id)}>
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeTab === 'vehicles' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle>Vehicle List</CardTitle>
            </CardHeader>
            <CardContent>
              <Table
                columns={vehicleColumns}
                data={vehicles}
                loading={loading}
                emptyMessage="No vehicles found"
                actions={(row) => (
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditVehicle(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => confirmDelete('vehicle', row.id)}>
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Modal
        isOpen={showRouteModal}
        onClose={() => setShowRouteModal(false)}
        title={editingRoute ? 'Edit Route' : 'Add Route'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Route Name"
            value={routeForm.routeName}
            onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })}
            placeholder="e.g. Route A - Downtown"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Driver Name"
              value={routeForm.driverName}
              onChange={(e) => setRouteForm({ ...routeForm, driverName: e.target.value })}
              placeholder="Enter driver name"
            />
            <Input
              label="Driver Phone"
              value={routeForm.driverPhone}
              onChange={(e) => setRouteForm({ ...routeForm, driverPhone: e.target.value })}
              placeholder="Enter driver phone"
            />
          </div>
          <Input
            label="Stops (comma separated)"
            value={routeForm.stops}
            onChange={(e) => setRouteForm({ ...routeForm, stops: e.target.value })}
            placeholder="e.g. Main St, Oak Ave, School Gate"
          />
          <Input
            label="Fare ($)"
            type="number"
            min={0}
            value={routeForm.fare}
            onChange={(e) => setRouteForm({ ...routeForm, fare: Number(e.target.value) })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowRouteModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveRoute} disabled={savingRoute}>
              {savingRoute ? 'Saving...' : editingRoute ? 'Update Route' : 'Add Route'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        title={editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Vehicle Number"
              value={vehicleForm.vehicleNumber}
              onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })}
              placeholder="e.g. ABC-1234"
            />
            <Select
              label="Type"
              options={vehicleTypeOptions}
              value={vehicleForm.type}
              onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })}
            />
            <Input
              label="Capacity"
              type="number"
              min={1}
              value={vehicleForm.capacity}
              onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: Number(e.target.value) })}
            />
            <Input
              label="Insurance Expiry"
              type="date"
              value={vehicleForm.insuranceExpiry}
              onChange={(e) => setVehicleForm({ ...vehicleForm, insuranceExpiry: e.target.value })}
            />
            <Input
              label="Driver Name"
              value={vehicleForm.driverName}
              onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
              placeholder="Enter driver name"
            />
            <Input
              label="Driver Phone"
              value={vehicleForm.driverPhone}
              onChange={(e) => setVehicleForm({ ...vehicleForm, driverPhone: e.target.value })}
              placeholder="Enter driver phone"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowVehicleModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveVehicle} disabled={savingVehicle}>
              {savingVehicle ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteModal}
        onClose={() => { setDeleteModal(false); setDeleteTarget(null) }}
        title="Confirm Delete"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this {deleteTarget?.type}? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setDeleteModal(false); setDeleteTarget(null) }}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
