'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'

interface FormData {
  title: string
  content: string
  type: string
  targetAudience: string[]
}

interface FormErrors {
  [key: string]: string
}

const typeOptions = [
  { value: 'Notice', label: 'Notice' },
  { value: 'Announcement', label: 'Announcement' },
  { value: 'Holiday', label: 'Holiday' },
  { value: 'Event', label: 'Event' },
]

const audienceOptions = [
  { value: 'All', label: 'All' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Teachers', label: 'Teachers' },
  { value: 'Students', label: 'Students' },
  { value: 'Parents', label: 'Parents' },
]

const initialFormData: FormData = {
  title: '',
  content: '',
  type: '',
  targetAudience: [],
}

export default function NewNoticePage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [audienceInput, setAudienceInput] = useState('')

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

  const addAudience = () => {
    if (!audienceInput) return
    if (audienceInput === 'All') {
      setFormData((prev) => ({ ...prev, targetAudience: ['All'] }))
      setAudienceInput('')
      return
    }
    setFormData((prev) => {
      const current = prev.targetAudience.includes('All') ? [] : prev.targetAudience
      if (!current.includes(audienceInput)) {
        return { ...prev, targetAudience: [...current, audienceInput] }
      }
      return prev
    })
    setAudienceInput('')
  }

  const removeAudience = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      targetAudience: prev.targetAudience.filter((a) => a !== item),
    }))
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.content.trim()) newErrors.content = 'Content is required'
    if (!formData.type) newErrors.type = 'Notice type is required'
    if (formData.targetAudience.length === 0) newErrors.targetAudience = 'At least one audience is required'
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
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.message || 'Failed to create notice')
      }

      toast.success('Notice created successfully')
      router.push('/admin/notices')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create notice'
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create Notice</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Post a new notice or announcement</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Notice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Title *"
                placeholder="Enter notice title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                error={errors.title}
              />
              <Select
                label="Type *"
                options={typeOptions}
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                error={errors.type}
              />
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Content *
                </label>
                <textarea
                  className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-900 ${
                    errors.content
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
                  }`}
                  rows={5}
                  placeholder="Enter notice content"
                  value={formData.content}
                  onChange={(e) => handleChange('content', e.target.value)}
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.content}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Target Audience</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-2">
              <Select
                options={audienceOptions}
                value={audienceInput}
                onChange={(e) => setAudienceInput(e.target.value)}
              />
              <Button type="button" variant="outline" size="sm" onClick={addAudience}>
                Add
              </Button>
            </div>
            {errors.targetAudience && (
              <p className="text-sm text-red-500 dark:text-red-400 mb-2">{errors.targetAudience}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {formData.targetAudience.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                >
                  {item}
                  <button type="button" onClick={() => removeAudience(item)}>
                    <XCircle className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {formData.targetAudience.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  No audience selected. Add at least one.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Notice'}
          </Button>
        </div>
      </form>
    </div>
  )
}
