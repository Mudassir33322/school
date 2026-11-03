import { z } from 'zod'

export const studentSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  dob: z.string().optional(),
  bloodGroup: z.string().optional(),
  religion: z.string().optional(),
  caste: z.string().optional(),
  nationality: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  parentId: z.string().optional(),
  guardianName: z.string().optional(),
  guardianRelation: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: z.string().email().optional().or(z.literal('')),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).default('Active'),
  academicYear: z.string().optional(),
})

export const teacherSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  dob: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.number().min(0).optional(),
  joiningDate: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  classIds: z.array(z.string()).optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  salary: z.number().min(0).optional(),
  status: z.enum(['Active', 'Inactive', 'On Leave']).default('Active'),
})

export const staffSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  dob: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  salary: z.number().min(0).optional(),
  joiningDate: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).default('Active'),
})

export const feeSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  paidAmount: z.number().min(0).optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  paymentMode: z.string().optional(),
  fine: z.number().min(0).optional(),
  remarks: z.string().optional(),
  status: z.enum(['Paid', 'Unpaid', 'Partial', 'Overdue']).default('Unpaid'),
})

export const examSchema = z.object({
  name: z.string().min(1, 'Exam name is required'),
  type: z.enum(['Mid-Term', 'Final', 'Unit Test', 'Practical']).optional(),
  classIds: z.array(z.string()).optional(),
  subjectIds: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  maxMarks: z.number().min(1).default(100),
  passingMarks: z.number().min(1).default(33),
  academicYear: z.string().optional(),
})

export const homeworkSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  subjectId: z.string().optional(),
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().optional(),
  teacherId: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  attachments: z.string().optional(),
  status: z.enum(['Active', 'Completed', 'Archived']).default('Active'),
})

export const noticeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
  type: z.enum(['Notice', 'Announcement', 'Holiday', 'Event']).default('Notice'),
  targetAudience: z.array(z.string()).optional(),
  createdBy: z.string().optional(),
})

export const attendanceRecordSchema = z.object({
  studentId: z.string().min(1),
  classId: z.string().min(1),
  sectionId: z.string().min(1),
  date: z.string().min(1),
  status: z.enum(['Present', 'Absent', 'Late', 'Holiday']),
  remarks: z.string().optional(),
})

export const settingsSchema = z.object({
  schoolName: z.string().optional(),
  schoolAddress: z.string().optional(),
  schoolCity: z.string().optional(),
  schoolState: z.string().optional(),
  schoolPincode: z.string().optional(),
  schoolPhone: z.string().optional(),
  schoolEmail: z.string().email().optional().or(z.literal('')),
  schoolWebsite: z.string().url().optional().or(z.literal('')),
  schoolLogo: z.string().optional(),
  academicYear: z.string().optional(),
  gradingSystem: z.string().optional(),
  sessionStartMonth: z.number().min(1).max(12).optional(),
})

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const errors = result.error.issues.map(e => e.message).join(', ')
  return { success: false, error: errors }
}
