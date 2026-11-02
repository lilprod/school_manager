import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { createExpense, deleteExpense, fetchExpenses, type CreateExpensePayload } from '../api/expenses'
import { Card } from '../components/Card'

export default function ExpensesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const expenses = useQuery({ queryKey: ['expenses'], queryFn: () => fetchExpenses() })
  const { register, handleSubmit, reset } = useForm<CreateExpensePayload>()

  const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      reset()
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('expenses.title')}</h1>
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
            onSubmit={handleSubmit((values) =>
              createMutation.mutate({ ...values, date: values.date || undefined }),
            )}
            className="grid grid-cols-1 gap-3 sm:grid-cols-4"
          >
            <input
              placeholder={t('expenses.category') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('category', { required: true })}
            />
            <input
              type="number"
              step="0.01"
              placeholder={t('expenses.amount') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('amount', { required: true, valueAsNumber: true })}
            />
            <input
              placeholder={t('expenses.description') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('description')}
            />
            <input
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('date')}
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
              <th className="pb-2">{t('attendance.date')}</th>
              <th className="pb-2">{t('expenses.category')}</th>
              <th className="pb-2">{t('expenses.amount')}</th>
              <th className="pb-2">{t('expenses.description')}</th>
              <th className="pb-2">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {expenses.data?.map((e) => (
              <tr key={e.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-2 text-slate-900 dark:text-white">{e.date.slice(0, 10)}</td>
                <td className="py-2 text-slate-700 dark:text-slate-300">{e.category}</td>
                <td className="py-2 text-slate-700 dark:text-slate-300">
                  {e.amount} {e.currency}
                </td>
                <td className="py-2 text-slate-700 dark:text-slate-300">{e.description ?? '—'}</td>
                <td className="py-2">
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(e.id)}
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
