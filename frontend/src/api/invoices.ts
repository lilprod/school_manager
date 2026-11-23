import { api } from '../lib/api'
import type { FeePayment, Invoice, InvoiceStatus, PaymentMethod } from '../types'

export interface CreateInvoicePayload {
  studentId: string
  feeStructureId?: string
  amount?: number
  currency?: string
  dueDate: string
}

export interface CreateBulkInvoicesPayload {
  feeStructureId: string
  classGroupId: string
  dueDate: string
}

export interface RecordFeePaymentPayload {
  amount: number
  method: PaymentMethod
  reference?: string
  paidAt?: string
}

export interface InvoiceFilters {
  studentId?: string
  status?: InvoiceStatus
  classGroupId?: string
}

export async function fetchInvoices(filters?: InvoiceFilters): Promise<Invoice[]> {
  const { data } = await api.get<Invoice[]>('/invoices', { params: filters })
  return data
}

export async function fetchInvoice(id: string): Promise<Invoice> {
  const { data } = await api.get<Invoice>(`/invoices/${id}`)
  return data
}

export async function createInvoice(payload: CreateInvoicePayload): Promise<Invoice> {
  const { data } = await api.post<Invoice>('/invoices', payload)
  return data
}

export async function createBulkInvoicesForClass(payload: CreateBulkInvoicesPayload): Promise<Invoice[]> {
  const { data } = await api.post<Invoice[]>('/invoices/bulk', payload)
  return data
}

export async function recordFeePayment(invoiceId: string, payload: RecordFeePaymentPayload): Promise<FeePayment> {
  const { data } = await api.post<FeePayment>(`/invoices/${invoiceId}/payments`, payload)
  return data
}

export async function fetchInvoicesForStudent(studentId: string, status?: InvoiceStatus): Promise<Invoice[]> {
  const { data } = await api.get<Invoice[]>(`/students/${studentId}/invoices`, { params: { status } })
  return data
}
