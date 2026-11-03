'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import { Loading } from '@/components/ui/loading'
import { showToast } from '@/components/ui/toast'
import {
  Save,
  Upload,
  School,
  Calendar,
  GraduationCap,
  Bell,
  Settings2,
  BookOpen,
} from 'lucide-react'
import type { SchoolSettings } from '@/types'

const ACADEMIC_YEARS = Array.from({ length: 10 }, (_, i) => {
  const start = new Date().getFullYear() - 5 + i
  return { value: `${start}-${start + 1}`, label: `${start}-${start + 1}` }
})

const SESSION_MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(0, i).toLocaleString('default', { month: 'long' }),
}))

const GRADING_OPTIONS = [
  { value: 'Grade', label: 'Grade' },
  { value: 'GPA', label: 'GPA' },
  { value: 'Both', label: 'Both' },
]

type Tab = 'general' | 'academic' | 'grading' | 'notifications'

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'General', icon: School },
  { id: 'academic', label: 'Academic', icon: Calendar },
  { id: 'grading', label: 'Grading', icon: GraduationCap },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

const defaultSettings: SchoolSettings = {
  schoolName: '',
  schoolAddress: '',
  schoolCity: '',
  schoolState: '',
  schoolPincode: '',
  schoolPhone: '',
  schoolEmail: '',
  schoolWebsite: '',
  schoolLogo: '',
  academicYear: '',
  gradingSystem: 'Both',
  sessionStartMonth: 4,
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [settings, setSettings] = useState<SchoolSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [passPercentage, setPassPercentage] = useState('40')

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      const json = await res.json()
      const fetched = json.data ?? json.settings ?? defaultSettings
      setSettings(fetched)
      if (fetched.schoolLogo) {
        setLogoPreview(fetched.schoolLogo)
      }
    } catch {
      showToast('Failed to load settings', 'error')
      setSettings(defaultSettings)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof SchoolSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setLogoPreview(result)
      setSettings((prev) => ({ ...prev, schoolLogo: result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, passPercentage: Number(passPercentage) }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Failed to save settings')
      showToast('Settings saved successfully', 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings'
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading message="Loading settings..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">School Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your school configuration</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchSettings} disabled={saving}>Reset</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <div className="border-b border-border">
        <nav className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {activeTab === 'general' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <School className="h-5 w-5 text-primary" />
                <CardTitle>School Information</CardTitle>
              </div>
              <CardDescription>Manage your school&apos;s basic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="School Name"
                value={settings.schoolName}
                onChange={(e) => handleChange('schoolName', e.target.value)}
                placeholder="Enter school name"
              />
              <Input
                label="School Address"
                value={settings.schoolAddress}
                onChange={(e) => handleChange('schoolAddress', e.target.value)}
                placeholder="Enter school address"
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Input
                  label="City"
                  value={settings.schoolCity}
                  onChange={(e) => handleChange('schoolCity', e.target.value)}
                  placeholder="City"
                />
                <Input
                  label="State"
                  value={settings.schoolState}
                  onChange={(e) => handleChange('schoolState', e.target.value)}
                  placeholder="State"
                />
                <Input
                  label="Pincode"
                  value={settings.schoolPincode}
                  onChange={(e) => handleChange('schoolPincode', e.target.value)}
                  placeholder="Pincode"
                />
                <Input
                  label="Website"
                  value={settings.schoolWebsite}
                  onChange={(e) => handleChange('schoolWebsite', e.target.value)}
                  placeholder="https://"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="School Phone"
                  value={settings.schoolPhone}
                  onChange={(e) => handleChange('schoolPhone', e.target.value)}
                  placeholder="Enter phone number"
                />
                <Input
                  label="School Email"
                  type="email"
                  value={settings.schoolEmail}
                  onChange={(e) => handleChange('schoolEmail', e.target.value)}
                  placeholder="admin@school.edu"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <CardTitle>School Logo</CardTitle>
              </div>
              <CardDescription>Upload your school logo (recommended: 200x200px)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted">
                  {logoPreview ? (
                    <img src={logoPreview} alt="School Logo Preview" loading="lazy" className="h-full w-full object-contain" />
                  ) : (
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-xs text-muted-foreground mt-1">No logo</p>
                    </div>
                  )}
                </div>
                <div>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Logo
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  <p className="mt-2 text-xs text-muted-foreground">PNG, JPG or SVG. Max 2MB.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'academic' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Academic Session</CardTitle>
            </div>
            <CardDescription>Configure current academic year and session start</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Current Academic Year"
                options={ACADEMIC_YEARS}
                value={settings.academicYear}
                onChange={(e) => handleChange('academicYear', e.target.value)}
              />
              <Select
                label="Session Start Month"
                options={SESSION_MONTHS}
                value={String(settings.sessionStartMonth)}
                onChange={(e) => handleChange('sessionStartMonth', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'grading' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <CardTitle>Grading Settings</CardTitle>
            </div>
            <CardDescription>Configure grading system and pass criteria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Grading System"
                options={GRADING_OPTIONS}
                value={settings.gradingSystem}
                onChange={(e) => handleChange('gradingSystem', e.target.value as 'Grade' | 'GPA' | 'Both')}
              />
              <Input
                label="Pass Percentage"
                type="number"
                value={passPercentage}
                onChange={(e) => setPassPercentage(e.target.value)}
                placeholder="40"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Default Notification Settings</CardTitle>
            </div>
            <CardDescription>Configure default notification preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Email Notifications', desc: 'Send email notifications by default' },
                { label: 'SMS Notifications', desc: 'Send SMS notifications by default' },
                { label: 'Attendance Alerts', desc: 'Automatically alert parents about absences' },
                { label: 'Fee Reminders', desc: 'Send fee payment reminders automatically' },
                { label: 'Exam Result Alerts', desc: 'Notify when results are published' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary transition-colors cursor-pointer">
                    <span className="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm translate-x-[22px]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
