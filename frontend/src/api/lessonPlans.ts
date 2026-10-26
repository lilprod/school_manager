import { api } from '../lib/api'
import type { LessonPlan } from '../types'

export interface CreateLessonPlanPayload {
  subjectId: string
  classGroupId: string
  date: string
  title: string
  objectives?: string
  content?: string
}

export type UpdateLessonPlanPayload = Partial<CreateLessonPlanPayload>

export async function fetchLessonPlans(params: {
  classGroupId?: string
  subjectId?: string
  teacherId?: string
}): Promise<LessonPlan[]> {
  const { data } = await api.get<LessonPlan[]>('/lesson-plans', { params })
  return data
}

export async function createLessonPlan(payload: CreateLessonPlanPayload): Promise<LessonPlan> {
  const { data } = await api.post<LessonPlan>('/lesson-plans', payload)
  return data
}

export async function updateLessonPlan(id: string, payload: UpdateLessonPlanPayload): Promise<LessonPlan> {
  const { data } = await api.patch<LessonPlan>(`/lesson-plans/${id}`, payload)
  return data
}

export async function deleteLessonPlan(id: string): Promise<void> {
  await api.delete(`/lesson-plans/${id}`)
}
