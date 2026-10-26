import { api } from '../lib/api'
import type { Announcement, AnnouncementAudience } from '../types'

export interface CreateAnnouncementPayload {
  title: string
  content: string
  audience?: AnnouncementAudience
  classGroupId?: string
}

export async function fetchAnnouncements(schoolId?: string): Promise<Announcement[]> {
  const { data } = await api.get<Announcement[]>('/announcements', { params: schoolId ? { schoolId } : undefined })
  return data
}

export async function createAnnouncement(payload: CreateAnnouncementPayload): Promise<Announcement> {
  const { data } = await api.post<Announcement>('/announcements', payload)
  return data
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await api.delete(`/announcements/${id}`)
}
