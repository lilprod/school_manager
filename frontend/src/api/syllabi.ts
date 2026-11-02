import { api } from '../lib/api'
import type { Syllabus } from '../types'

export interface CreateSyllabusPayload {
  subjectId: string
  classGroupId: string
  academicYearId: string
  title: string
  description?: string
}

export type UpdateSyllabusPayload = Partial<Pick<CreateSyllabusPayload, 'title' | 'description'>>

export async function fetchSyllabi(params: {
  classGroupId?: string
  subjectId?: string
  academicYearId?: string
}): Promise<Syllabus[]> {
  const { data } = await api.get<Syllabus[]>('/syllabi', { params })
  return data
}

export async function createSyllabus(payload: CreateSyllabusPayload): Promise<Syllabus> {
  const { data } = await api.post<Syllabus>('/syllabi', payload)
  return data
}

export async function updateSyllabus(id: string, payload: UpdateSyllabusPayload): Promise<Syllabus> {
  const { data } = await api.patch<Syllabus>(`/syllabi/${id}`, payload)
  return data
}

export async function deleteSyllabus(id: string): Promise<void> {
  await api.delete(`/syllabi/${id}`)
}
