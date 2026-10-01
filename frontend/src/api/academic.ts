import { api } from '../lib/api'
import type { AcademicYear, ClassGroup, School, Subject } from '../types'

export async function fetchMySchool(): Promise<School> {
  const { data } = await api.get<School>('/schools/me')
  return data
}

export async function fetchAcademicYears(): Promise<AcademicYear[]> {
  const { data } = await api.get<AcademicYear[]>('/academic-years')
  return data
}

export async function fetchClassGroups(): Promise<ClassGroup[]> {
  const { data } = await api.get<ClassGroup[]>('/class-groups')
  return data
}

export async function fetchSubjects(): Promise<Subject[]> {
  const { data } = await api.get<Subject[]>('/subjects')
  return data
}

export async function createClassGroup(payload: { name: string; level: string }): Promise<ClassGroup> {
  const { data } = await api.post<ClassGroup>('/class-groups', payload)
  return data
}

export async function createSubject(payload: { name: string; code: string }): Promise<Subject> {
  const { data } = await api.post<Subject>('/subjects', payload)
  return data
}
