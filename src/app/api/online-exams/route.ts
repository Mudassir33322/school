import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth';
import {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  addQuestion,
} from '@/services/online-exam-service'

export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const id = searchParams.get('id')
    const classId = searchParams.get('classId')
    const status = searchParams.get('status')

    if (id) {
      const exam = await getExamById(id)
      if (!exam) {
        return NextResponse.json(
          { success: false, message: 'Exam not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ success: true, data: exam })
    }

    const exams = await getExams(
      classId || status
        ? { classId: classId || undefined, status: status || undefined }
        : undefined
    )
    return NextResponse.json({ success: true, data: exams })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const POST = withAuth(async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    if (type === 'question') {
      const { examId, question, questionType, options, correctAnswer, marks, orderIndex } = body
      if (!examId || !question) {
        return NextResponse.json(
          { success: false, message: 'examId and question are required' },
          { status: 400 }
        )
      }
      const ok = await addQuestion(examId, {
        question,
        questionType: questionType || 'MCQ',
        options: options || [],
        correctAnswer: correctAnswer || '',
        marks: marks || 1,
        orderIndex: orderIndex || 0,
      })
      if (!ok) {
        return NextResponse.json(
          { success: false, message: 'Failed to add question' },
          { status: 500 }
        )
      }
      return NextResponse.json({ success: true }, { status: 201 })
    }

    const { title, description, subjectId, classId, totalMarks, duration, startDate, endDate, startTime, endTime, passingMarks, shuffleQuestions, showResults, createdBy } = body
    if (!title || !classId || !startDate || !endDate || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, message: 'title, classId, startDate, endDate, startTime, and endTime are required' },
        { status: 400 }
      )
    }

    const ok = await createExam({
      title,
      description: description || '',
      subjectId: subjectId || '',
      classId,
      totalMarks: totalMarks || 100,
      duration: duration || 60,
      startDate,
      endDate,
      startTime,
      endTime,
      passingMarks: passingMarks || 33,
      shuffleQuestions: shuffleQuestions || false,
      showResults: showResults !== false,
      status: 'Draft',
      createdBy: createdBy || '',
    })
    if (!ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to create exam' },
        { status: 500 }
      )
    }
    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const PUT = withAuth(async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json()
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'id is required' },
        { status: 400 }
      )
    }

    const ok = await updateExam(id, updates)
    if (!ok) {
      return NextResponse.json(
        { success: false, message: 'Exam not found or update failed' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: { id, ...updates } })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const DELETE = withAuth(async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'id is required' },
        { status: 400 }
      )
    }

    const ok = await deleteExam(id)
    if (!ok) {
      return NextResponse.json(
        { success: false, message: 'Exam not found or delete failed' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: { id } })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
})
