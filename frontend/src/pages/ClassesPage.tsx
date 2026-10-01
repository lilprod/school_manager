import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { createClassGroup, fetchClassGroups } from '../api/academic'
import { Card } from '../components/Card'

interface FormValues {
  name: string
  level: string
}

export default function ClassesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const classGroups = useQuery({ queryKey: ['class-groups'], queryFn: fetchClassGroups })
  const { register, handleSubmit, reset } = useForm<FormValues>()

  const createMutation = useMutation({
    mutationFn: createClassGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-groups'] })
      reset()
      setShowForm(false)
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('nav.classes')}</h1>
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
              placeholder="6ème A"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('name', { required: true })}
            />
            <input
              placeholder="6ème"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('level', { required: true })}
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
              <th className="pb-2">Nom</th>
              <th className="pb-2">Niveau</th>
            </tr>
          </thead>
          <tbody>
            {classGroups.data?.map((c) => (
              <tr key={c.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-2 text-slate-900 dark:text-white">{c.name}</td>
                <td className="py-2 text-slate-700 dark:text-slate-300">{c.level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
