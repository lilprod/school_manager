import { api } from '../lib/api'
import type { Assessment, AssessmentType, Grade, ReportCard } from '../types'

export interface CreateAssessmentPayload {
  title: string
  type: AssessmentType
  subjectId: string
  classGroupId: string
  academicYearId: string
  maxScore?: number
  date: string
}

export async function fetchAssessments(params: {
  classGroupId?: string
  subjectId?: string
  academicYearId?: string
}): Promise<Assessment[]> {
  const { data } = await api.get<Assessment[]>('/assessments', { params })
  return data
}

export async function createAssessment(payload: CreateAssessmentPayload): Promise<Assessment> {
  const { data } = await api.post<Assessment>('/assessments', payload)
  return data
}

export async function enterGrades(
  assessmentId: string,
  entries: { studentId: string; score: number; comment?: string }[],
) {
  const { data } = await api.post(`/assessments/${assessmentId}/grades`, { entries })
  return data
}

export async function fetchAssessmentGrades(assessmentId: string) {
  const { data } = await api.get(`/assessments/${assessmentId}/grades`)
  return data
}

export async function fetchStudentGrades(studentId: string, academicYearId?: string): Promise<Grade[]> {
  const { data } = await api.get<Grade[]>(`/grades/student/${studentId}`, { params: { academicYearId } })
  return data
}

export async function fetchReportCard(studentId: string, academicYearId: string): Promise<ReportCard> {
  const { data } = await api.get<ReportCard>(`/grades/student/${studentId}/report-card`, {
    params: { academicYearId },
  })
  return data
}
