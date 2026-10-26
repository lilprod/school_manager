import { api } from '../lib/api'
import type { ReportsSummary } from '../types'

export async function fetchReportsSummary(): Promise<ReportsSummary> {
  const { data } = await api.get<ReportsSummary>('/reports/summary')
  return data
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadAttendanceCsv(params?: {
  classGroupId?: string
  from?: string
  to?: string
}): Promise<void> {
  const { data } = await api.get<Blob>('/reports/attendance.csv', { params, responseType: 'blob' })
  triggerDownload(data, 'presences.csv')
}

export async function downloadFinanceCsv(params?: {
  classGroupId?: string
  academicYearId?: string
}): Promise<void> {
  const { data } = await api.get<Blob>('/reports/finance.csv', { params, responseType: 'blob' })
  triggerDownload(data, 'finances.csv')
}

export async function downloadStaffAttendanceCsv(params?: { from?: string; to?: string }): Promise<void> {
  const { data } = await api.get<Blob>('/reports/staff-attendance.csv', { params, responseType: 'blob' })
  triggerDownload(data, 'presences-personnel.csv')
}

export async function openReportCardPdf(studentId: string, academicYearId: string, termId?: string): Promise<void> {
  const { data } = await api.get<Blob>(`/reports/report-card/${studentId}.pdf`, {
    params: { academicYearId, termId },
    responseType: 'blob',
  })
  const url = URL.createObjectURL(data)
  window.open(url, '_blank')
}
