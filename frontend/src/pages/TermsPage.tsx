import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { fetchAcademicYears } from '../api/academic'
import { createTerm, deleteTerm, fetchTerms } from '../api/terms'
import { Card } from '../components/Card'

interface FormValues {
  name: string
  startDate: string
  endDate: string
}

export default function TermsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [yearId, setYearId] = useState('')

  const years = useQuery({ queryKey: ['academic-years'], queryFn: fetchAcademicYears })
  const selectedYear = years.data?.find((y) => y.id === yearId) ?? years.data?.find((y) => y.isCurrent) ?? years.data?.[0]

  const terms = useQuery({
    queryKey: ['terms', selectedYear?.id],
    queryFn: () => fetchTerms(selectedYear!.id),
    enabled: !!selectedYear,
  })

  const { register, handleSubmit, reset } = useForm<FormValues>()

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => createTerm({ ...values, academicYearId: selectedYear!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terms'] })
      reset()
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTerm,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['terms'] }),
  })

  const errorMessage =
    createMutation.error && isAxiosError(createMutation.error)
      ? ((createMutation.error.response?.data as { message?: string } | undefined)?.message ?? t('common.error'))
      : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('terms.title')}</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          disabled={!selectedYear}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {t('terms.create')}
        </button>
      </div>

      <select
        value={selectedYear?.id ?? ''}
        onChange={(e) => setYearId(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      >
        {years.data?.map((y) => (
          <option key={y.id} value={y.id}>
            {y.label}
          </option>
        ))}
      </select>

      {showForm && (
        <Card>
          <form
            onSubmit={handleSubmit((values) => createMutation.mutate(values))}
            className="grid grid-cols-1 gap-3 sm:grid-cols-4"
          >
            <input
              placeholder={t('terms.name') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('name', { required: true })}
            />
            <input
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('startDate', { required: true })}
            />
            <input
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('endDate', { required: true })}
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
            >
              {t('common.save')}
            </button>
          </form>
          {errorMessage && <p className="mt-3 text-sm text-red-600">{errorMessage}</p>}
        </Card>
      )}

      <Card>
        {terms.data && terms.data.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('terms.noTerms')}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="pb-2">{t('terms.name')}</th>
                <th className="pb-2">{t('terms.startDate')}</th>
                <th className="pb-2">{t('terms.endDate')}</th>
                <th className="pb-2">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {terms.data?.map((term) => (
                <tr key={term.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 text-slate-900 dark:text-white">{term.name}</td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">{term.startDate.slice(0, 10)}</td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">{term.endDate.slice(0, 10)}</td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(term.id)}
                      className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                    >
                      {t('common.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
