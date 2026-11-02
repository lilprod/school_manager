import { api } from '../lib/api'
import type { AttendanceStatus, AttendanceSummaryEntry, StaffAttendanceRecord } from '../types'

export interface MarkStaffAttendancePayload {
  teacherId: string
  date: string
  status: AttendanceStatus
  note?: string
}

export async function fetchStaffAttendance(filters: {
  teacherId?: string
  date?: string
  from?: string
  to?: string
}): Promise<StaffAttendanceRecord[]> {
  const { data } = await api.get<StaffAttendanceRecord[]>('/staff-attendance', { params: filters })
  return data
}

export async function markStaffAttendance(payload: MarkStaffAttendancePayload): Promise<StaffAttendanceRecord> {
  const { data } = await api.post<StaffAttendanceRecord>('/staff-attendance', payload)
  return data
}

export async function fetchStaffAttendanceSummary(teacherId: string): Promise<AttendanceSummaryEntry[]> {
  const { data } = await api.get<AttendanceSummaryEntry[]>(`/staff-attendance/teacher/${teacherId}/summary`)
  return data
}
