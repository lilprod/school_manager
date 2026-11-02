import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import {
  approveSchool,
  fetchPayments,
  fetchPlans,
  fetchSchool,
  recordPayment,
  reactivateSchool,
  suspendSchool,
  type ApproveSchoolPayload,
  type RecordPaymentPayload,
} from '../../api/platform'
import { Card } from '../../components/Card'

export default function PlatformSchoolDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [showApprove, setShowApprove] = useState(false)
  const [showPayment, setShowPayment] = useState(false)

  const school = useQuery({
    queryKey: ['platform', 'schools', id],
    queryFn: () => fetchSchool(id!),
    enabled: !!id,
  })
  const plans = useQuery({ queryKey: ['platform', 'plans'], queryFn: () => fetchPlans() })
  const payments = useQuery({
    queryKey: ['platform', 'payments', id],
    queryFn: () => fetchPayments(id!),
    enabled: !!id && school.data?.status !== 'PENDING_APPROVAL',
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['platform', 'schools', id] })
    queryClient.invalidateQueries({ queryKey: ['platform', 'payments', id] })
  }

  const approveForm = useForm<ApproveSchoolPayload>()
  const approveMutation = useMutation({
    mutationFn: (values: ApproveSchoolPayload) => approveSchool(id!, values),
    onSuccess: () => {
      invalidate()
      setShowApprove(false)
    },
  })

  const suspendMutation = useMutation({ mutationFn: () => suspendSchool(id!), onSuccess: invalidate })
  const reactivateMutation = useMutation({ mutationFn: () => reactivateSchool(id!), onSuccess: invalidate })

  const paymentForm = useForm<RecordPaymentPayload>()
  const paymentMutation = useMutation({
    mutationFn: (values: RecordPaymentPayload) => recordPayment(id!, values),
    onSuccess: () => {
      invalidate()
      paymentForm.reset()
      setShowPayment(false)
    },
  })

  if (!school.data) return null
  const s = school.data

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{s.name}</h1>

      <Card className="space-y-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('platform.status')}:{' '}
          <span className="font-medium text-slate-900 dark:text-white">
            {t(`platform.schoolStatus.${s.status}`)}
          </span>
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('platform.onboardingSource')}: {t(`platform.onboarding.${s.onboardingSource}`)}
        </p>
        {s.subscription && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('platform.subscription')}: {s.subscription.plan.name} —{' '}
            {t(`platform.subscriptionStatus.${s.subscription.status}`)}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          {s.status === 'PENDING_APPROVAL' && (
            <button
              type="button"
              onClick={() => setShowApprove((v) => !v)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              {t('platform.approve')}
            </button>
          )}
          {s.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => suspendMutation.mutate()}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
            >
              {t('platform.suspend')}
            </button>
          )}
          {s.status === 'SUSPENDED' && (
            <button
              type="button"
              onClick={() => reactivateMutation.mutate()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              {t('platform.reactivate')}
            </button>
          )}
        </div>

        {showApprove && (
          <form
            onSubmit={approveForm.handleSubmit((values) => approveMutation.mutate(values))}
            className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-3"
          >
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...approveForm.register('planId', { required: true })}
              defaultValue={s.requestedPlanId ?? ''}
            >
              <option value="">{t('platform.plan')}</option>
              {plans.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...approveForm.register('subscriptionStatus')}
              defaultValue="ACTIVE"
            >
              <option value="ACTIVE">{t('platform.subscriptionStatus.ACTIVE')}</option>
              <option value="TRIALING">{t('platform.subscriptionStatus.TRIALING')}</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
            >
              {t('common.save')}
            </button>
          </form>
        )}
      </Card>

      {s.status !== 'PENDING_APPROVAL' && (
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('platform.paymentHistory')}</p>
            <button
              type="button"
              onClick={() => setShowPayment((v) => !v)}
              className="rounded-lg bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-500"
            >
              {t('platform.recordPayment')}
            </button>
          </div>

          {showPayment && (
            <form
              onSubmit={paymentForm.handleSubmit((values) => paymentMutation.mutate(values))}
              className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4"
            >
              <input
                type="number"
                step="0.01"
                placeholder={t('platform.amount') as string}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                {...paymentForm.register('amount', { required: true, valueAsNumber: true })}
              />
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                {...paymentForm.register('method', { required: true })}
              >
                <option value="CASH">{t('platform.paymentMethod.CASH')}</option>
                <option value="MOBILE_MONEY">{t('platform.paymentMethod.MOBILE_MONEY')}</option>
              </select>
              <input
                placeholder={t('platform.reference') as string}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                {...paymentForm.register('reference')}
              />
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
              >
                {t('common.save')}
              </button>
            </form>
          )}

          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="pb-2">{t('attendance.date')}</th>
                <th className="pb-2">{t('platform.amount')}</th>
                <th className="pb-2">{t('platform.method')}</th>
                <th className="pb-2">{t('platform.reference')}</th>
              </tr>
            </thead>
            <tbody>
              {payments.data?.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 text-slate-900 dark:text-white">{p.paidAt.slice(0, 10)}</td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">
                    {p.amount} {p.currency}
                  </td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">
                    {t(`platform.paymentMethod.${p.method}`)}
                  </td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">{p.reference ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
