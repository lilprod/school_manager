import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchAcademicYears } from '../../api/academic'
import { fetchAssignments, fetchMySubmission, submitAssignment } from '../../api/assignments'
import { fetchStudentAttendanceSummary } from '../../api/attendance'
import { fetchReportCard } from '../../api/grading'
import { fetchInvoicesForStudent } from '../../api/invoices'
import { fetchMyStudentProfile } from '../../api/students'
import { Card, StatCard } from '../../components/Card'

function AssignmentRow({ assignmentId, title, dueDate }: { assignmentId: string; title: string; dueDate: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')

  const submission = useQuery({
    queryKey: ['assignment-submission', 'me', assignmentId],
    queryFn: () => fetchMySubmission(assignmentId),
  })

  const submitMutation = useMutation({
    mutationFn: () => submitAssignment(assignmentId, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignment-submission', 'me', assignmentId] }),
  })

  return (
    <li className="space-y-2 border-t border-slate-100 py-2 first:border-t-0 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-900 dark:text-white">{title}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {t('assignments.dueDate')}: {dueDate.slice(0, 10)}
        </span>
      </div>
      {submission.data ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('messages.sent')} {submission.data.submittedAt.slice(0, 10)}
          {submission.data.grade != null ? ` — ${submission.data.grade}/20` : ''}
        </p>
      ) : (
        <div className="flex gap-2">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('assignments.description') as string}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="button"
            onClick={() => submitMutation.mutate()}
            className="rounded-lg bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-500"
          >
            {t('messages.send')}
          </button>
        </div>
      )}
    </li>
  )
}

export default function StudentDashboard() {
  const { t } = useTranslation()

  const profile = useQuery({ queryKey: ['students', 'me'], queryFn: fetchMyStudentProfile })
  const years = useQuery({ queryKey: ['academic-years'], queryFn: fetchAcademicYears })
  const currentYear = years.data?.find((y) => y.isCurrent) ?? years.data?.[0]

  const summary = useQuery({
    queryKey: ['attendance', 'summary', profile.data?.id],
    queryFn: () => fetchStudentAttendanceSummary(profile.data!.id),
    enabled: !!profile.data,
  })

  const reportCard = useQuery({
    queryKey: ['report-card', profile.data?.id, currentYear?.id],
    queryFn: () => fetchReportCard(profile.data!.id, currentYear!.id),
    enabled: !!profile.data && !!currentYear,
  })

  const enrollment = profile.data?.enrollments[0]

  const assignments = useQuery({
    queryKey: ['assignments', enrollment?.classGroup.id],
    queryFn: () => fetchAssignments({ classGroupId: enrollment!.classGroup.id }),
    enabled: !!enrollment,
  })

  const invoices = useQuery({
    queryKey: ['invoices', 'student', profile.data?.id],
    queryFn: () => fetchInvoicesForStudent(profile.data!.id),
    enabled: !!profile.data,
  })

  return (
    <div className="space-y-6">
      {enrollment && (
        <Card>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('students.class')}</p>
          <p className="mt-1 text-lg font-medium text-slate-900 dark:text-white">{enrollment.classGroup.name}</p>
        </Card>
      )}

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

      {reportCard.data && reportCard.data.subjects.length > 0 && (
        <Card>
          <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">{t('grades.reportCard')}</p>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="pb-2">{t('grades.subject')}</th>
                <th className="pb-2">{t('grades.average')}</th>
              </tr>
            </thead>
            <tbody>
              {reportCard.data.subjects.map((s) => (
                <tr key={s.subjectId} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 text-slate-900 dark:text-white">{s.subjectName}</td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">{s.average}/20</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card>
        <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">{t('assignments.title')}</p>
        {assignments.data && assignments.data.length > 0 ? (
          <ul>
            {assignments.data.map((a) => (
              <AssignmentRow key={a.id} assignmentId={a.id} title={a.title} dueDate={a.dueDate} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('common.noData')}</p>
        )}
      </Card>

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
    </div>
  )
}
