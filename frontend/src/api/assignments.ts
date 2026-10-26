import { api } from '../lib/api'
import type { Assignment, AssignmentSubmission } from '../types'

export interface CreateAssignmentPayload {
  title: string
  description?: string
  subjectId: string
  classGroupId: string
  academicYearId: string
  dueDate: string
  maxScore?: number
}

export interface GradeSubmissionPayload {
  grade: number
  feedback?: string
}

export async function fetchAssignments(params: {
  classGroupId?: string
  subjectId?: string
  academicYearId?: string
}): Promise<Assignment[]> {
  const { data } = await api.get<Assignment[]>('/assignments', { params })
  return data
}

export async function fetchAssignment(id: string): Promise<Assignment> {
  const { data } = await api.get<Assignment>(`/assignments/${id}`)
  return data
}

export async function createAssignment(payload: CreateAssignmentPayload): Promise<Assignment> {
  const { data } = await api.post<Assignment>('/assignments', payload)
  return data
}

export async function deleteAssignment(id: string): Promise<void> {
  await api.delete(`/assignments/${id}`)
}

export async function fetchAssignmentSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
  const { data } = await api.get<AssignmentSubmission[]>(`/assignments/${assignmentId}/submissions`)
  return data
}

export async function gradeSubmission(
  assignmentId: string,
  submissionId: string,
  payload: GradeSubmissionPayload,
): Promise<AssignmentSubmission> {
  const { data } = await api.patch<AssignmentSubmission>(
    `/assignments/${assignmentId}/submissions/${submissionId}/grade`,
    payload,
  )
  return data
}

export async function submitAssignment(assignmentId: string, content?: string): Promise<AssignmentSubmission> {
  const { data } = await api.post<AssignmentSubmission>(`/assignments/${assignmentId}/submit`, { content })
  return data
}

export async function fetchMySubmission(assignmentId: string): Promise<AssignmentSubmission | null> {
  const { data } = await api.get<AssignmentSubmission | null>(`/assignments/${assignmentId}/submissions/me`)
  return data
}

export interface UpdateAssignmentPayload {
  title?: string
  description?: string
  dueDate?: string
  maxScore?: number
}

export async function updateAssignment(id: string, payload: UpdateAssignmentPayload): Promise<Assignment> {
  const { data } = await api.patch<Assignment>(`/assignments/${id}`, payload)
  return data
}
