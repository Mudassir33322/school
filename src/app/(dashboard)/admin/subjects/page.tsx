'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Modal from '@/components/ui/modal'
import Table from '@/components/ui/table'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import { showToast } from '@/components/ui/toast'

interface Subject {
  id: string
  name: string
  code: string
  type: 'Theory' | 'Practical' | 'Both'
  assignedClasses: string[]
  assignedTeacher: string
  maxMarks: number
  passingMarks: number
}

interface SubjectFormData {
  name: string
  code: string
  type: 'Theory' | 'Practical' | 'Both'
  assignedClasses: string
  assignedTeacher: string
  maxMarks: string
  passingMarks: string
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
]

const typeOptions = [
  { value: 'Theory', label: 'Theory' },
  { value: 'Practical', label: 'Practical' },
  { value: 'Both', label: 'Both' },
]

const initialSubjects: Subject[] = [
  { id: '1', name: 'Mathematics', code: 'MTH101', type: 'Both', assignedClasses: ['Class 10', 'Class 9'], assignedTeacher: 'Mr. Gupta', maxMarks: 100, passingMarks: 33 },
  { id: '2', name: 'Science', code: 'SCI101', type: 'Both', assignedClasses: ['Class 10'], assignedTeacher: 'Ms. Sharma', maxMarks: 100, passingMarks: 33 },
  { id: '3', name: 'English', code: 'ENG101', type: 'Theory', assignedClasses: ['Class 10', 'Class 9', 'Class 8'], assignedTeacher: 'Mr. Singh', maxMarks: 80, passingMarks: 26 },
  { id: '4', name: 'Computer Science', code: 'CS101', type: 'Both', assignedClasses: ['Class 10'], assignedTeacher: 'Ms. Verma', maxMarks: 100, passingMarks: 33 },
]

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [filterClass, setFilterClass] = useState('')
  const [form, setForm] = useState<SubjectFormData>({
    name: '', code: '', type: 'Theory', assignedClasses: '', assignedTeacher: '', maxMarks: '', passingMarks: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filteredSubjects = filterClass
    ? subjects.filter(s => s.assignedClasses.some(c => c.includes(filterClass)))
    : subjects

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Subject name is required'
    if (!form.code.trim()) errs.code = 'Subject code is required'
    if (!form.assignedClasses.trim()) errs.assignedClasses = 'At least one class is required'
    if (!form.assignedTeacher.trim()) errs.assignedTeacher = 'Teacher is required'
    if (!form.maxMarks.trim() || isNaN(Number(form.maxMarks))) errs.maxMarks = 'Valid max marks required'
    if (!form.passingMarks.trim() || isNaN(Number(form.passingMarks))) errs.passingMarks = 'Valid passing marks required'
    if (Number(form.passingMarks) > Number(form.maxMarks)) errs.passingMarks = 'Passing marks cannot exceed max marks'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleAdd = () => {
    setEditingSubject(null)
    setForm({ name: '', code: '', type: 'Theory', assignedClasses: '', assignedTeacher: '', maxMarks: '', passingMarks: '' })
    setErrors({})
    setModalOpen(true)
  }

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject)
    setForm({
      name: subject.name,
      code: subject.code,
      type: subject.type,
      assignedClasses: subject.assignedClasses.join(', '),
      assignedTeacher: subject.assignedTeacher,
      maxMarks: String(subject.maxMarks),
      passingMarks: String(subject.passingMarks),
    })
    setErrors({})
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!validateForm()) return
    setLoading(true)
    setTimeout(() => {
      const classes = form.assignedClasses.split(',').map(c => c.trim()).filter(Boolean)
      if (editingSubject) {
        setSubjects(prev => prev.map(s => s.id === editingSubject.id ? {
          ...s,
          name: form.name,
          code: form.code,
          type: form.type,
          assignedClasses: classes,
          assignedTeacher: form.assignedTeacher,
          maxMarks: Number(form.maxMarks),
          passingMarks: Number(form.passingMarks),
        } : s))
        showToast('Subject updated successfully', 'success')
      } else {
        const newSubject: Subject = {
          id: String(Date.now()),
          name: form.name,
          code: form.code,
          type: form.type,
          assignedClasses: classes,
          assignedTeacher: form.assignedTeacher,
          maxMarks: Number(form.maxMarks),
          passingMarks: Number(form.passingMarks),
        }
        setSubjects(prev => [...prev, newSubject])
        showToast('Subject added successfully', 'success')
      }
      setModalOpen(false)
      setLoading(false)
    }, 500)
  }

  const handleDelete = (id: string) => {
    setLoading(true)
    setTimeout(() => {
      setSubjects(prev => prev.filter(s => s.id !== id))
      showToast('Subject deleted successfully', 'success')
      setLoading(false)
    }, 300)
  }

  const columns = [
    { key: 'name', label: 'Subject Name' },
    { key: 'code', label: 'Code' },
    {
      key: 'type', label: 'Type',
      render: (_: unknown, row: Subject) => {
        const variant = row.type === 'Theory' ? 'info' as const : row.type === 'Practical' ? 'warning' as const : 'success' as const
        return <Badge variant={variant}>{row.type}</Badge>
      },
    },
    { key: 'assignedClasses', label: 'Assigned Classes', render: (_: unknown, row: Subject) => row.assignedClasses.join(', ') },
    { key: 'assignedTeacher', label: 'Assigned Teacher' },
    { key: 'maxMarks', label: 'Max Marks' },
    { key: 'passingMarks', label: 'Passing Marks' },
  ]

  if (loading && subjects.length === 0) return <Loading text="Loading subjects..." />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Subject Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage subjects, types, and assignments</p>
        </div>
        <Button variant="primary" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Subject
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter by Class</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            options={classOptions}
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            label="Class"
          />
        </CardContent>
      </Card>

      {loading && <Loading text="Processing..." />}

      <Table<Subject>
        columns={columns}
        data={filteredSubjects}
        loading={false}
        actions={(row: Subject) => (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        )}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingSubject ? 'Edit Subject' : 'Add Subject'} size="lg">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Subject Name" placeholder="e.g., Mathematics" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} error={errors.name} />
            <Input label="Subject Code" placeholder="e.g., MTH101" value={form.code} onChange={e => setForm(prev => ({ ...prev, code: e.target.value }))} error={errors.code} />
          </div>
          <Select label="Type" options={typeOptions} value={form.type} onChange={e => setForm(prev => ({ ...prev, type: e.target.value as SubjectFormData['type'] }))} />
          <Input label="Assigned Classes (comma separated)" placeholder="e.g., Class 10, Class 9" value={form.assignedClasses} onChange={e => setForm(prev => ({ ...prev, assignedClasses: e.target.value }))} error={errors.assignedClasses} />
          <Input label="Assigned Teacher" placeholder="Enter teacher name" value={form.assignedTeacher} onChange={e => setForm(prev => ({ ...prev, assignedTeacher: e.target.value }))} error={errors.assignedTeacher} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Max Marks" type="number" placeholder="e.g., 100" value={form.maxMarks} onChange={e => setForm(prev => ({ ...prev, maxMarks: e.target.value }))} error={errors.maxMarks} />
            <Input label="Passing Marks" type="number" placeholder="e.g., 33" value={form.passingMarks} onChange={e => setForm(prev => ({ ...prev, passingMarks: e.target.value }))} error={errors.passingMarks} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>{editingSubject ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
