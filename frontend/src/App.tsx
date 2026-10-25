import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import AttendancePage from './pages/AttendancePage'
import ClassesPage from './pages/ClassesPage'
import DashboardPage from './pages/DashboardPage'
import GradesPage from './pages/GradesPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import PlatformDashboardPage from './pages/platform/PlatformDashboardPage'
import PlatformPlansPage from './pages/platform/PlatformPlansPage'
import PlatformSchoolDetailPage from './pages/platform/PlatformSchoolDetailPage'
import PlatformSchoolsListPage from './pages/platform/PlatformSchoolsListPage'
import StudentsPage from './pages/StudentsPage'
import SubjectsPage from './pages/SubjectsPage'
import TeachersPage from './pages/TeachersPage'
import { ProtectedRoute } from './routes/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/students"
          element={
            <ProtectedRoute roles={['ADMIN', 'TEACHER']}>
              <StudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <TeachersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/classes"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <ClassesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subjects"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <SubjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute roles={['ADMIN', 'TEACHER']}>
              <AttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/grades"
          element={
            <ProtectedRoute roles={['ADMIN', 'TEACHER']}>
              <GradesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/platform/dashboard"
          element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <PlatformDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/platform/schools"
          element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <PlatformSchoolsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/platform/schools/:id"
          element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <PlatformSchoolDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/platform/plans"
          element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <PlatformPlansPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
