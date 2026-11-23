import { api } from '../lib/api'
import type { Contact, StudentTeacher } from '../types'

export async function fetchContacts(params?: { q?: string; role?: string }): Promise<Contact[]> {
  const { data } = await api.get<Contact[]>('/contacts', { params })
  return data
}

export async function fetchTeachersOfStudent(studentId: string): Promise<StudentTeacher[]> {
  const { data } = await api.get<StudentTeacher[]>(`/contacts/student/${studentId}/teachers`)
  return data
}
