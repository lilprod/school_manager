import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchClassGroups } from '../api/academic'
import { fetchClassCoefficients, resetClassCoefficient, setClassCoefficient } from '../api/classCoefficients'
import { Card } from './Card'

export function ClassCoefficientsSection() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [classGroupId, setClassGroupId] = useState('')
  const [values, setValues] = useState<Record<string, string>>({})

  const classGroups = useQuery({ queryKey: ['class-groups'], queryFn: fetchClassGroups })
  const rows = useQuery({
    queryKey: ['class-coefficients', classGroupId],
    queryFn: () => fetchClassCoefficients(classGroupId),
    enabled: !!classGroupId,
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['class-coefficients', classGroupId] })
    queryClient.invalidateQueries({ queryKey: ['report-card'] })
  }

  const saveMutation = useMutation({
    mutationFn: (payload: { subjectId: string; coefficient: number }) =>
      setClassCoefficient({ classGroupId, ...payload }),
    onSuccess: (_data, variables) => {
      setValues((prev) => {
        const next = { ...prev }
        delete next[variables.subjectId]
        return next
      })
      refresh()
    },
  })

  const resetMutation = useMutation({ mutationFn: resetClassCoefficient, onSuccess: refresh })

  return (
    <Card>
      <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
        {t('subjects.classCoefficients')}
      </p>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{t('subjects.classCoefficientsHint')}</p>
      <select
        value={classGroupId}
        onChange={(e) => {
          setClassGroupId(e.target.value)
          setValues({})
        }}
        className="mb-4 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      >
        <option value="">{t('attendance.selectClass')}</option>
        {classGroups.data?.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {classGroupId && rows.data && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="pb-2">{t('grades.subject')}</th>
              <th className="pb-2">{t('subjects.defaultCoefficient')}</th>
              <th className="pb-2">{t('subjects.coefficient')}</th>
              <th className="pb-2">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.data.map((row) => {
              const value = values[row.subjectId] ?? String(row.coefficient)
              const changed = Number(value) !== row.coefficient
              return (
                <tr key={row.subjectId} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 text-slate-900 dark:text-white">{row.subjectName}</td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">{row.defaultCoefficient}</td>
                  <td className="py-2">
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={value}
                      onChange={(e) => setValues((prev) => ({ ...prev, [row.subjectId]: e.target.value }))}
                      className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    {row.overrideId && (
                      <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">
                        {t('subjects.overridden')}
                      </span>
                    )}
                  </td>
                  <td className="py-2 space-x-3">
                    <button
                      type="button"
                      disabled={!changed || !(Number(value) > 0)}
                      onClick={() => saveMutation.mutate({ subjectId: row.subjectId, coefficient: Number(value) })}
                      className="text-sm font-medium text-indigo-600 hover:underline disabled:opacity-40 dark:text-indigo-400"
                    >
                      {t('common.save')}
                    </button>
                    {row.overrideId && (
                      <button
                        type="button"
                        onClick={() => resetMutation.mutate(row.overrideId as string)}
                        className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                      >
                        {t('subjects.resetDefault')}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </Card>
  )
}
