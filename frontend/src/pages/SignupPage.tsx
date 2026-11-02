import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { fetchPublicPlans, signupSchool, type SignupSchoolPayload } from '../api/platform'

export default function SignupPage() {
  const { t } = useTranslation()
  const [success, setSuccess] = useState(false)
  const plans = useQuery({ queryKey: ['platform', 'plans', 'public'], queryFn: fetchPublicPlans })
  const { register, handleSubmit, formState: { errors } } = useForm<SignupSchoolPayload>()

  const mutation = useMutation({
    mutationFn: signupSchool,
    onSuccess: () => setSuccess(true),
  })

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-slate-900">
          <p className="text-sm text-slate-700 dark:text-slate-200">{t('signup.success')}</p>
          <Link to="/login" className="mt-4 inline-block text-sm font-medium text-indigo-600 dark:text-indigo-400">
            {t('signup.backToLogin')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm dark:bg-slate-900">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t('signup.title')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('signup.subtitle')}</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <input
            placeholder={t('signup.schoolName') as string}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            {...register('schoolName', { required: true, minLength: 2 })}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder={t('signup.address') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('address')}
            />
            <input
              placeholder={t('signup.phone') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('phone')}
            />
          </div>

          <p className="pt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('signup.adminSectionTitle')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder={t('students.firstName') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('adminFirstName', { required: true })}
            />
            <input
              placeholder={t('students.lastName') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('adminLastName', { required: true })}
            />
          </div>
          <input
            type="email"
            placeholder={t('auth.email') as string}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            {...register('adminEmail', { required: true })}
          />
          <input
            type="password"
            placeholder={t('auth.password') as string}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            {...register('adminPassword', { required: true, minLength: 6 })}
          />
          {errors.adminPassword && <p className="text-xs text-red-600">{t('auth.password')}: min 6</p>}

          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            {...register('planCode', { required: true })}
          >
            <option value="">{t('signup.plan')}</option>
            {plans.data?.map((plan) => (
              <option key={plan.id} value={plan.code}>
                {plan.name} — {plan.priceAmount} {plan.currency}
              </option>
            ))}
          </select>

          {mutation.isError && <p className="text-sm text-red-600">{t('common.error')}</p>}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {mutation.isPending ? t('common.loading') : t('signup.submit')}
          </button>
        </form>

        <Link to="/login" className="mt-4 inline-block text-sm text-slate-500 dark:text-slate-400">
          {t('signup.backToLogin')}
        </Link>
      </div>
    </div>
  )
}
