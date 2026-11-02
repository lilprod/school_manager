import { api } from '../lib/api'
import type { Term } from '../types'

export interface CreateTermPayload {
  academicYearId: string
  name: string
  startDate: string
  endDate: string
}

export async function fetchTerms(academicYearId?: string): Promise<Term[]> {
  const { data } = await api.get<Term[]>('/terms', { params: { academicYearId } })
  return data
}

export async function createTerm(payload: CreateTermPayload): Promise<Term> {
  const { data } = await api.post<Term>('/terms', payload)
  return data
}

export async function deleteTerm(id: string): Promise<void> {
  await api.delete(`/terms/${id}`)
}
