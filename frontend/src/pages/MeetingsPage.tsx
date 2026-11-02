import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { cancelMeeting, completeMeeting, confirmMeeting, fetchMeetings } from '../api/meetings'
import { Card } from '../components/Card'
import { useAuthStore } from '../stores/auth-store'
import type { MeetingStatus } from '../types'

const STATUS_STYLES: Record<MeetingStatus, string> = {
  REQUESTED: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  CONFIRMED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  COMPLETED: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
}

export default function MeetingsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const canManage = user?.role === 'TEACHER' || user?.role === 'ADMIN'

  const meetings = useQuery({ queryKey: ['meetings'], queryFn: fetchMeetings })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['meetings'] })

  const confirmMutation = useMutation({ mutationFn: confirmMeeting, onSuccess: invalidate })
  const cancelMutation = useMutation({ mutationFn: cancelMeeting, onSuccess: invalidate })
  const completeMutation = useMutation({ mutationFn: completeMeeting, onSuccess: invalidate })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('meetings.title')}</h1>

      <div className="space-y-4">
        {meetings.data && meetings.data.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('meetings.noMeetings')}</p>
          </Card>
        ) : (
          meetings.data?.map((meeting) => {
            const teacherName = meeting.teacher
              ? `${meeting.teacher.user.firstName} ${meeting.teacher.user.lastName}`
              : meeting.teacherId
            const studentName = meeting.student
              ? `${meeting.student.user.firstName} ${meeting.student.user.lastName}`
              : meeting.studentId

            return (
              <Card key={meeting.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {t('meetings.with', { name: teacherName })}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {t('meetings.about', { name: studentName })}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(meeting.scheduledAt).toLocaleString()}
                    </p>
                    {meeting.notes && (
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{meeting.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[meeting.status]}`}>
                      {t(`meetings.status.${meeting.status}`)}
                    </span>
                    {canManage && (
                      <div className="flex gap-2">
                        {meeting.status === 'REQUESTED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => confirmMutation.mutate(meeting.id)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                            >
                              {t('meetings.confirm')}
                            </button>
                            <button
                              type="button"
                              onClick={() => cancelMutation.mutate(meeting.id)}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
                            >
                              {t('meetings.cancel')}
                            </button>
                          </>
                        )}
                        {meeting.status === 'CONFIRMED' && (
                          <button
                            type="button"
                            onClick={() => completeMutation.mutate(meeting.id)}
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-900"
                          >
                            {t('meetings.complete')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
