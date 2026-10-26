import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { fetchClassGroups } from '../api/academic'
import { fetchFeeStructures } from '../api/feeStructures'
import {
  createBulkInvoicesForClass,
  fetchInvoices,
  recordFeePayment,
  type CreateBulkInvoicesPayload,
  type RecordFeePaymentPayload,
} from '../api/invoices'
import { Card } from '../components/Card'
import type { InvoiceStatus } from '../types'

const STATUS_OPTIONS: InvoiceStatus[] = ['PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED']

export default function InvoicesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [classGroupId, setClassGroupId] = useState('')
  const [status, setStatus] = useState<InvoiceStatus | ''>('')
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null)

  const classGroups = useQuery({ queryKey: ['class-groups'], queryFn: fetchClassGroups })
  const feeStructures = useQuery({ queryKey: ['fee-structures'], queryFn: () => fetchFeeStructures() })

  const invoices = useQuery({
    queryKey: ['invoices', classGroupId, status],
    queryFn: () =>
      fetchInvoices({
        classGroupId: classGroupId || undefined,
        status: status || undefined,
      }),
  })

  const bulkForm = useForm<CreateBulkInvoicesPayload>()
  const bulkMutation = useMutation({
    mutationFn: createBulkInvoicesForClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      bulkForm.reset()
      setShowBulkForm(false)
    },
  })

  const paymentForm = useForm<RecordFeePaymentPayload>()
  const paymentMutation = useMutation({
    mutationFn: (values: RecordFeePaymentPayload) => recordFeePayment(payingInvoiceId!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      paymentForm.reset()
      setPayingInvoiceId(null)
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('invoices.title')}</h1>
        <button
          type="button"
          onClick={() => setShowBulkForm((v) => !v)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {t('invoices.billClass')}
        </button>
      </div>

      {showBulkForm && (
        <Card>
          <form
            onSubmit={bulkForm.handleSubmit((values) => bulkMutation.mutate(values))}
            className="grid grid-cols-1 gap-3 sm:grid-cols-4"
          >
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...bulkForm.register('feeStructureId', { required: true })}
            >
              <option value="">{t('invoices.feeStructure')}</option>
              {feeStructures.data?.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.amount} {f.currency})
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...bulkForm.register('classGroupId', { required: true })}
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
              {...bulkForm.register('dueDate', { required: true })}
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

      <div className="flex flex-wrap gap-3">
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
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as InvoiceStatus | '')}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="">{t('invoices.allStatuses')}</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {t(`invoices.status.${s}`)}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="pb-2">{t('students.title')}</th>
              <th className="pb-2">{t('platform.amount')}</th>
              <th className="pb-2">{t('invoices.paidAmount')}</th>
              <th className="pb-2">{t('invoices.balance')}</th>
              <th className="pb-2">{t('invoices.statusLabel')}</th>
              <th className="pb-2">{t('invoices.dueDate')}</th>
              <th className="pb-2">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {invoices.data?.map((invoice) => (
              <>
                <tr key={invoice.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 text-slate-900 dark:text-white">
                    {invoice.student
                      ? `${invoice.student.user.firstName} ${invoice.student.user.lastName}`
                      : invoice.studentId}
                  </td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">
                    {invoice.amount} {invoice.currency}
                  </td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">
                    {invoice.paidAmount} {invoice.currency}
                  </td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">
                    {invoice.balance} {invoice.currency}
                  </td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">
                    {t(`invoices.status.${invoice.status}`)}
                  </td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">{invoice.dueDate.slice(0, 10)}</td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => setPayingInvoiceId((id) => (id === invoice.id ? null : invoice.id))}
                      className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      {t('invoices.recordPayment')}
                    </button>
                  </td>
                </tr>
                {payingInvoiceId === invoice.id && (
                  <tr key={`${invoice.id}-form`} className="border-t border-slate-100 dark:border-slate-800">
                    <td colSpan={7} className="py-3">
                      <form
                        onSubmit={paymentForm.handleSubmit((values) => paymentMutation.mutate(values))}
                        className="grid grid-cols-1 gap-3 sm:grid-cols-4"
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
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
