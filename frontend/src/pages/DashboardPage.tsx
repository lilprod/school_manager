import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/auth-store'
import AdminDashboard from './dashboards/AdminDashboard'
import ParentDashboard from './dashboards/ParentDashboard'
import StudentDashboard from './dashboards/StudentDashboard'
import TeacherDashboard from './dashboards/TeacherDashboard'

export default function DashboardPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)

  if (!user) return null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
        {t('dashboard.welcomeBack', { name: user.firstName })}
      </h1>

      {user.role === 'ADMIN' && <AdminDashboard />}
      {user.role === 'TEACHER' && <TeacherDashboard />}
      {user.role === 'STUDENT' && <StudentDashboard />}
      {user.role === 'PARENT' && <ParentDashboard />}
    </div>
  )
}
