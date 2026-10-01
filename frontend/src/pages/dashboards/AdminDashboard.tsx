import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchMySchool, fetchClassGroups } from '../../api/academic'
import { fetchStudents } from '../../api/students'
import { fetchTeachers } from '../../api/teachers'
import { StatCard, Card } from '../../components/Card'

export default function AdminDashboard() {
  const { t } = useTranslation()

  const school = useQuery({ queryKey: ['school', 'me'], queryFn: fetchMySchool })
  const students = useQuery({ queryKey: ['students'], queryFn: () => fetchStudents() })
  const teachers = useQuery({ queryKey: ['teachers'], queryFn: fetchTeachers })
  const classGroups = useQuery({ queryKey: ['class-groups'], queryFn: fetchClassGroups })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t('dashboard.totalStudents')} value={students.data?.length ?? '—'} />
        <StatCard label={t('dashboard.totalTeachers')} value={teachers.data?.length ?? '—'} />
        <StatCard label={t('dashboard.totalClasses')} value={classGroups.data?.length ?? '—'} />
      </div>

      {school.data && (
        <Card>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.mySchool')}</p>
          <p className="mt-1 text-lg font-medium text-slate-900 dark:text-white">{school.data.name}</p>
          {school.data.address && <p className="text-sm text-slate-500 dark:text-slate-400">{school.data.address}</p>}
        </Card>
      )}
    </div>
  )
}
