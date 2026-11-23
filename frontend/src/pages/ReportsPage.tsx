import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { downloadAttendanceCsv, downloadFinanceCsv, downloadStaffAttendanceCsv, fetchReportsSummary } from '../api/reports'
import { Card, StatCard } from '../components/Card'

export default function ReportsPage() {
  const { t } = useTranslation()
  const summary = useQuery({ queryKey: ['reports-summary'], queryFn: fetchReportsSummary })

  const [attendanceFrom, setAttendanceFrom] = useState('')
  const [attendanceTo, setAttendanceTo] = useState('')

  const attendanceCsv = useMutation({
    mutationFn: () => downloadAttendanceCsv({ from: attendanceFrom || undefined, to: attendanceTo || undefined }),
  })
  const financeCsv = useMutation({ mutationFn: () => downloadFinanceCsv() })
  const staffAttendanceCsv = useMutation({ mutationFn: () => downloadStaffAttendanceCsv() })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('reports.title')}</h1>

      {summary.data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label={t('dashboard.totalStudents')} value={summary.data.totalStudents} />
          <StatCard label={t('dashboard.totalTeachers')} value={summary.data.totalTeachers} />
          <StatCard label={t('dashboard.totalClasses')} value={summary.data.totalClasses} />
          <StatCard label={t('reports.attendanceRate')} value={`${summary.data.attendanceRatePercent}%`} />
          <StatCard label={t('reports.outstandingInvoices')} value={summary.data.outstandingInvoicesTotal} />
          <StatCard label={t('reports.expensesThisMonth')} value={summary.data.totalExpensesThisMonth} />
        </div>
      )}

      <Card>
        <h2 className="mb-3 text-lg font-medium text-slate-900 dark:text-white">{t('reports.attendanceCsv')}</h2>
        <div className="flex flex-wrap items-end gap-3">
          <input
            type="date"
            value={attendanceFrom}
            onChange={(e) => setAttendanceFrom(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            aria-label={t('staffAttendance.from')}
          />
          <input
            type="date"
            value={attendanceTo}
            onChange={(e) => setAttendanceTo(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            aria-label={t('staffAttendance.to')}
          />
          <button
            type="button"
            onClick={() => attendanceCsv.mutate()}
            disabled={attendanceCsv.isPending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {t('reports.download')}
          </button>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-medium text-slate-900 dark:text-white">{t('reports.financeCsv')}</h2>
        <button
          type="button"
          onClick={() => financeCsv.mutate()}
          disabled={financeCsv.isPending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {t('reports.download')}
        </button>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-medium text-slate-900 dark:text-white">{t('reports.staffAttendanceCsv')}</h2>
        <button
          type="button"
          onClick={() => staffAttendanceCsv.mutate()}
          disabled={staffAttendanceCsv.isPending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {t('reports.download')}
        </button>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-medium text-slate-900 dark:text-white">{t('reports.reportCardTitle')}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('reports.reportCardHint')}</p>
      </Card>
    </div>
  )
}
