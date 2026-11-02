import { api } from '../lib/api'
import type { AttendanceRecord, AttendanceStatus, AttendanceSummaryEntry } from '../types'

export interface BulkMarkPayload {
  classGroupId: string
  subjectId?: string
  date: string
  entries: { studentId: string; status: AttendanceStatus; note?: string }[]
}

export async function fetchAttendance(params: {
  classGroupId?: string
  date?: string
  studentId?: string
}): Promise<AttendanceRecord[]> {
  const { data } = await api.get<AttendanceRecord[]>('/attendance', { params })
  return data
}

export async function bulkMarkAttendance(payload: BulkMarkPayload): Promise<AttendanceRecord[]> {
  const { data } = await api.post<AttendanceRecord[]>('/attendance/bulk', payload)
  return data
}

export async function fetchStudentAttendance(studentId: string): Promise<AttendanceRecord[]> {
  const { data } = await api.get<AttendanceRecord[]>(`/attendance/student/${studentId}`)
  return data
}

export async function fetchStudentAttendanceSummary(studentId: string): Promise<AttendanceSummaryEntry[]> {
  const { data } = await api.get<AttendanceSummaryEntry[]>(`/attendance/student/${studentId}/summary`)
  return data
}
