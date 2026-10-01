import { api } from '../lib/api'
import type { TeacherProfile } from '../types'

export interface CreateTeacherPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  employeeNumber: string
  qualifications?: string
}

export async function fetchTeachers(): Promise<TeacherProfile[]> {
  const { data } = await api.get<TeacherProfile[]>('/teachers')
  return data
}

export async function createTeacher(payload: CreateTeacherPayload): Promise<TeacherProfile> {
  const { data } = await api.post<TeacherProfile>('/teachers', payload)
  return data
}

export async function assignTeacher(
  teacherId: string,
  payload: { classGroupId: string; subjectId: string; academicYearId: string },
): Promise<TeacherProfile> {
  const { data } = await api.post<TeacherProfile>(`/teachers/${teacherId}/assignments`, payload)
  return data
}
