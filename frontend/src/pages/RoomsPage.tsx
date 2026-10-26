import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { createRoom, deleteRoom, fetchRooms, type CreateRoomPayload } from '../api/rooms'
import { Card } from '../components/Card'

export default function RoomsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const rooms = useQuery({ queryKey: ['rooms'], queryFn: fetchRooms })
  const { register, handleSubmit, reset } = useForm<CreateRoomPayload>()

  const createMutation = useMutation({
    mutationFn: createRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      reset()
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('rooms.title')}</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {t('rooms.create')}
        </button>
      </div>

      {showForm && (
        <Card>
          <form
            onSubmit={handleSubmit((values) =>
              createMutation.mutate({
                ...values,
                capacity: values.capacity ? Number(values.capacity) : undefined,
              }),
            )}
            className="grid grid-cols-1 gap-3 sm:grid-cols-4"
          >
            <input
              placeholder={t('rooms.name') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('name', { required: true })}
            />
            <input
              placeholder={t('rooms.capacity') as string}
              type="number"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('capacity')}
            />
            <input
              placeholder={t('rooms.type') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('type')}
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
            >
              {t('common.save')}
            </button>
          </form>
        </Card>
      )}

      <Card>
        {rooms.data && rooms.data.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('rooms.noRooms')}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="pb-2">{t('rooms.name')}</th>
                <th className="pb-2">{t('rooms.capacity')}</th>
                <th className="pb-2">{t('rooms.type')}</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {rooms.data?.map((room) => (
                <tr key={room.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 text-slate-900 dark:text-white">{room.name}</td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">{room.capacity ?? '-'}</td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">{room.type ?? '-'}</td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(room.id)}
                      className="text-sm font-medium text-red-600 hover:text-red-500"
                    >
                      {t('common.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
