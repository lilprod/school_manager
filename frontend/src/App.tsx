import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import AnnouncementsPage from './pages/AnnouncementsPage'
import AssignmentsPage from './pages/AssignmentsPage'
import AttendancePage from './pages/AttendancePage'
import ClassesPage from './pages/ClassesPage'
import DashboardPage from './pages/DashboardPage'
import ExpensesPage from './pages/ExpensesPage'
import FeeStructuresPage from './pages/FeeStructuresPage'
import GradesPage from './pages/GradesPage'
import InvoicesPage from './pages/InvoicesPage'
import LessonPlansPage from './pages/LessonPlansPage'
import LoginPage from './pages/LoginPage'
import MeetingsPage from './pages/MeetingsPage'
import MessagesPage from './pages/MessagesPage'
import SignupPage from './pages/SignupPage'
import PlatformDashboardPage from './pages/platform/PlatformDashboardPage'
import PlatformPlansPage from './pages/platform/PlatformPlansPage'
import PlatformSchoolDetailPage from './pages/platform/PlatformSchoolDetailPage'
import PlatformSchoolsListPage from './pages/platform/PlatformSchoolsListPage'
import ReportsPage from './pages/ReportsPage'
import RoomsPage from './pages/RoomsPage'
import StaffAttendancePage from './pages/StaffAttendancePage'
import StudentsPage from './pages/StudentsPage'
import SubjectsPage from './pages/SubjectsPage'
import SyllabiPage from './pages/SyllabiPage'
import TeachersPage from './pages/TeachersPage'
import TimetablePage from './pages/TimetablePage'
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
        <Route
          path="/rooms"
          element={
            <ProtectedRoute roles={['ADMIN', 'TEACHER']}>
              <RoomsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/timetable"
          element={
            <ProtectedRoute roles={['ADMIN', 'TEACHER', 'STUDENT']}>
              <TimetablePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff-attendance"
          element={
            <ProtectedRoute roles={['ADMIN', 'TEACHER']}>
              <StaffAttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/syllabi"
          element={
            <ProtectedRoute roles={['ADMIN', 'TEACHER']}>
              <SyllabiPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lesson-plans"
          element={
            <ProtectedRoute roles={['ADMIN', 'TEACHER']}>
              <LessonPlansPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments"
          element={
            <ProtectedRoute roles={['ADMIN', 'TEACHER', 'STUDENT']}>
              <AssignmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute roles={['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']}>
              <MessagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/announcements"
          element={
            <ProtectedRoute roles={['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']}>
              <AnnouncementsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/meetings"
          element={
            <ProtectedRoute roles={['ADMIN', 'TEACHER', 'PARENT']}>
              <MeetingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fee-structures"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <FeeStructuresPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <InvoicesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <ExpensesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
