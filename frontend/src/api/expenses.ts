import { api } from '../lib/api'
import type { Expense } from '../types'

export interface CreateExpensePayload {
  category: string
  amount: number
  currency?: string
  description?: string
  date?: string
}

export type UpdateExpensePayload = Partial<CreateExpensePayload>

export interface ExpenseFilters {
  category?: string
  from?: string
  to?: string
}

export async function fetchExpenses(filters?: ExpenseFilters): Promise<Expense[]> {
  const { data } = await api.get<Expense[]>('/expenses', { params: filters })
  return data
}

export async function fetchExpense(id: string): Promise<Expense> {
  const { data } = await api.get<Expense>(`/expenses/${id}`)
  return data
}

export async function createExpense(payload: CreateExpensePayload): Promise<Expense> {
  const { data } = await api.post<Expense>('/expenses', payload)
  return data
}

export async function updateExpense(id: string, payload: UpdateExpensePayload): Promise<Expense> {
  const { data } = await api.patch<Expense>(`/expenses/${id}`, payload)
  return data
}

export async function deleteExpense(id: string): Promise<Expense> {
  const { data } = await api.delete<Expense>(`/expenses/${id}`)
  return data
}
