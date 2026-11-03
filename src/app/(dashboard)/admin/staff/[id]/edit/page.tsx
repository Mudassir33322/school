'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import { Loading } from '@/components/ui/loading'

interface FormData {
  firstName: string
  lastName: string
  gender: string
  dob: string
  email: string
  phone: string
  address: string
  department: string
  designation: string
  joiningDate: string
  basicSalary: string
  status: string
}

interface FormErrors {
  [key: string]: string
}

const genderOptions = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
]

const departmentOptions = [
  { value: 'Administration', label: 'Administration' },
  { value: 'Accounts', label: 'Accounts' },
  { value: 'Library', label: 'Library' },
  { value: 'Laboratory', label: 'Laboratory' },
  { value: 'Transport', label: 'Transport' },
  { value: 'Security', label: 'Security' },
  { value: 'Maintenance', label: 'Maintenance' },
  { value: 'IT Support', label: 'IT Support' },
  { value: 'Canteen', label: 'Canteen' },
  { value: 'Housekeeping', label: 'Housekeeping' },
]

const designationOptions = [
  { value: 'Administrator', label: 'Administrator' },
  { value: 'Accountant', label: 'Accountant' },
  { value: 'Librarian', label: 'Librarian' },
  { value: 'Lab Assistant', label: 'Lab Assistant' },
  { value: 'Driver', label: 'Driver' },
  { value: 'Security Guard', label: 'Security Guard' },
  { value: 'Clerk', label: 'Clerk' },
  { value: 'Receptionist', label: 'Receptionist' },
  { value: 'IT Technician', label: 'IT Technician' },
  { value: 'Helper', label: 'Helper' },
]

const statusOptions = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'On Leave', label: 'On Leave' },
]

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  gender: '',
  dob: '',
  email: '',
  phone: '',
  address: '',
  department: '',
  designation: '',
  joiningDate: '',
  basicSalary: '',
  status: 'Active',
}

export default function EditStaffPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (id) fetchStaff()
  }, [id])

  async function fetchStaff() {
    try {
      setLoading(true)
      const res = await fetch(`/api/staff/${id}`)
      if (!res.ok) throw new Error('Failed to fetch staff data')
      const json = await res.json()
      const data = json.data ?? json

      setFormData({
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        gender: data.gender ?? '',
        dob: data.dob ? data.dob.split('T')[0] : '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        address: data.address ?? '',
        department: data.department ?? '',
        designation: data.designation ?? '',
        joiningDate: data.joiningDate ? data.joiningDate.split('T')[0] : '',
        basicSalary: data.basicSalary?.toString() ?? '',
        status: data.status ?? 'Active',
      })

      if (data.photo) {
        setExistingPhoto(data.photo)
        setPhotoPreview(data.photo)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load staff'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setPhotoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  function removePhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
    setExistingPhoto(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.gender) newErrors.gender = 'Gender is required'
    if (!formData.dob) newErrors.dob = 'Date of birth is required'
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!formData.department) newErrors.department = 'Department is required'
    if (!formData.designation) newErrors.designation = 'Designation is required'
    if (!formData.joiningDate) newErrors.joiningDate = 'Joining date is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) {
      toast.error('Please fix the form errors')
      return
    }

    try {
      setSubmitting(true)
      const formPayload = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        formPayload.append(key, value)
      })
      if (photoFile) formPayload.append('photo', photoFile)
      if (!photoFile && !existingPhoto) formPayload.append('removePhoto', 'true')

      const res = await fetch(`/api/staff/${id}`, {
        method: 'PUT',
        body: formPayload,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.message || 'Failed to update staff')
      }

      toast.success('Staff updated successfully')
      router.push(`/admin/staff/${id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update staff'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading text="Loading staff data..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Staff</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Update staff information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Photo</p>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="h-24 w-24 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -top-2 -right-2 rounded-full bg-danger p-0.5 text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary transition-colors"
                    >
                      <Upload className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Upload staff photo
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      JPG, PNG or GIF. Max 2MB.
                    </p>
                  </div>
                </div>
              </div>

              <Input
                label="First Name *"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                error={errors.firstName}
              />
              <Input
                label="Last Name *"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                error={errors.lastName}
              />
              <Select
                label="Gender *"
                options={genderOptions}
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                error={errors.gender}
              />
              <Input
                label="Date of Birth *"
                type="date"
                value={formData.dob}
                onChange={(e) => handleChange('dob', e.target.value)}
                error={errors.dob}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="Email *"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email}
              />
              <Input
                label="Phone *"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                error={errors.phone}
              />
              <div className="lg:col-span-3">
                <Input
                  label="Address *"
                  placeholder="Enter full address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  error={errors.address}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select
                label="Department *"
                options={departmentOptions}
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                error={errors.department}
              />
              <Select
                label="Designation *"
                options={designationOptions}
                value={formData.designation}
                onChange={(e) => handleChange('designation', e.target.value)}
                error={errors.designation}
              />
              <Input
                label="Joining Date *"
                type="date"
                value={formData.joiningDate}
                onChange={(e) => handleChange('joiningDate', e.target.value)}
                error={errors.joiningDate}
              />
              <Select
                label="Status"
                options={statusOptions}
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salary Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="Basic Salary"
                type="number"
                min="0"
                placeholder="Enter basic salary"
                value={formData.basicSalary}
                onChange={(e) => handleChange('basicSalary', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
          >
            {submitting ? 'Updating...' : 'Update Staff'}
          </Button>
        </div>
      </form>
    </div>
  )
}
