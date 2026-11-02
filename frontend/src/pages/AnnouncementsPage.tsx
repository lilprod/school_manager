import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { fetchClassGroups } from '../api/academic'
import {
  createAnnouncement,
  deleteAnnouncement,
  fetchAnnouncements,
  type CreateAnnouncementPayload,
} from '../api/announcements'
import { Card } from '../components/Card'
import { useAuthStore } from '../stores/auth-store'
import type { AnnouncementAudience } from '../types'

const AUDIENCES: AnnouncementAudience[] = ['ALL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT']

export default function AnnouncementsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [showForm, setShowForm] = useState(false)

  const canCreate = user?.role === 'ADMIN' || user?.role === 'TEACHER'
  const canDelete = user?.role === 'ADMIN'

  const announcements = useQuery({
    queryKey: ['announcements', user?.role],
    queryFn: fetchAnnouncements,
    enabled: !!user,
  })
  const classGroups = useQuery({
    queryKey: ['class-groups'],
    queryFn: fetchClassGroups,
    enabled: canCreate,
  })

  const { register, handleSubmit, reset } = useForm<CreateAnnouncementPayload>()

  const createMutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      reset()
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('announcements.title')}</h1>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            {t('announcements.create')}
          </button>
        )}
      </div>

      {canCreate && showForm && (
        <Card>
          <form
            onSubmit={handleSubmit((values) =>
              createMutation.mutate({ ...values, classGroupId: values.classGroupId || undefined }),
            )}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <input
              placeholder={t('announcements.titleField') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:col-span-2"
              {...register('title', { required: true })}
            />
            <textarea
              placeholder={t('announcements.content') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:col-span-2"
              {...register('content', { required: true })}
            />
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('audience')}
            >
              {AUDIENCES.map((audience) => (
                <option key={audience} value={audience}>
                  {t(`announcements.audience.${audience}`)}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('classGroupId')}
            >
              <option value="">{t('announcements.allClasses')}</option>
              {classGroups.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900 sm:col-span-2"
            >
              {t('common.save')}
            </button>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {announcements.data && announcements.data.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('announcements.noAnnouncements')}</p>
          </Card>
        ) : (
          announcements.data?.map((announcement) => (
            <Card key={announcement.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{announcement.title}</h2>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{announcement.content}</p>
                  <div className="mt-2 flex gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>{t(`announcements.audience.${announcement.audience}`)}</span>
                    {announcement.school && <span>{announcement.school.name}</span>}
                    {announcement.classGroup && <span>{announcement.classGroup.name}</span>}
                    <span>{new Date(announcement.publishedAt).toLocaleString()}</span>
                  </div>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(announcement.id)}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
                  >
                    {t('common.delete')}
                  </button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
