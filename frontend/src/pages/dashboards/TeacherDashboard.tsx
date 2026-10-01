import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card } from '../../components/Card'

export default function TeacherDashboard() {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Link to="/attendance">
        <Card className="transition hover:border-indigo-400">
          <p className="text-lg font-medium text-slate-900 dark:text-white">{t('nav.attendance')}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('attendance.markAttendance')}</p>
        </Card>
      </Link>
      <Link to="/grades">
        <Card className="transition hover:border-indigo-400">
          <p className="text-lg font-medium text-slate-900 dark:text-white">{t('nav.grades')}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('grades.title')}</p>
        </Card>
      </Link>
    </div>
  )
}
