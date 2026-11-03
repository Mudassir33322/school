'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import { showToast } from '@/components/ui/toast'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Shield,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Clock,
} from 'lucide-react'

type Tab = 'personal' | 'account' | 'notifications' | 'security'

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'account', label: 'Account Settings', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Lock },
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>('personal')
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  const [personalInfo, setPersonalInfo] = useState({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@school.edu',
    phone: '+1 (555) 123-4567',
    address: '123 School Street, Education City',
  })

  const [account, setAccount] = useState({
    username: 'admin',
    language: 'English',
    timezone: 'UTC-5',
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    attendanceAlerts: true,
    feeReminders: true,
    examResults: false,
    weeklyDigest: true,
  })

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 1000))
    showToast('Profile updated successfully', 'success')
    setSaving(false)
  }

  const handlePasswordChange = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }
    if (passwords.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error')
      return
    }
    setSaving(true)
    await new Promise((r) => setTimeout(r, 1000))
    showToast('Password changed successfully', 'success')
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setSaving(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-primary text-2xl font-bold">
            AU
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{personalInfo.firstName} {personalInfo.lastName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="primary">Administrator</Badge>
              <span className="text-sm text-muted-foreground">{personalInfo.email}</span>
            </div>
          </div>
        </div>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
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

      {activeTab === 'personal' && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First Name"
                value={personalInfo.firstName}
                onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                icon={<User className="h-4 w-4" />}
              />
              <Input
                label="Last Name"
                value={personalInfo.lastName}
                onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                icon={<User className="h-4 w-4" />}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Email Address"
                type="email"
                value={personalInfo.email}
                onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                icon={<Mail className="h-4 w-4" />}
              />
              <Input
                label="Phone Number"
                type="tel"
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                icon={<Phone className="h-4 w-4" />}
              />
            </div>
            <Input
              label="Address"
              value={personalInfo.address}
              onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
              icon={<MapPin className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'account' && (
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Username"
                value={account.username}
                disabled
                icon={<User className="h-4 w-4" />}
              />
              <Input
                label="Language"
                value={account.language}
                onChange={(e) => setAccount({ ...account, language: e.target.value })}
                icon={<Globe className="h-4 w-4" />}
              />
            </div>
            <Input
              label="Timezone"
              value={account.timezone}
              onChange={(e) => setAccount({ ...account, timezone: e.target.value })}
              icon={<Clock className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Choose what notifications you receive</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive push notifications in browser' },
                { key: 'attendanceAlerts', label: 'Attendance Alerts', desc: 'Get alerts for student absences' },
                { key: 'feeReminders', label: 'Fee Reminders', desc: 'Receive fee payment reminders' },
                { key: 'examResults', label: 'Exam Results', desc: 'Notifications when results are published' },
                { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Receive a weekly summary report' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifications[item.key as keyof typeof notifications]}
                    onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications[item.key as keyof typeof notifications] ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                        notifications[item.key as keyof typeof notifications] ? 'translate-x-[22px]' : 'translate-x-[2px]'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative">
              <Input
                label="Current Password"
                type={showPassword ? 'text' : 'password'}
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                icon={<Lock className="h-4 w-4" />}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="relative">
              <Input
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                icon={<Lock className="h-4 w-4" />}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Input
              label="Confirm New Password"
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              icon={<Lock className="h-4 w-4" />}
            />
            <Button
              variant="primary"
              onClick={handlePasswordChange}
              disabled={saving || !passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Updating...' : 'Update Password'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
