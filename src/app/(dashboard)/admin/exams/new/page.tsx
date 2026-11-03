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
  name: string
  type: string
  classes: string[]
  subjects: string[]
  startDate: string
  endDate: string
  maxMarks: string
  passingMarks: string
  academicYear: string
}

interface FormErrors {
  [key: string]: string
}

const typeOptions = [
  { value: 'Mid-Term', label: 'Mid-Term' },
  { value: 'Final', label: 'Final' },
  { value: 'Unit Test', label: 'Unit Test' },
  { value: 'Practical', label: 'Practical' },
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
  { value: 'Physical Education', label: 'Physical Education' },
  { value: 'Art', label: 'Art' },
  { value: 'Music', label: 'Music' },
]

const currentYear = new Date().getFullYear()
const academicYearOptions = [
  { value: `${currentYear - 1}-${currentYear}`, label: `${currentYear - 1}-${currentYear}` },
  { value: `${currentYear}-${currentYear + 1}`, label: `${currentYear}-${currentYear + 1}` },
]

const initialFormData: FormData = {
  name: '',
  type: '',
  classes: [],
  subjects: [],
  startDate: '',
  endDate: '',
  maxMarks: '',
  passingMarks: '',
  academicYear: `${currentYear}-${currentYear + 1}`,
}

export default function NewExamPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [classInput, setClassInput] = useState('')
  const [subjectInput, setSubjectInput] = useState('')

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

  const addClass = () => {
    if (classInput && !formData.classes.includes(classInput)) {
      setFormData((prev) => ({ ...prev, classes: [...prev.classes, classInput] }))
      setClassInput('')
    }
  }

  const removeClass = (cls: string) => {
    setFormData((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c !== cls),
    }))
  }

  const addSubject = () => {
    if (subjectInput && !formData.subjects.includes(subjectInput)) {
      setFormData((prev) => ({ ...prev, subjects: [...prev.subjects, subjectInput] }))
      setSubjectInput('')
    }
  }

  const removeSubject = (subject: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s !== subject),
    }))
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Exam name is required'
    if (!formData.type) newErrors.type = 'Exam type is required'
    if (formData.classes.length === 0) newErrors.classes = 'At least one class is required'
    if (formData.subjects.length === 0) newErrors.subjects = 'At least one subject is required'
    if (!formData.startDate) newErrors.startDate = 'Start date is required'
    if (!formData.endDate) newErrors.endDate = 'End date is required'
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date'
    }
    if (!formData.maxMarks || Number(formData.maxMarks) <= 0) newErrors.maxMarks = 'Valid max marks is required'
    if (!formData.passingMarks || Number(formData.passingMarks) <= 0) newErrors.passingMarks = 'Valid passing marks is required'
    if (Number(formData.passingMarks) > Number(formData.maxMarks)) {
      newErrors.passingMarks = 'Passing marks cannot exceed max marks'
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
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.message || 'Failed to create exam')
      }

      toast.success('Exam created successfully')
      router.push('/admin/exams')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create exam'
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create Exam</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Set up a new examination</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Exam Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="Exam Name *"
                placeholder="Enter exam name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={errors.name}
              />
              <Select
                label="Exam Type *"
                options={typeOptions}
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                error={errors.type}
              />
              <Select
                label="Academic Year"
                options={academicYearOptions}
                value={formData.academicYear}
                onChange={(e) => handleChange('academicYear', e.target.value)}
              />
              <Input
                label="Start Date *"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                error={errors.startDate}
              />
              <Input
                label="End Date *"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                error={errors.endDate}
              />
              <Input
                label="Max Marks *"
                type="number"
                min="1"
                placeholder="Enter maximum marks"
                value={formData.maxMarks}
                onChange={(e) => handleChange('maxMarks', e.target.value)}
                error={errors.maxMarks}
              />
              <Input
                label="Passing Marks *"
                type="number"
                min="1"
                placeholder="Enter passing marks"
                value={formData.passingMarks}
                onChange={(e) => handleChange('passingMarks', e.target.value)}
                error={errors.passingMarks}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Classes & Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Classes *</p>
                <div className="flex gap-2 mb-2">
                  <Select
                    options={classOptions}
                    value={classInput}
                    onChange={(e) => setClassInput(e.target.value)}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addClass}>
                    Add
                  </Button>
                </div>
                {errors.classes && (
                  <p className="text-sm text-red-500 dark:text-red-400 mb-2">{errors.classes}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {formData.classes.map((cls) => (
                    <span
                      key={cls}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      Class {cls}
                      <button type="button" onClick={() => removeClass(cls)}>
                        <XCircle className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subjects *</p>
                <div className="flex gap-2 mb-2">
                  <Select
                    options={subjectOptions}
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addSubject}>
                    Add
                  </Button>
                </div>
                {errors.subjects && (
                  <p className="text-sm text-red-500 dark:text-red-400 mb-2">{errors.subjects}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {formData.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {subject}
                      <button type="button" onClick={() => removeSubject(subject)}>
                        <XCircle className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Exam'}
          </Button>
        </div>
      </form>
    </div>
  )
}
