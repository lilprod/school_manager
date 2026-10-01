import { api } from '../lib/api'
import type { StudentProfile } from '../types'

export interface CreateStudentPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  studentNumber: string
  dateOfBirth?: string
  gender?: string
  classGroupId: string
  academicYearId: string
}

export async function fetchStudents(classGroupId?: string): Promise<StudentProfile[]> {
  const { data } = await api.get<StudentProfile[]>('/students', { params: { classGroupId } })
  return data
}

export async function fetchStudent(id: string): Promise<StudentProfile> {
  const { data } = await api.get<StudentProfile>(`/students/${id}`)
  return data
}

export async function createStudent(payload: CreateStudentPayload): Promise<StudentProfile> {
  const { data } = await api.post<StudentProfile>('/students', payload)
  return data
}

export async function fetchMyStudentProfile(): Promise<StudentProfile> {
  const { data } = await api.get<StudentProfile>('/students/me/profile')
  return data
}

export async function fetchMyChildren(): Promise<StudentProfile[]> {
  const { data } = await api.get<StudentProfile[]>('/students/my-children')
  return data
}
