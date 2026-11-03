'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, School, Users, BookOpen } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Modal from '@/components/ui/modal'
import { Loading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import { showToast } from '@/components/ui/toast'

interface Section {
  id: string
  name: string
  roomNo: string
  classTeacher: string
}

interface ClassData {
  id: string
  name: string
  numericValue: number
  sections: Section[]
  studentsCount: number
  subjectsCount: number
}

interface ClassFormData {
  name: string
  numericValue: string
}

interface SectionFormData {
  name: string
  roomNo: string
  classTeacher: string
}

const initialClasses: ClassData[] = [
  { id: '1', name: 'Class 1', numericValue: 1, sections: [{ id: 's1', name: 'A', roomNo: '101', classTeacher: 'Mr. Sharma' }], studentsCount: 35, subjectsCount: 6 },
  { id: '2', name: 'Class 2', numericValue: 2, sections: [{ id: 's2', name: 'A', roomNo: '102', classTeacher: 'Ms. Verma' }, { id: 's3', name: 'B', roomNo: '103', classTeacher: 'Mr. Singh' }], studentsCount: 68, subjectsCount: 6 },
  { id: '3', name: 'Class 10', numericValue: 10, sections: [{ id: 's4', name: 'A', roomNo: '201', classTeacher: 'Mr. Gupta' }], studentsCount: 42, subjectsCount: 8 },
]

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>(initialClasses)
  const [loading, setLoading] = useState(false)
  const [expandedClass, setExpandedClass] = useState<string | null>(null)
  const [classModal, setClassModal] = useState(false)
  const [sectionModal, setSectionModal] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassData | null>(null)
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [classForm, setClassForm] = useState<ClassFormData>({ name: '', numericValue: '' })
  const [sectionForm, setSectionForm] = useState<SectionFormData>({ name: '', roomNo: '', classTeacher: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateClassForm = (): boolean => {
    const errs: Record<string, string> = {}
    if (!classForm.name.trim()) errs.name = 'Class name is required'
    if (!classForm.numericValue.trim() || isNaN(Number(classForm.numericValue))) errs.numericValue = 'Valid numeric value is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateSectionForm = (): boolean => {
    const errs: Record<string, string> = {}
    if (!sectionForm.name.trim()) errs.name = 'Section name is required'
    if (!sectionForm.roomNo.trim()) errs.roomNo = 'Room number is required'
    if (!sectionForm.classTeacher.trim()) errs.classTeacher = 'Class teacher is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleAddClass = () => {
    setEditingClass(null)
    setClassForm({ name: '', numericValue: '' })
    setErrors({})
    setClassModal(true)
  }

  const handleEditClass = (cls: ClassData) => {
    setEditingClass(cls)
    setClassForm({ name: cls.name, numericValue: String(cls.numericValue) })
    setErrors({})
    setClassModal(true)
  }

  const handleSaveClass = () => {
    if (!validateClassForm()) return
    setLoading(true)
    setTimeout(() => {
      if (editingClass) {
        setClasses(prev => prev.map(c => c.id === editingClass.id ? { ...c, name: classForm.name, numericValue: Number(classForm.numericValue) } : c))
        showToast('Class updated successfully', 'success')
      } else {
        const newClass: ClassData = {
          id: String(Date.now()),
          name: classForm.name,
          numericValue: Number(classForm.numericValue),
          sections: [],
          studentsCount: 0,
          subjectsCount: 0,
        }
        setClasses(prev => [...prev, newClass])
        showToast('Class added successfully', 'success')
      }
      setClassModal(false)
      setLoading(false)
    }, 500)
  }

  const handleDeleteClass = (id: string) => {
    setLoading(true)
    setTimeout(() => {
      setClasses(prev => prev.filter(c => c.id !== id))
      showToast('Class deleted successfully', 'success')
      setLoading(false)
    }, 300)
  }

  const handleAddSection = (classId: string) => {
    setSelectedClassId(classId)
    setSectionForm({ name: '', roomNo: '', classTeacher: '' })
    setErrors({})
    setSectionModal(true)
  }

  const handleSaveSection = () => {
    if (!validateSectionForm()) return
    setLoading(true)
    setTimeout(() => {
      const newSection: Section = {
        id: String(Date.now()),
        name: sectionForm.name,
        roomNo: sectionForm.roomNo,
        classTeacher: sectionForm.classTeacher,
      }
      setClasses(prev => prev.map(c => c.id === selectedClassId ? { ...c, sections: [...c.sections, newSection] } : c))
      showToast('Section added successfully', 'success')
      setSectionModal(false)
      setLoading(false)
    }, 500)
  }

  const toggleExpand = (id: string) => {
    setExpandedClass(prev => prev === id ? null : id)
  }

  if (loading && classes.length === 0) return <Loading text="Loading classes..." />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Class Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage classes and sections</p>
        </div>
        <Button variant="primary" onClick={handleAddClass}>
          <Plus className="mr-2 h-4 w-4" /> Add Class
        </Button>
      </div>

      {loading && <Loading text="Processing..." />}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.map(cls => (
          <Card key={cls.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <School className="h-5 w-5 text-blue-500" />
                    {cls.name}
                  </CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Numeric Value: {cls.numericValue}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEditClass(cls)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteClass(cls.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="info">{cls.sections.length} Section{cls.sections.length !== 1 ? 's' : ''}</Badge>
                <Badge variant="success">{cls.studentsCount} Students</Badge>
                <Badge variant="warning">{cls.subjectsCount} Subjects</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleAddSection(cls.id)} className="mb-2 w-full">
                <Plus className="mr-1 h-3 w-3" /> Add Section
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toggleExpand(cls.id)} className="w-full justify-between">
                {expandedClass === cls.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Sections
              </Button>
              {expandedClass === cls.id && (
                <div className="mt-2 space-y-2">
                  {cls.sections.length === 0 ? (
                    <p className="text-sm text-gray-400">No sections</p>
                  ) : (
                    cls.sections.map(sec => (
                      <div key={sec.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                        <p className="font-medium text-gray-900 dark:text-gray-100">Section {sec.name}</p>
                        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <p>Room: {sec.roomNo}</p>
                          <p>Teacher: {sec.classTeacher}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal isOpen={classModal} onClose={() => setClassModal(false)} title={editingClass ? 'Edit Class' : 'Add Class'}>
        <div className="space-y-4">
          <Input label="Class Name" placeholder="e.g., Class 10" value={classForm.name} onChange={e => setClassForm(prev => ({ ...prev, name: e.target.value }))} error={errors.name} />
          <Input label="Numeric Value" type="number" placeholder="e.g., 10" value={classForm.numericValue} onChange={e => setClassForm(prev => ({ ...prev, numericValue: e.target.value }))} error={errors.numericValue} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setClassModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveClass}>{editingClass ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={sectionModal} onClose={() => setSectionModal(false)} title="Add Section">
        <div className="space-y-4">
          <Input label="Section Name" placeholder="e.g., A" value={sectionForm.name} onChange={e => setSectionForm(prev => ({ ...prev, name: e.target.value }))} error={errors.name} />
          <Input label="Room No" placeholder="e.g., 101" value={sectionForm.roomNo} onChange={e => setSectionForm(prev => ({ ...prev, roomNo: e.target.value }))} error={errors.roomNo} />
          <Input label="Class Teacher" placeholder="Enter teacher name" value={sectionForm.classTeacher} onChange={e => setSectionForm(prev => ({ ...prev, classTeacher: e.target.value }))} error={errors.classTeacher} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setSectionModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveSection}>Add Section</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
