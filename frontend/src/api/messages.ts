import { api } from '../lib/api'
import type { Message } from '../types'

export interface SendMessagePayload {
  recipientId: string
  content: string
}

export async function fetchInbox(): Promise<Message[]> {
  const { data } = await api.get<Message[]>('/messages/inbox')
  return data
}

export async function fetchSentMessages(): Promise<Message[]> {
  const { data } = await api.get<Message[]>('/messages/sent')
  return data
}

export async function fetchUnreadCount(): Promise<{ count: number }> {
  const { data } = await api.get<{ count: number }>('/messages/unread-count')
  return data
}

export async function sendMessage(payload: SendMessagePayload): Promise<Message> {
  const { data } = await api.post<Message>('/messages', payload)
  return data
}

export async function markMessageAsRead(id: string): Promise<Message> {
  const { data } = await api.patch<Message>(`/messages/${id}/read`)
  return data
}
