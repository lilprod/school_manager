import { api } from '../lib/api'
import type { Room } from '../types'

export interface CreateRoomPayload {
  name: string
  capacity?: number
  type?: string
}

export type UpdateRoomPayload = Partial<CreateRoomPayload>

export async function fetchRooms(): Promise<Room[]> {
  const { data } = await api.get<Room[]>('/rooms')
  return data
}

export async function createRoom(payload: CreateRoomPayload): Promise<Room> {
  const { data } = await api.post<Room>('/rooms', payload)
  return data
}

export async function updateRoom(id: string, payload: UpdateRoomPayload): Promise<Room> {
  const { data } = await api.patch<Room>(`/rooms/${id}`, payload)
  return data
}

export async function deleteRoom(id: string): Promise<void> {
  await api.delete(`/rooms/${id}`)
}
