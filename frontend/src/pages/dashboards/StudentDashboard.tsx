import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchAcademicYears } from '../../api/academic'
import { fetchStudentAttendanceSummary } from '../../api/attendance'
import { fetchReportCard } from '../../api/grading'
import { fetchMyStudentProfile } from '../../api/students'
import { Card, StatCard } from '../../components/Card'

export default function StudentDashboard() {
  const { t } = useTranslation()

  const profile = useQuery({ queryKey: ['students', 'me'], queryFn: fetchMyStudentProfile })
  const years = useQuery({ queryKey: ['academic-years'], queryFn: fetchAcademicYears })
  const currentYear = years.data?.find((y) => y.isCurrent) ?? years.data?.[0]

  const summary = useQuery({
    queryKey: ['attendance', 'summary', profile.data?.id],
    queryFn: () => fetchStudentAttendanceSummary(profile.data!.id),
    enabled: !!profile.data,
  })

  const reportCard = useQuery({
    queryKey: ['report-card', profile.data?.id, currentYear?.id],
    queryFn: () => fetchReportCard(profile.data!.id, currentYear!.id),
    enabled: !!profile.data && !!currentYear,
  })

  const enrollment = profile.data?.enrollments[0]

  return (
    <div className="space-y-6">
      {enrollment && (
        <Card>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('students.class')}</p>
          <p className="mt-1 text-lg font-medium text-slate-900 dark:text-white">{enrollment.classGroup.name}</p>
        </Card>
      )}

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

      {reportCard.data && reportCard.data.subjects.length > 0 && (
        <Card>
          <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">{t('grades.reportCard')}</p>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="pb-2">{t('grades.subject')}</th>
                <th className="pb-2">{t('grades.average')}</th>
              </tr>
            </thead>
            <tbody>
              {reportCard.data.subjects.map((s) => (
                <tr key={s.subjectId} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 text-slate-900 dark:text-white">{s.subjectName}</td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">{s.average}/20</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
