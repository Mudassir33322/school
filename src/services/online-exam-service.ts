import { dbInsert, dbGetAll, dbGetById, dbUpdate, dbDelete, dbQuery } from '@/lib/db'
import { generateId } from '@/lib/utils'

export interface OnlineExam {
  id: string
  title: string
  description: string
  subjectId: string
  classId: string
  totalMarks: number
  duration: number
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  passingMarks: number
  shuffleQuestions: boolean
  showResults: boolean
  status: string
  createdBy: string
  createdAt: string
}

export interface ExamQuestion {
  id: string
  examId: string
  question: string
  questionType: string
  options: string[]
  correctAnswer: string
  marks: number
  orderIndex: number
}

export interface ExamSubmission {
  id: string
  examId: string
  studentId: string
  studentName: string
  answers: Record<string, string>
  totalMarks: number
  obtainedMarks: number
  grade: string
  timeTaken: number
  status: string
  submittedAt: string
}

export async function createExam(data: Omit<OnlineExam, 'id' | 'createdAt'>): Promise<boolean> {
  return dbInsert('online_exams', {
    id: generateId(),
    ...data,
    createdAt: new Date().toISOString(),
  })
}

export async function getExams(filters?: {
  classId?: string
  status?: string
}): Promise<OnlineExam[]> {
  try {
    let exams = await dbGetAll<OnlineExam>('online_exams')
    if (filters) {
      if (filters.classId) exams = exams.filter(e => e.classId === filters.classId)
      if (filters.status) exams = exams.filter(e => e.status === filters.status)
    }
    return exams.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch {
    return []
  }
}

export async function getExamById(id: string): Promise<OnlineExam | null> {
  try {
    const exam = await dbGetById<OnlineExam>('online_exams', id)
    if (!exam) return null
    const questions = await dbQuery<ExamQuestion>('online_exam_questions', { examId: id })
    return { ...exam, questions } as unknown as OnlineExam
  } catch {
    return null
  }
}

export async function updateExam(id: string, updates: Partial<OnlineExam>): Promise<boolean> {
  try {
    return dbUpdate('online_exams', id, updates)
  } catch {
    return false
  }
}

export async function deleteExam(id: string): Promise<boolean> {
  try {
    const questions = await dbQuery<ExamQuestion>('online_exam_questions', { examId: id })
    const submissions = await dbQuery<ExamSubmission>('online_exam_submissions', { examId: id })
    for (const q of questions) {
      await dbDelete('online_exam_questions', q.id)
    }
    for (const s of submissions) {
      await dbDelete('online_exam_submissions', s.id)
    }
    return dbDelete('online_exams', id)
  } catch {
    return false
  }
}

export async function addQuestion(examId: string, questionData: Omit<ExamQuestion, 'id' | 'examId'>): Promise<boolean> {
  return dbInsert('online_exam_questions', {
    id: generateId(),
    examId,
    ...questionData,
  })
}

export async function getQuestions(examId: string): Promise<ExamQuestion[]> {
  try {
    const questions = await dbQuery<ExamQuestion>('online_exam_questions', { examId })
    return questions.sort((a, b) => a.orderIndex - b.orderIndex)
  } catch {
    return []
  }
}

export async function submitExam(
  examId: string,
  studentId: string,
  answers: Record<string, string>,
  timeTaken: number
): Promise<boolean> {
  try {
    const exam = await dbGetById<OnlineExam>('online_exams', examId)
    if (!exam) return false

    const questions = await getQuestions(examId)
    let obtainedMarks = 0
    let totalMarks = 0

    for (const q of questions) {
      totalMarks += q.marks
      if (answers[q.id] === q.correctAnswer) {
        obtainedMarks += q.marks
      }
    }

    const users = await dbGetAll<Record<string, unknown>>('users')
    const student = users.find(u => u.id === studentId) as Record<string, unknown> | undefined

    let grade = ''
    if (exam.totalMarks > 0) {
      const pct = (obtainedMarks / totalMarks) * 100
      if (pct >= 90) grade = 'A+'
      else if (pct >= 80) grade = 'A'
      else if (pct >= 70) grade = 'B+'
      else if (pct >= 60) grade = 'B'
      else if (pct >= 50) grade = 'C'
      else if (pct >= 33) grade = 'D'
      else grade = 'F'
    }

    const existing = await dbQuery<ExamSubmission>('online_exam_submissions', { examId, studentId })
    if (existing.length > 0) return false

    return dbInsert('online_exam_submissions', {
      id: generateId(),
      examId,
      studentId,
      studentName: student ? String(student.name || '') : '',
      answers,
      totalMarks,
      obtainedMarks,
      grade,
      timeTaken,
      status: 'Submitted',
      submittedAt: new Date().toISOString(),
    })
  } catch {
    return false
  }
}

export async function getResults(examId: string): Promise<ExamSubmission[]> {
  try {
    const results = await dbQuery<ExamSubmission>('online_exam_submissions', { examId })
    return results.sort((a, b) => b.obtainedMarks - a.obtainedMarks)
  } catch {
    return []
  }
}
