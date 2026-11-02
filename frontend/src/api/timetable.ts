import { api } from '../lib/api'
import type { TimetableSlot } from '../types'

export interface TimetableFilters {
  classGroupId?: string
  teacherId?: string
  academicYearId?: string
}

export interface CreateTimetableSlotPayload {
  classGroupId: string
  subjectId: string
  teacherId: string
  roomId?: string
  academicYearId: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

export async function fetchTimetable(filters: TimetableFilters): Promise<TimetableSlot[]> {
  const { data } = await api.get<TimetableSlot[]>('/timetable', { params: filters })
  return data
}

export async function createTimetableSlot(payload: CreateTimetableSlotPayload): Promise<TimetableSlot> {
  const { data } = await api.post<TimetableSlot>('/timetable', payload)
  return data
}

export async function deleteTimetableSlot(id: string): Promise<void> {
  await api.delete(`/timetable/${id}`)
}
