import { api } from '../lib/api'
import type { ExamSession, ExamSlot } from '../types'

export interface CreateExamSessionPayload {
  name: string
  academicYearId: string
  termId?: string
  startDate: string
  endDate: string
}

export interface CreateExamSlotPayload {
  classGroupId: string
  subjectId: string
  date: string
  startTime: string
  endTime: string
  roomId?: string
  supervisorId?: string
}

export async function fetchExamSessions(academicYearId?: string): Promise<ExamSession[]> {
  const { data } = await api.get<ExamSession[]>('/exam-sessions', { params: { academicYearId } })
  return data
}

export async function createExamSession(payload: CreateExamSessionPayload): Promise<ExamSession> {
  const { data } = await api.post<ExamSession>('/exam-sessions', payload)
  return data
}

export async function deleteExamSession(id: string): Promise<void> {
  await api.delete(`/exam-sessions/${id}`)
}

export async function fetchExamSlots(sessionId: string, classGroupId?: string): Promise<ExamSlot[]> {
  const { data } = await api.get<ExamSlot[]>(`/exam-sessions/${sessionId}/slots`, { params: { classGroupId } })
  return data
}

export async function createExamSlot(sessionId: string, payload: CreateExamSlotPayload): Promise<ExamSlot> {
  const { data } = await api.post<ExamSlot>(`/exam-sessions/${sessionId}/slots`, payload)
  return data
}

export async function deleteExamSlot(id: string): Promise<void> {
  await api.delete(`/exam-slots/${id}`)
}

export async function fetchStudentExams(studentId: string, sessionId?: string): Promise<ExamSlot[]> {
  const { data } = await api.get<ExamSlot[]>(`/students/${studentId}/exams`, { params: { sessionId } })
  return data
}
