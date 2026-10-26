import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchAcademicYears, fetchClassGroups, fetchSubjects } from '../api/academic'
import { fetchReportComments, saveReportComment } from '../api/reportComments'
import { fetchStudents } from '../api/students'
import { fetchTerms } from '../api/terms'
import { Card } from '../components/Card'
import { useAuthStore } from '../stores/auth-store'

export default function ReportCommentsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const role = useAuthStore((s) => s.user?.role)
  const isAdmin = role === 'ADMIN'

  const [classGroupId, setClassGroupId] = useState('')
  const [termId, setTermId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const years = useQuery({ queryKey: ['academic-years'], queryFn: fetchAcademicYears })
  const currentYear = years.data?.find((y) => y.isCurrent) ?? years.data?.[0]
  const classGroups = useQuery({ queryKey: ['class-groups'], queryFn: fetchClassGroups })
  const subjects = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects })
  const terms = useQuery({
    queryKey: ['terms', currentYear?.id],
    queryFn: () => fetchTerms(currentYear!.id),
    enabled: !!currentYear,
  })
  const students = useQuery({
    queryKey: ['students', classGroupId],
    queryFn: () => fetchStudents(classGroupId),
    enabled: !!classGroupId,
  })
  const comments = useQuery({
    queryKey: ['report-comments', classGroupId, currentYear?.id, termId, subjectId],
    queryFn: () =>
      fetchReportComments({
        classGroupId,
        academicYearId: currentYear!.id,
        termId: termId || undefined,
        subjectId: subjectId || undefined,
      }),
    enabled: !!classGroupId && !!currentYear,
  })

  const saveMutation = useMutation({
    mutationFn: ({ studentId, comment }: { studentId: string; comment: string }) =>
      saveReportComment({
        studentId,
        academicYearId: currentYear!.id,
        termId: termId || undefined,
        subjectId: subjectId || undefined,
        comment,
      }),
    onSuccess: (_data, variables) => {
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[variables.studentId]
        return next
      })
      queryClient.invalidateQueries({ queryKey: ['report-comments'] })
      queryClient.invalidateQueries({ queryKey: ['report-card'] })
    },
  })

  const existing = new Map(comments.data?.map((c) => [c.studentId, c.comment]))
  const errorMessage =
    saveMutation.error && isAxiosError(saveMutation.error)
      ? ((saveMutation.error.response?.data as { message?: string } | undefined)?.message ?? t('common.error'))
      : null
  const selectClass =
    'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('reportComments.title')}</h1>

      <div className="flex flex-wrap gap-3">
        <select
          value={classGroupId}
          onChange={(e) => {
            setClassGroupId(e.target.value)
            setDrafts({})
          }}
          className={selectClass}
        >
          <option value="">{t('attendance.selectClass')}</option>
          {classGroups.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={termId}
          onChange={(e) => {
            setTermId(e.target.value)
            setDrafts({})
          }}
          className={selectClass}
        >
          <option value="">{t('terms.wholeYear')}</option>
          {terms.data?.map((term) => (
            <option key={term.id} value={term.id}>
              {term.name}
            </option>
          ))}
        </select>
        <select
          value={subjectId}
          onChange={(e) => {
            setSubjectId(e.target.value)
            setDrafts({})
          }}
          className={selectClass}
        >
          {isAdmin && <option value="">{t('reportComments.general')}</option>}
          {!isAdmin && <option value="">{t('grades.subject')}</option>}
          {subjects.data?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      {classGroupId && (
        <Card>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="pb-2">{t('students.title')}</th>
                <th className="pb-2">{t('reportComments.comment')}</th>
                <th className="pb-2">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {students.data?.map((student) => {
                const value = drafts[student.id] ?? existing.get(student.id) ?? ''
                const changed = value !== (existing.get(student.id) ?? '')
                return (
                  <tr key={student.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-2 text-slate-900 dark:text-white">
                      {student.user.lastName} {student.user.firstName}
                    </td>
                    <td className="py-2">
                      <textarea
                        rows={2}
                        value={value}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [student.id]: e.target.value }))}
                        className="w-full min-w-64 rounded-lg border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        disabled={!changed || saveMutation.isPending}
                        onClick={() => saveMutation.mutate({ studentId: student.id, comment: value })}
                        className="text-sm font-medium text-indigo-600 hover:underline disabled:opacity-40 dark:text-indigo-400"
                      >
                        {t('common.save')}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
