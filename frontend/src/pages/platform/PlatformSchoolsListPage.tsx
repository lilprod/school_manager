import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { createSchoolManually, fetchPlans, fetchSchools, type CreateSchoolPayload } from '../../api/platform'
import { Card } from '../../components/Card'
import type { SchoolStatus } from '../../types'

export default function PlatformSchoolsListPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<SchoolStatus | ''>('')

  const schools = useQuery({
    queryKey: ['platform', 'schools', statusFilter],
    queryFn: () => fetchSchools(statusFilter || undefined),
  })
  const plans = useQuery({ queryKey: ['platform', 'plans'], queryFn: () => fetchPlans() })

  const { register, handleSubmit, reset } = useForm<CreateSchoolPayload>()

  const createMutation = useMutation({
    mutationFn: createSchoolManually,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform', 'schools'] })
      reset()
      setShowForm(false)
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('platform.schools')}</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {t('platform.createSchool')}
        </button>
      </div>

      {showForm && (
        <Card>
          <form
            onSubmit={handleSubmit((values) => createMutation.mutate(values))}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            <input
              placeholder={t('platform.name') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('schoolName', { required: true })}
            />
            <input
              placeholder="Email admin"
              type="email"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('adminEmail', { required: true })}
            />
            <input
              placeholder="Mot de passe"
              type="password"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('adminPassword', { required: true, minLength: 6 })}
            />
            <input
              placeholder="Prénom admin"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('adminFirstName', { required: true })}
            />
            <input
              placeholder="Nom admin"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('adminLastName', { required: true })}
            />
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('planId', { required: true })}
            >
              <option value="">{t('platform.plan')}</option>
              {plans.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
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
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as SchoolStatus | '')}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      >
        <option value="">{t('platform.status')}</option>
        <option value="PENDING_APPROVAL">{t('platform.schoolStatus.PENDING_APPROVAL')}</option>
        <option value="ACTIVE">{t('platform.schoolStatus.ACTIVE')}</option>
        <option value="SUSPENDED">{t('platform.schoolStatus.SUSPENDED')}</option>
      </select>

      <Card>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="pb-2">{t('platform.name')}</th>
              <th className="pb-2">{t('platform.status')}</th>
              <th className="pb-2">{t('platform.onboardingSource')}</th>
              <th className="pb-2">{t('platform.plan')}</th>
              <th className="pb-2">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {schools.data?.map((school) => (
              <tr key={school.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-2 text-slate-900 dark:text-white">{school.name}</td>
                <td className="py-2 text-slate-700 dark:text-slate-300">
                  {t(`platform.schoolStatus.${school.status}`)}
                </td>
                <td className="py-2 text-slate-700 dark:text-slate-300">
                  {t(`platform.onboarding.${school.onboardingSource}`)}
                </td>
                <td className="py-2 text-slate-700 dark:text-slate-300">
                  {school.subscription?.plan.name ?? '—'}
                </td>
                <td className="py-2">
                  <Link
                    to={`/platform/schools/${school.id}`}
                    className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {t('platform.viewDetails')}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
