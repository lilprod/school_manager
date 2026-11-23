import { api } from '../lib/api'

export interface MentionThresholds {
  congratulationsMin: number
  encouragementsMin: number
  honorRollMin: number
  warningBelow: number
}

export interface GradingSettings extends MentionThresholds {
  isCustom: boolean
}

export async function fetchGradingSettings(): Promise<GradingSettings> {
  const { data } = await api.get<GradingSettings>('/grading-settings')
  return data
}

export async function updateGradingSettings(payload: MentionThresholds): Promise<GradingSettings> {
  const { data } = await api.put<GradingSettings>('/grading-settings', payload)
  return data
}

export async function resetGradingSettings(): Promise<GradingSettings> {
  const { data } = await api.delete<GradingSettings>('/grading-settings')
  return data
}

/** Même règle de cohérence que le backend ; renvoie une clé i18n ou null si valide. */
export function thresholdsError(t: MentionThresholds): string | null {
  const values = [t.warningBelow, t.honorRollMin, t.encouragementsMin, t.congratulationsMin]
  if (values.some((v) => !Number.isFinite(v) || v < 0 || v > 20)) {
    return 'gradingSettings.errorRange'
  }
  if (!(t.warningBelow <= t.honorRollMin && t.honorRollMin < t.encouragementsMin && t.encouragementsMin < t.congratulationsMin)) {
    return 'gradingSettings.errorOrder'
  }
  return null
}
