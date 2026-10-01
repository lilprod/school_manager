import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { fetchAcademicYears, fetchClassGroups } from '../api/academic'
import { createStudent, fetchStudents, type CreateStudentPayload } from '../api/students'
import { Card } from '../components/Card'

export default function StudentsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [classFilter, setClassFilter] = useState<string>('')

  const classGroups = useQuery({ queryKey: ['class-groups'], queryFn: fetchClassGroups })
  const years = useQuery({ queryKey: ['academic-years'], queryFn: fetchAcademicYears })
  const students = useQuery({
    queryKey: ['students', classFilter],
    queryFn: () => fetchStudents(classFilter || undefined),
  })

  const { register, handleSubmit, reset } = useForm<CreateStudentPayload>()

  const createMutation = useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      reset()
      setShowForm(false)
    },
  })

  const currentYear = years.data?.find((y) => y.isCurrent) ?? years.data?.[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('students.title')}</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {t('students.addStudent')}
        </button>
      </div>

      {showForm && (
        <Card>
          <form
            onSubmit={handleSubmit((values) =>
              createMutation.mutate({ ...values, academicYearId: currentYear?.id ?? values.academicYearId }),
            )}
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
              placeholder={t('students.studentNumber') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('studentNumber', { required: true })}
            />
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
        value={classFilter}
        onChange={(e) => setClassFilter(e.target.value)}
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
        {students.data && students.data.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('students.noStudents')}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="pb-2">{t('students.lastName')}</th>
                <th className="pb-2">{t('students.firstName')}</th>
                <th className="pb-2">{t('students.studentNumber')}</th>
                <th className="pb-2">{t('students.class')}</th>
                <th className="pb-2">{t('students.email')}</th>
              </tr>
            </thead>
            <tbody>
              {students.data?.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 text-slate-900 dark:text-white">{s.user.lastName}</td>
                  <td className="py-2 text-slate-900 dark:text-white">{s.user.firstName}</td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">{s.studentNumber}</td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">{s.enrollments[0]?.classGroup.name}</td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">{s.user.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
