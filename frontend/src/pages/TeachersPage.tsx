import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { createTeacher, fetchTeachers, type CreateTeacherPayload } from '../api/teachers'
import { Card } from '../components/Card'

export default function TeachersPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const teachers = useQuery({ queryKey: ['teachers'], queryFn: fetchTeachers })
  const { register, handleSubmit, reset } = useForm<CreateTeacherPayload>()

  const createMutation = useMutation({
    mutationFn: createTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      reset()
      setShowForm(false)
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('nav.teachers')}</h1>
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
              placeholder={t('students.firstName') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('firstName', { required: true })}
            />
            <input
              placeholder={t('students.lastName') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('lastName', { required: true })}
            />
            <input
              placeholder={t('students.email') as string}
              type="email"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('email', { required: true })}
            />
            <input
              placeholder="Mot de passe"
              type="password"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('password', { required: true, minLength: 6 })}
            />
            <input
              placeholder="Matricule"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('employeeNumber', { required: true })}
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

      <Card>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="pb-2">{t('students.lastName')}</th>
              <th className="pb-2">{t('students.firstName')}</th>
              <th className="pb-2">Matricule</th>
              <th className="pb-2">{t('students.email')}</th>
            </tr>
          </thead>
          <tbody>
            {teachers.data?.map((teacher) => (
              <tr key={teacher.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-2 text-slate-900 dark:text-white">{teacher.user.lastName}</td>
                <td className="py-2 text-slate-900 dark:text-white">{teacher.user.firstName}</td>
                <td className="py-2 text-slate-700 dark:text-slate-300">{teacher.employeeNumber}</td>
                <td className="py-2 text-slate-700 dark:text-slate-300">{teacher.user.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
