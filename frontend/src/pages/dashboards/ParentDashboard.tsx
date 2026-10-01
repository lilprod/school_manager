import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchAcademicYears } from '../../api/academic'
import { fetchStudentAttendanceSummary } from '../../api/attendance'
import { fetchReportCard } from '../../api/grading'
import { fetchMyChildren } from '../../api/students'
import { Card, StatCard } from '../../components/Card'

export default function ParentDashboard() {
  const { t } = useTranslation()
  const children = useQuery({ queryKey: ['students', 'my-children'], queryFn: fetchMyChildren })
  const years = useQuery({ queryKey: ['academic-years'], queryFn: fetchAcademicYears })
  const currentYear = years.data?.find((y) => y.isCurrent) ?? years.data?.[0]

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const selectedChild = children.data?.find((c) => c.id === selectedId) ?? children.data?.[0]

  const summary = useQuery({
    queryKey: ['attendance', 'summary', selectedChild?.id],
    queryFn: () => fetchStudentAttendanceSummary(selectedChild!.id),
    enabled: !!selectedChild,
  })

  const reportCard = useQuery({
    queryKey: ['report-card', selectedChild?.id, currentYear?.id],
    queryFn: () => fetchReportCard(selectedChild!.id, currentYear!.id),
    enabled: !!selectedChild && !!currentYear,
  })

  if (children.data && children.data.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{t('common.noData')}</p>
  }

  return (
    <div className="space-y-6">
      {children.data && children.data.length > 1 && (
        <select
          value={selectedChild?.id}
          onChange={(e) => setSelectedId(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          {children.data.map((child) => (
            <option key={child.id} value={child.id}>
              {child.user.firstName} {child.user.lastName}
            </option>
          ))}
        </select>
      )}

      {selectedChild && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label={t('dashboard.overallAverage')}
            value={reportCard.data ? `${reportCard.data.overallAverage}/20` : '—'}
          />
          <Card>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.myAttendance')}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {summary.data?.map((entry) => (
                <span
                  key={entry.status}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {t(`attendance.${entry.status}`)}: {entry.count}
                </span>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
