import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { fetchAcademicYears } from '../../api/academic'
import { fetchStudentAttendanceSummary } from '../../api/attendance'
import { fetchReportCard } from '../../api/grading'
import { fetchInvoicesForStudent } from '../../api/invoices'
import { requestMeeting, type RequestMeetingPayload } from '../../api/meetings'
import { fetchMyChildren } from '../../api/students'
import { Card, StatCard } from '../../components/Card'

export default function ParentDashboard() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showMeetingForm, setShowMeetingForm] = useState(false)
  const children = useQuery({ queryKey: ['students', 'my-children'], queryFn: fetchMyChildren })
  const years = useQuery({ queryKey: ['academic-years'], queryFn: fetchAcademicYears })
  const currentYear = years.data?.find((y) => y.isCurrent) ?? years.data?.[0]

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const selectedChild = children.data?.find((c) => c.id === selectedId) ?? children.data?.[0]

  const summary = useQuery({
    queryKey: ['attendance', 'summary', selectedChild?.id],
    queryFn: () => fetchStudentAttendanceSummary(selectedChild!.id),
    enabled: !!selectedChild,
  })

  const reportCard = useQuery({
    queryKey: ['report-card', selectedChild?.id, currentYear?.id],
    queryFn: () => fetchReportCard(selectedChild!.id, currentYear!.id),
    enabled: !!selectedChild && !!currentYear,
  })

  const invoices = useQuery({
    queryKey: ['invoices', 'student', selectedChild?.id],
    queryFn: () => fetchInvoicesForStudent(selectedChild!.id),
    enabled: !!selectedChild,
  })

  const meetingForm = useForm<Omit<RequestMeetingPayload, 'studentId'>>()
  const requestMeetingMutation = useMutation({
    mutationFn: (values: Omit<RequestMeetingPayload, 'studentId'>) =>
      requestMeeting({ ...values, studentId: selectedChild!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      meetingForm.reset()
      setShowMeetingForm(false)
    },
  })

  if (children.data && children.data.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{t('common.noData')}</p>
  }

  return (
    <div className="space-y-6">
      {children.data && children.data.length > 1 && (
        <select
          value={selectedChild?.id}
          onChange={(e) => setSelectedId(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          {children.data.map((child) => (
            <option key={child.id} value={child.id}>
              {child.user.firstName} {child.user.lastName}
            </option>
          ))}
        </select>
      )}

      {selectedChild && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label={t('dashboard.overallAverage')}
            value={reportCard.data ? `${reportCard.data.overallAverage}/20` : '—'}
          />
          <Card>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.myAttendance')}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {summary.data?.map((entry) => (
                <span
                  key={entry.status}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {t(`attendance.${entry.status}`)}: {entry.count}
                </span>
              ))}
            </div>
          </Card>
        </div>
      )}

      {selectedChild && (
        <Card>
          <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">{t('invoices.title')}</p>
          {invoices.data && invoices.data.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="pb-2">{t('invoices.balance')}</th>
                  <th className="pb-2">{t('invoices.statusLabel')}</th>
                  <th className="pb-2">{t('invoices.dueDate')}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.data.map((inv) => (
                  <tr key={inv.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-2 text-slate-900 dark:text-white">
                      {inv.balance} {inv.currency}
                    </td>
                    <td className="py-2 text-slate-700 dark:text-slate-300">{t(`invoices.status.${inv.status}`)}</td>
                    <td className="py-2 text-slate-700 dark:text-slate-300">{inv.dueDate.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('common.noData')}</p>
          )}
        </Card>
      )}

      {selectedChild && (
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('meetings.title')}</p>
            <button
              type="button"
              onClick={() => setShowMeetingForm((v) => !v)}
              className="rounded-lg bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-500"
            >
              {t('common.create')}
            </button>
          </div>
          {showMeetingForm && (
            <form
              onSubmit={meetingForm.handleSubmit((values) => requestMeetingMutation.mutate(values))}
              className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3"
            >
              <input
                placeholder={t('messages.recipientId') as string}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                {...meetingForm.register('teacherId', { required: true })}
              />
              <input
                type="datetime-local"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                {...meetingForm.register('scheduledAt', { required: true })}
              />
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
              >
                {t('common.save')}
              </button>
            </form>
          )}
        </Card>
      )}
    </div>
  )
}
