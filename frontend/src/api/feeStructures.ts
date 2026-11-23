import { api } from '../lib/api'
import type { FeeStructure } from '../types'

export interface CreateFeeStructurePayload {
  academicYearId: string
  classGroupId?: string
  name: string
  amount: number
  currency?: string
}

export type UpdateFeeStructurePayload = Partial<CreateFeeStructurePayload>

export interface FeeStructureFilters {
  academicYearId?: string
  classGroupId?: string
}

export async function fetchFeeStructures(filters?: FeeStructureFilters): Promise<FeeStructure[]> {
  const { data } = await api.get<FeeStructure[]>('/fee-structures', { params: filters })
  return data
}

export async function fetchFeeStructure(id: string): Promise<FeeStructure> {
  const { data } = await api.get<FeeStructure>(`/fee-structures/${id}`)
  return data
}

export async function createFeeStructure(payload: CreateFeeStructurePayload): Promise<FeeStructure> {
  const { data } = await api.post<FeeStructure>('/fee-structures', payload)
  return data
}

export async function updateFeeStructure(id: string, payload: UpdateFeeStructurePayload): Promise<FeeStructure> {
  const { data } = await api.patch<FeeStructure>(`/fee-structures/${id}`, payload)
  return data
}

export async function deleteFeeStructure(id: string): Promise<FeeStructure> {
  const { data } = await api.delete<FeeStructure>(`/fee-structures/${id}`)
  return data
}
