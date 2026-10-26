import { api } from '../lib/api'
import type { ClassCoefficientRow } from '../types'

export async function fetchClassCoefficients(classGroupId: string): Promise<ClassCoefficientRow[]> {
  const { data } = await api.get<ClassCoefficientRow[]>('/class-coefficients', { params: { classGroupId } })
  return data
}

export async function setClassCoefficient(payload: {
  classGroupId: string
  subjectId: string
  coefficient: number
}): Promise<void> {
  await api.put('/class-coefficients', payload)
}

export async function resetClassCoefficient(id: string): Promise<void> {
  await api.delete(`/class-coefficients/${id}`)
}
