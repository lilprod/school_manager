import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  fetchGradingSettings,
  resetGradingSettings,
  thresholdsError,
  updateGradingSettings,
  type MentionThresholds,
} from '../api/gradingSettings'
import { Card } from '../components/Card'

const FIELDS: { key: keyof MentionThresholds; label: string; hint: string }[] = [
  { key: 'congratulationsMin', label: 'gradingSettings.congratulations', hint: 'gradingSettings.atLeast' },
  { key: 'encouragementsMin', label: 'gradingSettings.encouragements', hint: 'gradingSettings.atLeast' },
  { key: 'honorRollMin', label: 'gradingSettings.honorRoll', hint: 'gradingSettings.atLeast' },
  { key: 'warningBelow', label: 'gradingSettings.warning', hint: 'gradingSettings.below' },
]

export default function GradingSettingsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<Partial<Record<keyof MentionThresholds, string>>>({})

  const settings = useQuery({ queryKey: ['grading-settings'], queryFn: fetchGradingSettings })

  const onSaved = () => {
    setDraft({})
    queryClient.invalidateQueries({ queryKey: ['grading-settings'] })
    queryClient.invalidateQueries({ queryKey: ['report-card'] })
  }
  const saveMutation = useMutation({ mutationFn: updateGradingSettings, onSuccess: onSaved })
  const resetMutation = useMutation({ mutationFn: resetGradingSettings, onSuccess: onSaved })

  if (!settings.data) {
    return null
  }

  const current: MentionThresholds = {
    congratulationsMin: Number(draft.congratulationsMin ?? settings.data.congratulationsMin),
    encouragementsMin: Number(draft.encouragementsMin ?? settings.data.encouragementsMin),
    honorRollMin: Number(draft.honorRollMin ?? settings.data.honorRollMin),
    warningBelow: Number(draft.warningBelow ?? settings.data.warningBelow),
  }
  const error = thresholdsError(current)
  const changed = Object.keys(draft).length > 0
  const serverError =
    saveMutation.error && isAxiosError(saveMutation.error)
      ? (saveMutation.error.response?.data as { message?: string } | undefined)?.message
      : null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('gradingSettings.title')}</h1>

      <Card>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('gradingSettings.hint')}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {settings.data.isCustom ? t('gradingSettings.custom') : t('gradingSettings.defaults')}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <label key={field.key} className="block text-sm text-slate-700 dark:text-slate-300">
              <span className="font-medium">{t(field.label)}</span>
              <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">({t(field.hint)})</span>
              <input
                type="number"
                min={0}
                max={20}
                step={0.5}
                value={draft[field.key] ?? String(settings.data[field.key])}
                onChange={(e) => setDraft((prev) => ({ ...prev, [field.key]: e.target.value }))}
                className="mt-1 block w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{t(error)}</p>}
        {serverError && <p className="mt-4 text-sm text-red-600">{serverError}</p>}

        <div className="mt-4 flex items-center gap-4">
          <button
            type="button"
            disabled={!changed || !!error || saveMutation.isPending}
            onClick={() => saveMutation.mutate(current)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {t('common.save')}
          </button>
          {settings.data.isCustom && (
            <button
              type="button"
              onClick={() => resetMutation.mutate()}
              className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
            >
              {t('gradingSettings.reset')}
            </button>
          )}
        </div>
      </Card>

      <Card>
        <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">{t('gradingSettings.preview')}</p>
        <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
          <li>
            {t('gradingSettings.rangeFrom', { value: current.congratulationsMin })} → {t('grades.mention.CONGRATULATIONS')}
          </li>
          <li>
            {t('gradingSettings.rangeBetween', { min: current.encouragementsMin, max: current.congratulationsMin })} →{' '}
            {t('grades.mention.ENCOURAGEMENTS')}
          </li>
          <li>
            {t('gradingSettings.rangeBetween', { min: current.honorRollMin, max: current.encouragementsMin })} →{' '}
            {t('grades.mention.HONOR_ROLL')}
          </li>
          <li>
            {t('gradingSettings.rangeBetween', { min: current.warningBelow, max: current.honorRollMin })} →{' '}
            {t('gradingSettings.noMention')}
          </li>
          <li>
            {t('gradingSettings.rangeBelow', { value: current.warningBelow })} → {t('grades.mention.WARNING')}
          </li>
        </ul>
      </Card>
    </div>
  )
}
