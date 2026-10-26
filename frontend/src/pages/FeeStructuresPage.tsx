import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { fetchAcademicYears, fetchClassGroups } from '../api/academic'
import {
  createFeeStructure,
  deleteFeeStructure,
  fetchFeeStructures,
  type CreateFeeStructurePayload,
} from '../api/feeStructures'
import { Card } from '../components/Card'

export default function FeeStructuresPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const feeStructures = useQuery({ queryKey: ['fee-structures'], queryFn: () => fetchFeeStructures() })
  const classGroups = useQuery({ queryKey: ['class-groups'], queryFn: fetchClassGroups })
  const years = useQuery({ queryKey: ['academic-years'], queryFn: fetchAcademicYears })
  const currentYear = years.data?.find((y) => y.isCurrent) ?? years.data?.[0]

  const { register, handleSubmit, reset } = useForm<CreateFeeStructurePayload>()

  const createMutation = useMutation({
    mutationFn: createFeeStructure,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] })
      reset()
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFeeStructure,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('feeStructures.title')}</h1>
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
              createMutation.mutate({
                ...values,
                academicYearId: currentYear?.id ?? values.academicYearId,
                classGroupId: values.classGroupId || undefined,
              }),
            )}
            className="grid grid-cols-1 gap-3 sm:grid-cols-4"
          >
            <input
              placeholder={t('feeStructures.name') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('name', { required: true })}
            />
            <input
              type="number"
              step="0.01"
              placeholder={t('feeStructures.amount') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('amount', { required: true, valueAsNumber: true })}
            />
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('classGroupId')}
            >
              <option value="">{t('feeStructures.allClasses')}</option>
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

      <Card>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="pb-2">{t('feeStructures.name')}</th>
              <th className="pb-2">{t('feeStructures.amount')}</th>
              <th className="pb-2">{t('students.class')}</th>
              <th className="pb-2">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {feeStructures.data?.map((f) => (
              <tr key={f.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-2 text-slate-900 dark:text-white">{f.name}</td>
                <td className="py-2 text-slate-700 dark:text-slate-300">
                  {f.amount} {f.currency}
                </td>
                <td className="py-2 text-slate-700 dark:text-slate-300">
                  {f.classGroup?.name ?? t('feeStructures.allClasses')}
                </td>
                <td className="py-2">
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(f.id)}
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
