import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { fetchClassGroups, fetchSubjects } from '../api/academic'
import { createLessonPlan, deleteLessonPlan, fetchLessonPlans, type CreateLessonPlanPayload } from '../api/lessonPlans'
import { Card } from '../components/Card'

export default function LessonPlansPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [classGroupId, setClassGroupId] = useState('')

  const classGroups = useQuery({ queryKey: ['class-groups'], queryFn: fetchClassGroups })
  const subjects = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects })

  const lessonPlans = useQuery({
    queryKey: ['lesson-plans', classGroupId],
    queryFn: () => fetchLessonPlans({ classGroupId: classGroupId || undefined }),
  })

  const { register, handleSubmit, reset } = useForm<CreateLessonPlanPayload>()

  const createMutation = useMutation({
    mutationFn: createLessonPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-plans'] })
      reset()
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteLessonPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-plans'] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('lessonPlans.title')}</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {t('common.create')}
        </button>
      </div>

      {showForm && (
        <Card>
          <form
            onSubmit={handleSubmit((values) => createMutation.mutate(values))}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            <input
              placeholder={t('lessonPlans.title') as string}
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
              {...register('date', { required: true })}
            />
            <input
              placeholder={t('lessonPlans.objectives') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('objectives')}
            />
            <input
              placeholder={t('lessonPlans.content') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-3 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('content')}
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
        onChange={(e) => setClassGroupId(e.target.value)}
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
              <th className="pb-2">{t('lessonPlans.title')}</th>
              <th className="pb-2">{t('grades.subject')}</th>
              <th className="pb-2">{t('students.class')}</th>
              <th className="pb-2">{t('attendance.date')}</th>
              <th className="pb-2">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {lessonPlans.data?.map((lp) => (
              <tr key={lp.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-2 text-slate-900 dark:text-white">{lp.title}</td>
                <td className="py-2 text-slate-700 dark:text-slate-300">{lp.subject?.name}</td>
                <td className="py-2 text-slate-700 dark:text-slate-300">{lp.classGroup?.name}</td>
                <td className="py-2 text-slate-700 dark:text-slate-300">{lp.date.slice(0, 10)}</td>
                <td className="py-2">
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(lp.id)}
                    className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                  >
                    {t('common.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
