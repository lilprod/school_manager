import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchTeachers } from '../api/teachers'
import {
  fetchStaffAttendance,
  fetchStaffAttendanceSummary,
  markStaffAttendance,
} from '../api/staffAttendance'
import { Card } from '../components/Card'
import { useAuthStore } from '../stores/auth-store'
import type { AttendanceStatus } from '../types'

const STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function StaffAttendancePage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'ADMIN'

  const [teacherId, setTeacherId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const [markTeacherId, setMarkTeacherId] = useState('')
  const [markDate, setMarkDate] = useState(todayIso())
  const [markStatus, setMarkStatus] = useState<AttendanceStatus>('PRESENT')
  const [markNote, setMarkNote] = useState('')

  const teachers = useQuery({ queryKey: ['teachers'], queryFn: fetchTeachers, enabled: isAdmin })

  const records = useQuery({
    queryKey: ['staff-attendance', teacherId, from, to],
    queryFn: () => fetchStaffAttendance({ teacherId: teacherId || undefined, from: from || undefined, to: to || undefined }),
  })

  const ownTeacherId = useMemo(() => {
    if (isAdmin) return undefined
    return records.data?.[0]?.teacherId
  }, [isAdmin, records.data])

  const summaryTeacherId = isAdmin ? teacherId : ownTeacherId

  const summary = useQuery({
    queryKey: ['staff-attendance-summary', summaryTeacherId],
    queryFn: () => fetchStaffAttendanceSummary(summaryTeacherId as string),
    enabled: !!summaryTeacherId,
  })

  const mutation = useMutation({
    mutationFn: markStaffAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-attendance'] })
      queryClient.invalidateQueries({ queryKey: ['staff-attendance-summary'] })
      setMarkNote('')
    },
  })

  function handleMarkSubmit() {
    if (!markTeacherId || !markDate) return
    mutation.mutate({ teacherId: markTeacherId, date: markDate, status: markStatus, note: markNote || undefined })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('staffAttendance.title')}</h1>

      <div className="flex flex-wrap gap-3">
        {isAdmin && (
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="">{t('staffAttendance.allTeachers')}</option>
            {teachers.data?.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.user.firstName} {teacher.user.lastName}
              </option>
            ))}
          </select>
        )}
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          aria-label={t('staffAttendance.from')}
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          aria-label={t('staffAttendance.to')}
        />
      </div>

      {summary.data && summary.data.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {summary.data.map((entry) => (
            <Card key={entry.status}>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t(`attendance.${entry.status}`)}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{entry.count}</p>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="pb-2">{t('teachers.title')}</th>
              <th className="pb-2">{t('attendance.status')}</th>
              <th className="pb-2">{t('staffAttendance.date')}</th>
              <th className="pb-2">{t('staffAttendance.note')}</th>
            </tr>
          </thead>
          <tbody>
            {records.data?.map((record) => (
              <tr key={record.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-2 text-slate-900 dark:text-white">
                  {record.teacher ? `${record.teacher.user.firstName} ${record.teacher.user.lastName}` : record.teacherId}
                </td>
                <td className="py-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {t(`attendance.${record.status}`)}
                  </span>
                </td>
                <td className="py-2 text-slate-600 dark:text-slate-300">{record.date.slice(0, 10)}</td>
                <td className="py-2 text-slate-600 dark:text-slate-300">{record.note ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {isAdmin && (
        <Card>
          <h2 className="mb-3 text-lg font-medium text-slate-900 dark:text-white">{t('staffAttendance.markTitle')}</h2>
          <div className="flex flex-wrap items-end gap-3">
            <select
              value={markTeacherId}
              onChange={(e) => setMarkTeacherId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">{t('staffAttendance.selectTeacher')}</option>
              {teachers.data?.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.user.firstName} {teacher.user.lastName}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={markDate}
              onChange={(e) => setMarkDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <div className="flex gap-1">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setMarkStatus(status)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    markStatus === status
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {t(`attendance.${status}`)}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={markNote}
              onChange={(e) => setMarkNote(e.target.value)}
              placeholder={t('staffAttendance.notePlaceholder')}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="button"
              onClick={handleMarkSubmit}
              disabled={mutation.isPending || !markTeacherId}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {t('common.save')}
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
