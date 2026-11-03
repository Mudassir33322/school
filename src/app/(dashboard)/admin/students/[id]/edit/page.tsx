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
  bloodGroup: string
  religion: string
  caste: string
  nationality: string
  class: string
  section: string
  rollNo: string
  guardianName: string
  guardianRelation: string
  guardianPhone: string
  guardianEmail: string
  emergencyContactName: string
  emergencyPhone: string
  address: string
  city: string
  state: string
  pincode: string
  status: string
}

interface FormErrors {
  [key: string]: string
}

const classOptions = [
  { value: '1', label: 'Class 1' },
  { value: '2', label: 'Class 2' },
  { value: '3', label: 'Class 3' },
  { value: '4', label: 'Class 4' },
  { value: '5', label: 'Class 5' },
  { value: '6', label: 'Class 6' },
  { value: '7', label: 'Class 7' },
  { value: '8', label: 'Class 8' },
  { value: '9', label: 'Class 9' },
  { value: '10', label: 'Class 10' },
  { value: '11', label: 'Class 11' },
  { value: '12', label: 'Class 12' },
]

const sectionOptions = [
  { value: 'A', label: 'Section A' },
  { value: 'B', label: 'Section B' },
  { value: 'C', label: 'Section C' },
]

const genderOptions = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
]

const bloodGroupOptions = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
]

const relationOptions = [
  { value: 'Father', label: 'Father' },
  { value: 'Mother', label: 'Mother' },
  { value: 'Guardian', label: 'Guardian' },
  { value: 'Brother', label: 'Brother' },
  { value: 'Sister', label: 'Sister' },
  { value: 'Uncle', label: 'Uncle' },
  { value: 'Aunt', label: 'Aunt' },
  { value: 'Grandparent', label: 'Grandparent' },
  { value: 'Other', label: 'Other' },
]

const nationalityOptions = [
  { value: 'Indian', label: 'Indian' },
  { value: 'American', label: 'American' },
  { value: 'British', label: 'British' },
  { value: 'Canadian', label: 'Canadian' },
  { value: 'Australian', label: 'Australian' },
  { value: 'Other', label: 'Other' },
]

const statusOptions = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
]

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  gender: '',
  dob: '',
  bloodGroup: '',
  religion: '',
  caste: '',
  nationality: '',
  class: '',
  section: '',
  rollNo: '',
  guardianName: '',
  guardianRelation: '',
  guardianPhone: '',
  guardianEmail: '',
  emergencyContactName: '',
  emergencyPhone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  status: 'Active',
}

export default function EditStudentPage() {
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
    if (id) fetchStudent()
  }, [id])

  async function fetchStudent() {
    try {
      setLoading(true)
      const res = await fetch(`/api/students/${id}`)
      if (!res.ok) throw new Error('Failed to fetch student data')
      const json = await res.json()
      const data = json.data ?? json

      setFormData({
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        gender: data.gender ?? '',
        dob: data.dob ? data.dob.split('T')[0] : '',
        bloodGroup: data.bloodGroup ?? '',
        religion: data.religion ?? '',
        caste: data.caste ?? '',
        nationality: data.nationality ?? '',
        class: data.class ?? '',
        section: data.section ?? '',
        rollNo: data.rollNo ?? '',
        guardianName: data.guardianName ?? '',
        guardianRelation: data.guardianRelation ?? '',
        guardianPhone: data.guardianPhone ?? '',
        guardianEmail: data.guardianEmail ?? '',
        emergencyContactName: data.emergencyContactName ?? '',
        emergencyPhone: data.emergencyPhone ?? '',
        address: data.address ?? '',
        city: data.city ?? '',
        state: data.state ?? '',
        pincode: data.pincode ?? '',
        status: data.status ?? 'Active',
      })

      if (data.photo) {
        setExistingPhoto(data.photo)
        setPhotoPreview(data.photo)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load student'
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

  function str(val: unknown): string {
    return val == null ? '' : String(val)
  }

  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!str(formData.firstName).trim()) newErrors.firstName = 'First name is required'
    if (!str(formData.lastName).trim()) newErrors.lastName = 'Last name is required'
    if (!formData.gender) newErrors.gender = 'Gender is required'
    if (!formData.dob) newErrors.dob = 'Date of birth is required'
    if (!formData.class) newErrors.class = 'Class is required'
    if (!str(formData.guardianName).trim()) newErrors.guardianName = 'Guardian name is required'
    if (!formData.guardianRelation) newErrors.guardianRelation = 'Relation is required'
    if (!str(formData.guardianPhone).trim()) newErrors.guardianPhone = 'Phone number is required'
    if (!str(formData.address).trim()) newErrors.address = 'Address is required'
    if (!str(formData.city).trim()) newErrors.city = 'City is required'
    if (!str(formData.state).trim()) newErrors.state = 'State is required'
    if (!str(formData.pincode).trim()) newErrors.pincode = 'Pincode is required'

    if (formData.guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guardianEmail)) {
      newErrors.guardianEmail = 'Invalid email format'
    }

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

      const res = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        body: formPayload,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.message || 'Failed to update student')
      }

      toast.success('Student updated successfully')
      router.push(`/admin/students/${id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update student'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading text="Loading student data..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Student</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Update student information</p>
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
                      Upload student photo
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
              <Select
                label="Blood Group"
                options={bloodGroupOptions}
                value={formData.bloodGroup}
                onChange={(e) => handleChange('bloodGroup', e.target.value)}
              />
              <Input
                label="Religion"
                placeholder="Enter religion"
                value={formData.religion}
                onChange={(e) => handleChange('religion', e.target.value)}
              />
              <Input
                label="Caste"
                placeholder="Enter caste"
                value={formData.caste}
                onChange={(e) => handleChange('caste', e.target.value)}
              />
              <Select
                label="Nationality"
                options={nationalityOptions}
                value={formData.nationality}
                onChange={(e) => handleChange('nationality', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select
                label="Class *"
                options={classOptions}
                value={formData.class}
                onChange={(e) => handleChange('class', e.target.value)}
                error={errors.class}
              />
              <Select
                label="Section"
                options={sectionOptions}
                value={formData.section}
                onChange={(e) => handleChange('section', e.target.value)}
              />
              <Input
                label="Roll No"
                placeholder="Enter roll number"
                value={formData.rollNo}
                onChange={(e) => handleChange('rollNo', e.target.value)}
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
            <CardTitle>Parent / Guardian Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="Guardian Name *"
                placeholder="Enter guardian name"
                value={formData.guardianName}
                onChange={(e) => handleChange('guardianName', e.target.value)}
                error={errors.guardianName}
              />
              <Select
                label="Relation *"
                options={relationOptions}
                value={formData.guardianRelation}
                onChange={(e) => handleChange('guardianRelation', e.target.value)}
                error={errors.guardianRelation}
              />
              <Input
                label="Phone *"
                placeholder="Enter phone number"
                value={formData.guardianPhone}
                onChange={(e) => handleChange('guardianPhone', e.target.value)}
                error={errors.guardianPhone}
              />
              <Input
                label="Email"
                type="email"
                placeholder="Enter email address"
                value={formData.guardianEmail}
                onChange={(e) => handleChange('guardianEmail', e.target.value)}
                error={errors.guardianEmail}
              />
              <Input
                label="Emergency Contact Name"
                placeholder="Enter emergency contact name"
                value={formData.emergencyContactName}
                onChange={(e) => handleChange('emergencyContactName', e.target.value)}
              />
              <Input
                label="Emergency Phone"
                placeholder="Enter emergency phone"
                value={formData.emergencyPhone}
                onChange={(e) => handleChange('emergencyPhone', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-3">
                <Input
                  label="Address *"
                  placeholder="Enter full address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  error={errors.address}
                />
              </div>
              <Input
                label="City *"
                placeholder="Enter city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                error={errors.city}
              />
              <Input
                label="State *"
                placeholder="Enter state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                error={errors.state}
              />
              <Input
                label="Pincode *"
                placeholder="Enter pincode"
                value={formData.pincode}
                onChange={(e) => handleChange('pincode', e.target.value)}
                error={errors.pincode}
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
            {submitting ? 'Updating...' : 'Update Student'}
          </Button>
        </div>
      </form>
    </div>
  )
}
