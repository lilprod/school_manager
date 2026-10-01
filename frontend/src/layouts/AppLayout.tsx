import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logoutRequest } from '../api/auth'
import { useDarkMode } from '../hooks/useDarkMode'
import { useAuthStore } from '../stores/auth-store'
import type { Role } from '../types'

interface NavItem {
  to: string
  labelKey: string
  roles: Role[]
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', labelKey: 'nav.dashboard', roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
  { to: '/students', labelKey: 'nav.students', roles: ['ADMIN', 'TEACHER'] },
  { to: '/teachers', labelKey: 'nav.teachers', roles: ['ADMIN'] },
  { to: '/classes', labelKey: 'nav.classes', roles: ['ADMIN'] },
  { to: '/subjects', labelKey: 'nav.subjects', roles: ['ADMIN'] },
  { to: '/attendance', labelKey: 'nav.attendance', roles: ['ADMIN', 'TEACHER'] },
  { to: '/grades', labelKey: 'nav.grades', roles: ['ADMIN', 'TEACHER'] },
]

export function AppLayout() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, refreshToken, clear } = useAuthStore()
  const { isDark, toggle } = useDarkMode()

  const items = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role))

  async function handleLogout() {
    if (refreshToken) {
      await logoutRequest(refreshToken).catch(() => undefined)
    }
    clear()
    navigate('/login', { replace: true })
  }

  function changeLanguage(lng: string) {
    void i18n.changeLanguage(lng)
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="mb-8 px-2 text-lg font-semibold text-slate-900 dark:text-white">{t('app.name')}</h1>
        <nav className="flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {user ? t(`roles.${user.role}`) : null}
          </div>
          <div className="flex items-center gap-3">
            <select
              value={i18n.language.startsWith('en') ? 'en' : 'fr'}
              onChange={(e) => changeLanguage(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="fr">{t('language.fr')}</option>
              <option value="en">{t('language.en')}</option>
            </select>
            <button
              type="button"
              onClick={toggle}
              className="rounded-lg border border-slate-300 px-3 py-1 text-sm dark:border-slate-700 dark:text-white"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <span className="text-sm text-slate-700 dark:text-slate-200">
              {user?.firstName} {user?.lastName}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-slate-900 px-3 py-1 text-sm text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900"
            >
              {t('common.logout')}
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
