import { api } from '../lib/api'
import type { ParentTeacherMeeting } from '../types'

export interface RequestMeetingPayload {
  teacherId: string
  studentId: string
  scheduledAt: string
  notes?: string
}

export async function fetchMeetings(): Promise<ParentTeacherMeeting[]> {
  const { data } = await api.get<ParentTeacherMeeting[]>('/meetings')
  return data
}

export async function requestMeeting(payload: RequestMeetingPayload): Promise<ParentTeacherMeeting> {
  const { data } = await api.post<ParentTeacherMeeting>('/meetings', payload)
  return data
}

export async function confirmMeeting(id: string): Promise<ParentTeacherMeeting> {
  const { data } = await api.patch<ParentTeacherMeeting>(`/meetings/${id}/confirm`)
  return data
}

export async function cancelMeeting(id: string): Promise<ParentTeacherMeeting> {
  const { data } = await api.patch<ParentTeacherMeeting>(`/meetings/${id}/cancel`)
  return data
}

export async function completeMeeting(id: string): Promise<ParentTeacherMeeting> {
  const { data } = await api.patch<ParentTeacherMeeting>(`/meetings/${id}/complete`)
  return data
}
