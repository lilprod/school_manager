import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { bulkMarkAttendance, fetchAttendance } from '../api/attendance'
import { fetchClassGroups } from '../api/academic'
import { fetchStudents } from '../api/students'
import { Card } from '../components/Card'
import type { AttendanceStatus } from '../types'

const STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function AttendancePage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const classGroups = useQuery({ queryKey: ['class-groups'], queryFn: fetchClassGroups })
  const [classGroupId, setClassGroupId] = useState('')
  const [date, setDate] = useState(todayIso())
  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({})

  const students = useQuery({
    queryKey: ['students', classGroupId],
    queryFn: () => fetchStudents(classGroupId),
    enabled: !!classGroupId,
  })

  const existing = useQuery({
    queryKey: ['attendance', classGroupId, date],
    queryFn: () => fetchAttendance({ classGroupId, date }),
    enabled: !!classGroupId && !!date,
  })

  const existingByStudent = useMemo(() => {
    const map = new Map<string, AttendanceStatus>()
    for (const record of existing.data ?? []) {
      map.set(record.studentId, record.status)
    }
    return map
  }, [existing.data])

  const mutation = useMutation({
    mutationFn: bulkMarkAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', classGroupId, date] })
      setDraft({})
    },
  })

  function statusFor(studentId: string): AttendanceStatus {
    return draft[studentId] ?? existingByStudent.get(studentId) ?? 'PRESENT'
  }

  function setStatus(studentId: string, status: AttendanceStatus) {
    setDraft((prev) => ({ ...prev, [studentId]: status }))
  }

  function handleSubmit() {
    if (!students.data) return
    const entries = students.data.map((student) => ({
      studentId: student.id,
      status: statusFor(student.id),
    }))
    mutation.mutate({ classGroupId, date, entries })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('attendance.title')}</h1>

      <div className="flex flex-wrap gap-3">
        <select
          value={classGroupId}
          onChange={(e) => setClassGroupId(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="">{t('attendance.selectClass')}</option>
          {classGroups.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      {classGroupId && students.data && (
        <Card>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="pb-2">{t('students.title')}</th>
                <th className="pb-2">{t('attendance.status')}</th>
              </tr>
            </thead>
            <tbody>
              {students.data.map((student) => (
                <tr key={student.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 text-slate-900 dark:text-white">
                    {student.user.firstName} {student.user.lastName}
                  </td>
                  <td className="py-2">
                    <div className="flex gap-1">
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setStatus(student.id, status)}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                            statusFor(student.id) === status
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {t(`attendance.${status}`)}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {t('common.save')}
          </button>
        </Card>
      )}
    </div>
  )
}
