import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { fetchAcademicYears, fetchClassGroups, fetchSubjects } from '../api/academic'
import {
  createExamSession,
  createExamSlot,
  deleteExamSession,
  deleteExamSlot,
  fetchExamSessions,
  fetchExamSlots,
  fetchStudentExams,
  type CreateExamSlotPayload,
} from '../api/exams'
import { fetchRooms } from '../api/rooms'
import { fetchMyChildren, fetchMyStudentProfile } from '../api/students'
import { fetchTeachers } from '../api/teachers'
import { fetchTerms } from '../api/terms'
import { Card } from '../components/Card'
import { useAuthStore } from '../stores/auth-store'
import type { ExamSlot } from '../types'

interface SessionForm {
  name: string
  termId: string
  startDate: string
  endDate: string
}

const inputClass =
  'rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white'

function errorMessage(error: unknown, fallback: string): string | null {
  if (!error) return null
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: string | string[] } | undefined)?.message
    return Array.isArray(message) ? message.join(', ') : (message ?? fallback)
  }
  return fallback
}

function SlotsTable({ slots, onDelete }: { slots: ExamSlot[]; onDelete?: (id: string) => void }) {
  const { t } = useTranslation()
  if (slots.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{t('exams.noSlots')}</p>
  }
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="text-slate-500 dark:text-slate-400">
          <th className="pb-2">{t('exams.date')}</th>
          <th className="pb-2">{t('exams.time')}</th>
          <th className="pb-2">{t('students.class')}</th>
          <th className="pb-2">{t('grades.subject')}</th>
          <th className="pb-2">{t('exams.room')}</th>
          <th className="pb-2">{t('exams.supervisor')}</th>
          {onDelete && <th className="pb-2">{t('common.actions')}</th>}
        </tr>
      </thead>
      <tbody>
        {slots.map((slot) => (
          <tr key={slot.id} className="border-t border-slate-100 dark:border-slate-800">
            <td className="py-2 text-slate-900 dark:text-white">{slot.date.slice(0, 10)}</td>
            <td className="py-2 text-slate-700 dark:text-slate-300">
              {slot.startTime} – {slot.endTime}
            </td>
            <td className="py-2 text-slate-700 dark:text-slate-300">{slot.classGroup?.name}</td>
            <td className="py-2 text-slate-700 dark:text-slate-300">{slot.subject?.name}</td>
            <td className="py-2 text-slate-700 dark:text-slate-300">{slot.room?.name ?? '—'}</td>
            <td className="py-2 text-slate-700 dark:text-slate-300">
              {slot.supervisor ? `${slot.supervisor.user.firstName} ${slot.supervisor.user.lastName}` : '—'}
            </td>
            {onDelete && (
              <td className="py-2">
                <button
                  type="button"
                  onClick={() => onDelete(slot.id)}
                  className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                >
                  {t('common.delete')}
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function StudentExams({ studentId }: { studentId: string }) {
  const { t } = useTranslation()
  const exams = useQuery({ queryKey: ['student-exams', studentId], queryFn: () => fetchStudentExams(studentId) })
  return (
    <Card>
      {exams.data && exams.data.length > 0 ? (
        <div className="space-y-4">
          {Array.from(new Set(exams.data.map((s) => s.sessionId))).map((sessionId) => {
            const slots = exams.data.filter((s) => s.sessionId === sessionId)
            return (
              <div key={sessionId}>
                <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  {slots[0].session?.name}
                </p>
                <SlotsTable slots={slots} />
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('exams.noSlots')}</p>
      )}
    </Card>
  )
}

function StaffView({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [showSlotForm, setShowSlotForm] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [classFilter, setClassFilter] = useState('')

  const years = useQuery({ queryKey: ['academic-years'], queryFn: fetchAcademicYears })
  const currentYear = years.data?.find((y) => y.isCurrent) ?? years.data?.[0]
  const sessions = useQuery({ queryKey: ['exam-sessions'], queryFn: () => fetchExamSessions() })
  const selectedSession = sessions.data?.find((s) => s.id === sessionId) ?? sessions.data?.[0]
  const terms = useQuery({
    queryKey: ['terms', currentYear?.id],
    queryFn: () => fetchTerms(currentYear!.id),
    enabled: !!currentYear && isAdmin,
  })
  const classGroups = useQuery({ queryKey: ['class-groups'], queryFn: fetchClassGroups })
  const subjects = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects, enabled: isAdmin })
  const rooms = useQuery({ queryKey: ['rooms'], queryFn: fetchRooms, enabled: isAdmin })
  const teachers = useQuery({ queryKey: ['teachers'], queryFn: fetchTeachers, enabled: isAdmin })

  const slots = useQuery({
    queryKey: ['exam-slots', selectedSession?.id, classFilter],
    queryFn: () => fetchExamSlots(selectedSession!.id, classFilter || undefined),
    enabled: !!selectedSession,
  })

  const sessionForm = useForm<SessionForm>()
  const slotForm = useForm<CreateExamSlotPayload>()

  const createSession = useMutation({
    mutationFn: (values: SessionForm) =>
      createExamSession({
        name: values.name,
        academicYearId: currentYear!.id,
        termId: values.termId || undefined,
        startDate: values.startDate,
        endDate: values.endDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-sessions'] })
      sessionForm.reset()
      setShowSessionForm(false)
    },
  })

  const removeSession = useMutation({
    mutationFn: deleteExamSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-sessions'] })
      setSessionId('')
    },
  })

  const createSlot = useMutation({
    mutationFn: (values: CreateExamSlotPayload) => createExamSlot(selectedSession!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-slots'] })
      slotForm.reset()
    },
  })

  const removeSlot = useMutation({
    mutationFn: deleteExamSlot,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exam-slots'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedSession?.id ?? ''}
          onChange={(e) => setSessionId(e.target.value)}
          className={`${inputClass} bg-white`}
        >
          {sessions.data?.length === 0 && <option value="">{t('exams.noSessions')}</option>}
          {sessions.data?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className={`${inputClass} bg-white`}>
          <option value="">{t('exams.allClasses')}</option>
          {classGroups.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {isAdmin && (
          <>
            <button
              type="button"
              onClick={() => setShowSessionForm((v) => !v)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              {t('exams.createSession')}
            </button>
            {selectedSession && (
              <button
                type="button"
                onClick={() => removeSession.mutate(selectedSession.id)}
                className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
              >
                {t('exams.deleteSession')}
              </button>
            )}
          </>
        )}
      </div>

      {isAdmin && showSessionForm && (
        <Card>
          <form
            onSubmit={sessionForm.handleSubmit((values) => createSession.mutate(values))}
            className="grid grid-cols-1 gap-3 sm:grid-cols-5"
          >
            <input
              placeholder={t('exams.sessionName') as string}
              className={inputClass}
              {...sessionForm.register('name', { required: true })}
            />
            <select className={inputClass} {...sessionForm.register('termId')}>
              <option value="">{t('terms.noTerm')}</option>
              {terms.data?.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>
            <input type="date" className={inputClass} {...sessionForm.register('startDate', { required: true })} />
            <input type="date" className={inputClass} {...sessionForm.register('endDate', { required: true })} />
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
            >
              {t('common.save')}
            </button>
          </form>
          {errorMessage(createSession.error, t('common.error') as string) && (
            <p className="mt-3 text-sm text-red-600">{errorMessage(createSession.error, t('common.error') as string)}</p>
          )}
        </Card>
      )}

      {selectedSession && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {selectedSession.name} — {selectedSession.startDate.slice(0, 10)} → {selectedSession.endDate.slice(0, 10)}
            </p>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowSlotForm((v) => !v)}
                className="rounded-lg bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-500"
              >
                {t('exams.createSlot')}
              </button>
            )}
          </div>

          {isAdmin && showSlotForm && (
            <div className="mb-4">
              <form
                onSubmit={slotForm.handleSubmit((values) =>
                  createSlot.mutate({
                    ...values,
                    roomId: values.roomId || undefined,
                    supervisorId: values.supervisorId || undefined,
                  }),
                )}
                className="grid grid-cols-1 gap-3 sm:grid-cols-4"
              >
                <select className={inputClass} {...slotForm.register('classGroupId', { required: true })}>
                  <option value="">{t('students.class')}</option>
                  {classGroups.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select className={inputClass} {...slotForm.register('subjectId', { required: true })}>
                  <option value="">{t('grades.subject')}</option>
                  {subjects.data?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <input type="date" className={inputClass} {...slotForm.register('date', { required: true })} />
                <div className="flex gap-2">
                  <input type="time" className={`${inputClass} w-full`} {...slotForm.register('startTime', { required: true })} />
                  <input type="time" className={`${inputClass} w-full`} {...slotForm.register('endTime', { required: true })} />
                </div>
                <select className={inputClass} {...slotForm.register('roomId')}>
                  <option value="">{t('exams.room')}</option>
                  {rooms.data?.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <select className={inputClass} {...slotForm.register('supervisorId')}>
                  <option value="">{t('exams.supervisor')}</option>
                  {teachers.data?.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.user.firstName} {teacher.user.lastName}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
                >
                  {t('common.save')}
                </button>
              </form>
              {errorMessage(createSlot.error, t('common.error') as string) && (
                <p className="mt-3 text-sm text-red-600">{errorMessage(createSlot.error, t('common.error') as string)}</p>
              )}
            </div>
          )}

          <SlotsTable slots={slots.data ?? []} onDelete={isAdmin ? (id) => removeSlot.mutate(id) : undefined} />
        </Card>
      )}
    </div>
  )
}

function ParentView() {
  const { t } = useTranslation()
  const children = useQuery({ queryKey: ['students', 'my-children'], queryFn: fetchMyChildren })
  const [childId, setChildId] = useState('')
  const child = children.data?.find((c) => c.id === childId) ?? children.data?.[0]

  return (
    <div className="space-y-6">
      {children.data && children.data.length > 1 && (
        <select value={child?.id} onChange={(e) => setChildId(e.target.value)} className={`${inputClass} bg-white`}>
          {children.data.map((c) => (
            <option key={c.id} value={c.id}>
              {c.user.firstName} {c.user.lastName}
            </option>
          ))}
        </select>
      )}
      {child ? <StudentExams studentId={child.id} /> : <p className="text-sm text-slate-500">{t('common.noData')}</p>}
    </div>
  )
}

function StudentView() {
  const profile = useQuery({ queryKey: ['students', 'me'], queryFn: fetchMyStudentProfile })
  return profile.data ? <StudentExams studentId={profile.data.id} /> : null
}

export default function ExamsPage() {
  const { t } = useTranslation()
  const role = useAuthStore((s) => s.user?.role)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('exams.title')}</h1>
      {(role === 'ADMIN' || role === 'TEACHER') && <StaffView isAdmin={role === 'ADMIN'} />}
      {role === 'STUDENT' && <StudentView />}
      {role === 'PARENT' && <ParentView />}
    </div>
  )
}
