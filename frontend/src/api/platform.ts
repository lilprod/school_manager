import { api } from '../lib/api'
import type { BillingPeriod, Payment, Plan, SchoolSummary, Subscription, SubscriptionStatus } from '../types'

export interface SignupSchoolPayload {
  schoolName: string
  address?: string
  phone?: string
  adminEmail: string
  adminPassword: string
  adminFirstName: string
  adminLastName: string
  planCode: string
}

export interface CreateSchoolPayload {
  schoolName: string
  address?: string
  phone?: string
  adminEmail: string
  adminPassword: string
  adminFirstName: string
  adminLastName: string
  planId: string
  activateImmediately?: boolean
}

export interface ApproveSchoolPayload {
  planId: string
  subscriptionStatus?: 'ACTIVE' | 'TRIALING'
  trialEndsAt?: string
}

export interface CreatePlanPayload {
  name: string
  code: string
  priceAmount: number
  currency?: string
  billingPeriod: BillingPeriod
  maxStudents?: number
  maxTeachers?: number
  maxClasses?: number
}

export interface RecordPaymentPayload {
  amount: number
  currency?: string
  method: 'CASH' | 'MOBILE_MONEY'
  reference?: string
  notes?: string
  paidAt?: string
}

export async function fetchPublicPlans(): Promise<Plan[]> {
  const { data } = await api.get<Plan[]>('/platform/plans/public')
  return data
}

export async function signupSchool(payload: SignupSchoolPayload): Promise<SchoolSummary> {
  const { data } = await api.post<SchoolSummary>('/platform/schools/signup', payload)
  return data
}

export async function fetchPlans(includeInactive?: boolean): Promise<Plan[]> {
  const { data } = await api.get<Plan[]>('/platform/plans', { params: { includeInactive } })
  return data
}

export async function createPlan(payload: CreatePlanPayload): Promise<Plan> {
  const { data } = await api.post<Plan>('/platform/plans', payload)
  return data
}

export async function updatePlan(id: string, payload: Partial<CreatePlanPayload & { isActive: boolean }>): Promise<Plan> {
  const { data } = await api.patch<Plan>(`/platform/plans/${id}`, payload)
  return data
}

export async function deactivatePlan(id: string): Promise<Plan> {
  const { data } = await api.delete<Plan>(`/platform/plans/${id}`)
  return data
}

export async function fetchSchools(status?: string): Promise<SchoolSummary[]> {
  const { data } = await api.get<SchoolSummary[]>('/platform/schools', { params: { status } })
  return data
}

export async function fetchSchool(id: string): Promise<SchoolSummary> {
  const { data } = await api.get<SchoolSummary>(`/platform/schools/${id}`)
  return data
}

export async function createSchoolManually(payload: CreateSchoolPayload): Promise<SchoolSummary> {
  const { data } = await api.post<SchoolSummary>('/platform/schools', payload)
  return data
}

export async function approveSchool(id: string, payload: ApproveSchoolPayload): Promise<SchoolSummary> {
  const { data } = await api.post<SchoolSummary>(`/platform/schools/${id}/approve`, payload)
  return data
}

export async function suspendSchool(id: string): Promise<SchoolSummary> {
  const { data } = await api.post<SchoolSummary>(`/platform/schools/${id}/suspend`)
  return data
}

export async function reactivateSchool(id: string): Promise<SchoolSummary> {
  const { data } = await api.post<SchoolSummary>(`/platform/schools/${id}/reactivate`)
  return data
}

export async function fetchSubscription(schoolId: string): Promise<Subscription & { payments: Payment[] }> {
  const { data } = await api.get(`/platform/schools/${schoolId}/subscription`)
  return data
}

export async function updateSubscription(
  schoolId: string,
  payload: { planId?: string; status?: SubscriptionStatus },
): Promise<Subscription> {
  const { data } = await api.patch<Subscription>(`/platform/schools/${schoolId}/subscription`, payload)
  return data
}

export async function recordPayment(schoolId: string, payload: RecordPaymentPayload) {
  const { data } = await api.post(`/platform/schools/${schoolId}/subscription/payments`, payload)
  return data
}

export async function fetchPayments(schoolId: string): Promise<Payment[]> {
  const { data } = await api.get<Payment[]>(`/platform/schools/${schoolId}/subscription/payments`)
  return data
}
