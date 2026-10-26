import { api } from '../lib/api'
import type { Contract, ContractType, Evaluation, TeacherProfile } from '../types'

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

export async function uploadTeacherPhoto(id: string, file: File): Promise<TeacherProfile> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<TeacherProfile>(`/teachers/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export interface CreateContractPayload {
  contractType: ContractType
  salaryAmount: number
  currency?: string
  startDate: string
  endDate?: string
}

export async function fetchContracts(teacherId: string): Promise<Contract[]> {
  const { data } = await api.get<Contract[]>(`/teachers/${teacherId}/contracts`)
  return data
}

export async function createContract(teacherId: string, payload: CreateContractPayload): Promise<Contract> {
  const { data } = await api.post<Contract>(`/teachers/${teacherId}/contracts`, payload)
  return data
}

export async function deleteContract(teacherId: string, id: string): Promise<void> {
  await api.delete(`/teachers/${teacherId}/contracts/${id}`)
}

export interface CreateEvaluationPayload {
  score: number
  comments?: string
  evaluationDate?: string
}

export async function fetchEvaluations(teacherId: string): Promise<Evaluation[]> {
  const { data } = await api.get<Evaluation[]>(`/teachers/${teacherId}/evaluations`)
  return data
}

export async function createEvaluation(teacherId: string, payload: CreateEvaluationPayload): Promise<Evaluation> {
  const { data } = await api.post<Evaluation>(`/teachers/${teacherId}/evaluations`, payload)
  return data
}
