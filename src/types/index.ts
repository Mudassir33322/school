export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  active: boolean;
  createdAt: string;
}

export interface Student {
  id: string;
  admissionNo: string;
  rollNo: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  bloodGroup: string;
  religion: string;
  caste: string;
  nationality: string;
  photo: string;
  classId: string;
  sectionId: string;
  parentId: string;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  guardianEmail: string;
  emergencyContact: string;
  emergencyPhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  status: 'Active' | 'Inactive';
  academicYear: string;
  createdAt: string;
}

export interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  photo: string;
  email: string;
  phone: string;
  address: string;
  qualification: string;
  experience: number;
  joiningDate: string;
  subjects: string[];
  classIds: string[];
  designation: string;
  department: string;
  salary: number;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface Staff {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  photo: string;
  email: string;
  phone: string;
  address: string;
  designation: string;
  department: string;
  salary: number;
  joiningDate: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface Parent {
  id: string;
  fatherName: string;
  motherName: string;
  email: string;
  phone: string;
  alternatePhone: string;
  address: string;
  occupation: string;
  children: string[];
  createdAt: string;
}

export interface Class {
  id: string;
  name: string;
  numeric: number;
  sections: string[];
  teacherIds: string[];
  createdAt: string;
}

export interface Section {
  id: string;
  name: string;
  classId: string;
  roomNo: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  classIds: string[];
  teacherId: string;
  type: 'Theory' | 'Practical' | 'Both';
  maxMarks: number;
  passingMarks: number;
  createdAt: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  sectionId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Holiday';
  remarks: string;
  markedBy: string;
  createdAt: string;
}

export interface Fee {
  id: string;
  studentId: string;
  admissionNo: string;
  category: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  paidDate: string;
  status: 'Paid' | 'Unpaid' | 'Partial' | 'Overdue';
  paymentMode: string;
  receiptNo: string;
  fine: number;
  remarks: string;
  academicYear: string;
  createdAt: string;
}

export interface Exam {
  id: string;
  name: string;
  type: 'Mid-Term' | 'Final' | 'Unit Test' | 'Practical';
  classIds: string[];
  subjectIds: string[];
  startDate: string;
  endDate: string;
  maxMarks: number;
  passingMarks: number;
  academicYear: string;
  createdAt: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  subjectId: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  remarks: string;
  createdAt: string;
}

export interface Homework {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  sectionId: string;
  teacherId: string;
  dueDate: string;
  attachments: string;
  status: 'Active' | 'Completed';
  createdAt: string;
}

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  submission: string;
  remarks: string;
  marks: number;
  status: 'Submitted' | 'Pending' | 'Graded';
  submittedAt: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'Notice' | 'Announcement' | 'Holiday' | 'Event';
  targetAudience: UserRole[];
  createdBy: string;
  createdAt: string;
}

export interface Timetable {
  id: string;
  classId: string;
  sectionId: string;
  day: string;
  period: number;
  subjectId: string;
  teacherId: string;
  roomNo: string;
  startTime: string;
  endTime: string;
}

export interface Payroll {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeType: 'teacher' | 'staff';
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'Paid' | 'Pending' | 'Cancelled';
  paidDate: string;
  createdAt: string;
}

export interface Certificate {
  id: string;
  type: 'Bonafide' | 'Character' | 'Leaving' | 'Fee' | 'Custom';
  studentId: string;
  studentName: string;
  admissionNo: string;
  class: string;
  issueDate: string;
  content: string;
  generatedBy: string;
}

export interface SchoolSettings {
  schoolName: string;
  schoolAddress: string;
  schoolCity: string;
  schoolState: string;
  schoolPincode: string;
  schoolPhone: string;
  schoolEmail: string;
  schoolWebsite: string;
  schoolLogo: string;
  academicYear: string;
  gradingSystem: 'Grade' | 'GPA' | 'Both';
  sessionStartMonth: number;
}
