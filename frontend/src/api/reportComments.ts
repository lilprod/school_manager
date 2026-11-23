import { api } from '../lib/api'
import type { ReportCommentEntry } from '../types'

export interface SaveReportCommentPayload {
  studentId: string
  academicYearId: string
  termId?: string
  subjectId?: string
  comment: string
}

export async function saveReportComment(payload: SaveReportCommentPayload): Promise<void> {
  await api.put('/report-comments', payload)
}

export async function fetchReportComments(params: {
  classGroupId: string
  academicYearId: string
  termId?: string
  subjectId?: string
}): Promise<ReportCommentEntry[]> {
  const { data } = await api.get<ReportCommentEntry[]>('/report-comments', { params })
  return data
}
