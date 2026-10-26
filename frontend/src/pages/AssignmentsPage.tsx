import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { fetchAcademicYears, fetchClassGroups, fetchSubjects } from '../api/academic'
import {
  createAssignment,
  deleteAssignment,
  fetchAssignments,
  fetchAssignmentSubmissions,
  gradeSubmission,
  type CreateAssignmentPayload,
} from '../api/assignments'
import { Card } from '../components/Card'
import { useAuthStore } from '../stores/auth-store'

export default function AssignmentsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isTeacher = user?.role === 'TEACHER'

  const [showForm, setShowForm] = useState(false)
  const [classGroupId, setClassGroupId] = useState('')
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [grades, setGrades] = useState<Record<string, { grade: string; feedback: string }>>({})

  const classGroups = useQuery({ queryKey: ['class-groups'], queryFn: fetchClassGroups })
  const subjects = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects })
  const years = useQuery({ queryKey: ['academic-years'], queryFn: fetchAcademicYears })
  const currentYear = years.data?.find((y) => y.isCurrent) ?? years.data?.[0]

  const assignments = useQuery({
    queryKey: ['assignments', classGroupId],
    queryFn: () => fetchAssignments({ classGroupId: classGroupId || undefined }),
  })

  const submissions = useQuery({
    queryKey: ['assignment-submissions', selectedAssignmentId],
    queryFn: () => fetchAssignmentSubmissions(selectedAssignmentId as string),
    enabled: !!selectedAssignmentId && isTeacher,
  })

  const { register, handleSubmit, reset } = useForm<CreateAssignmentPayload>()

  const createMutation = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      reset()
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      setSelectedAssignmentId(null)
    },
  })

  const gradeMutation = useMutation({
    mutationFn: ({ submissionId, grade, feedback }: { submissionId: string; grade: number; feedback?: string }) =>
      gradeSubmission(selectedAssignmentId as string, submissionId, { grade, feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions', selectedAssignmentId] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('assignments.title')}</h1>
        {isTeacher && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            {t('common.create')}
          </button>
        )}
      </div>

      {isTeacher && showForm && (
        <Card>
          <form
            onSubmit={handleSubmit((values) =>
              createMutation.mutate({ ...values, academicYearId: currentYear?.id ?? values.academicYearId }),
            )}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            <input
              placeholder={t('assignments.titleField') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('title', { required: true })}
            />
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('subjectId', { required: true })}
            >
              <option value="">{t('grades.subject')}</option>
              {subjects.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('classGroupId', { required: true })}
            >
              <option value="">{t('students.class')}</option>
              {classGroups.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('dueDate', { required: true })}
            />
            <input
              placeholder={t('assignments.description') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('description')}
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
            >
              {t('common.save')}
            </button>
          </form>
        </Card>
      )}

      <select
        value={classGroupId}
        onChange={(e) => {
          setClassGroupId(e.target.value)
          setSelectedAssignmentId(null)
        }}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      >
        <option value="">{t('attendance.selectClass')}</option>
        {classGroups.data?.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <Card>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="pb-2">{t('assignments.titleField')}</th>
              <th className="pb-2">{t('grades.subject')}</th>
              <th className="pb-2">{t('students.class')}</th>
              <th className="pb-2">{t('assignments.dueDate')}</th>
              <th className="pb-2">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {assignments.data?.map((a) => (
              <tr key={a.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-2 text-slate-900 dark:text-white">{a.title}</td>
                <td className="py-2 text-slate-700 dark:text-slate-300">{a.subject?.name}</td>
                <td className="py-2 text-slate-700 dark:text-slate-300">{a.classGroup?.name}</td>
                <td className="py-2 text-slate-700 dark:text-slate-300">{a.dueDate.slice(0, 10)}</td>
                <td className="py-2 space-x-3">
                  {isTeacher && (
                    <button
                      type="button"
                      onClick={() => {
                        setClassGroupId(a.classGroupId)
                        setSelectedAssignmentId(a.id)
                      }}
                      className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      {t('assignments.viewSubmissions')}
                    </button>
                  )}
                  {isTeacher && (
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(a.id)}
                      className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                    >
                      {t('common.delete')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {isTeacher && selectedAssignmentId && submissions.data && (
        <Card>
          <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('assignments.submissions')}
          </p>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="pb-2">{t('students.title')}</th>
                <th className="pb-2">{t('assignments.submittedAt')}</th>
                <th className="pb-2">{t('grades.score')}</th>
                <th className="pb-2">{t('assignments.feedback')}</th>
                <th className="pb-2">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {submissions.data.map((sub) => {
                const current = grades[sub.id] ?? {
                  grade: sub.grade != null ? String(sub.grade) : '',
                  feedback: sub.feedback ?? '',
                }
                return (
                  <tr key={sub.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-2 text-slate-900 dark:text-white">
                      {sub.student?.user?.firstName} {sub.student?.user?.lastName}
                    </td>
                    <td className="py-2 text-slate-700 dark:text-slate-300">{sub.submittedAt.slice(0, 10)}</td>
                    <td className="py-2">
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={current.grade}
                        onChange={(e) =>
                          setGrades((prev) => ({
                            ...prev,
                            [sub.id]: { ...current, grade: e.target.value },
                          }))
                        }
                        className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="text"
                        value={current.feedback}
                        onChange={(e) =>
                          setGrades((prev) => ({
                            ...prev,
                            [sub.id]: { ...current, feedback: e.target.value },
                          }))
                        }
                        className="w-40 rounded-lg border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        disabled={gradeMutation.isPending || current.grade === ''}
                        onClick={() =>
                          gradeMutation.mutate({
                            submissionId: sub.id,
                            grade: Number(current.grade),
                            feedback: current.feedback || undefined,
                          })
                        }
                        className="rounded-lg bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
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
