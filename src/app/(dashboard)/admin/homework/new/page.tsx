'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'

interface FormData {
  title: string
  description: string
  subject: string
  class: string
  section: string
  dueDate: string
}

interface FormErrors {
  [key: string]: string
}

const subjectOptions = [
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'Physics', label: 'Physics' },
  { value: 'Chemistry', label: 'Chemistry' },
  { value: 'Biology', label: 'Biology' },
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'History', label: 'History' },
  { value: 'Geography', label: 'Geography' },
  { value: 'Computer Science', label: 'Computer Science' },
]

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

const initialFormData: FormData = {
  title: '',
  description: '',
  subject: '',
  class: '',
  section: '',
  dueDate: '',
}

export default function NewHomeworkPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [attachmentName, setAttachmentName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAttachment(file)
      setAttachmentName(file.name)
    }
  }

  const removeAttachment = () => {
    setAttachment(null)
    setAttachmentName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.subject) newErrors.subject = 'Subject is required'
    if (!formData.class) newErrors.class = 'Class is required'
    if (!formData.section) newErrors.section = 'Section is required'
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required'
    } else if (new Date(formData.dueDate) < new Date(new Date().toDateString())) {
      newErrors.dueDate = 'Due date cannot be in the past'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
      if (attachment) formPayload.append('attachment', attachment)

      const res = await fetch('/api/homework', {
        method: 'POST',
        body: formPayload,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.message || 'Failed to assign homework')
      }

      toast.success('Homework assigned successfully')
      router.push('/admin/homework')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign homework'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Assign Homework</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create a new homework assignment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Homework Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Title *"
                placeholder="Enter homework title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                error={errors.title}
              />
              <Input
                label="Due Date *"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                error={errors.dueDate}
              />
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description *
                </label>
                <textarea
                  className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-900 ${
                    errors.description
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
                  }`}
                  rows={4}
                  placeholder="Enter detailed description of the homework"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.description}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Subject *"
                options={subjectOptions}
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                error={errors.subject}
              />
              <Select
                label="Class *"
                options={classOptions}
                value={formData.class}
                onChange={(e) => handleChange('class', e.target.value)}
                error={errors.class}
              />
              <Select
                label="Section *"
                options={sectionOptions}
                value={formData.section}
                onChange={(e) => handleChange('section', e.target.value)}
                error={errors.section}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attachment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {attachmentName ? (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{attachmentName}</span>
                  <button type="button" onClick={removeAttachment}>
                    <X className="h-4 w-4 text-gray-400 hover:text-danger" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 px-4 py-3 hover:border-primary transition-colors"
                >
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Upload attachment</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleAttachmentChange}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Assigning...' : 'Assign Homework'}
          </Button>
        </div>
      </form>
    </div>
  )
}
