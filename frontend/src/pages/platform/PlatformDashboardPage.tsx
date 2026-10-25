import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchSchools } from '../../api/platform'
import { StatCard } from '../../components/Card'

export default function PlatformDashboardPage() {
  const { t } = useTranslation()
  const schools = useQuery({ queryKey: ['platform', 'schools'], queryFn: () => fetchSchools() })

  const total = schools.data?.length ?? 0
  const pending = schools.data?.filter((s) => s.status === 'PENDING_APPROVAL').length ?? 0
  const active = schools.data?.filter((s) => s.status === 'ACTIVE').length ?? 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('platform.dashboard')}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t('platform.totalSchools')} value={total} />
        <StatCard label={t('platform.pendingSchools')} value={pending} />
        <StatCard label={t('platform.activeSchools')} value={active} />
      </div>
    </div>
  )
}
