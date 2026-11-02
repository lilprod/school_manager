import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { createPlan, deactivatePlan, fetchPlans, type CreatePlanPayload } from '../../api/platform'
import { Card } from '../../components/Card'

export default function PlatformPlansPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const plans = useQuery({ queryKey: ['platform', 'plans', 'all'], queryFn: () => fetchPlans(true) })
  const { register, handleSubmit, reset } = useForm<CreatePlanPayload>()

  const createMutation = useMutation({
    mutationFn: createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform', 'plans'] })
      reset()
      setShowForm(false)
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: deactivatePlan,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform', 'plans'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('platform.plans')}</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {t('platform.createPlan')}
        </button>
      </div>

      {showForm && (
        <Card>
          <form
            onSubmit={handleSubmit((values) => createMutation.mutate(values))}
            className="grid grid-cols-1 gap-3 sm:grid-cols-4"
          >
            <input
              placeholder="Standard"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('name', { required: true })}
            />
            <input
              placeholder="standard"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('code', { required: true })}
            />
            <input
              type="number"
              placeholder={t('platform.amount') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('priceAmount', { required: true, valueAsNumber: true })}
            />
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('billingPeriod', { required: true })}
              defaultValue="MONTHLY"
            >
              <option value="MONTHLY">Mensuel</option>
              <option value="YEARLY">Annuel</option>
            </select>
            <input
              type="number"
              placeholder="Max élèves"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('maxStudents', { valueAsNumber: true })}
            />
            <input
              type="number"
              placeholder="Max profs"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('maxTeachers', { valueAsNumber: true })}
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
              <th className="pb-2">{t('platform.name')}</th>
              <th className="pb-2">{t('platform.amount')}</th>
              <th className="pb-2">{t('platform.status')}</th>
              <th className="pb-2">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {plans.data?.map((plan) => (
              <tr key={plan.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-2 text-slate-900 dark:text-white">{plan.name}</td>
                <td className="py-2 text-slate-700 dark:text-slate-300">
                  {plan.priceAmount} {plan.currency}
                </td>
                <td className="py-2 text-slate-700 dark:text-slate-300">
                  {plan.isActive ? '✓' : '—'}
                </td>
                <td className="py-2">
                  {plan.isActive && (
                    <button
                      type="button"
                      onClick={() => deactivateMutation.mutate(plan.id)}
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
    </div>
  )
}
