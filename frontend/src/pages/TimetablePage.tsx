import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { fetchAcademicYears, fetchClassGroups, fetchSubjects } from '../api/academic'
import { fetchRooms } from '../api/rooms'
import { fetchTeachers } from '../api/teachers'
import { createTimetableSlot, deleteTimetableSlot, fetchTimetable } from '../api/timetable'
import { Card } from '../components/Card'
import type { TimetableSlot } from '../types'

interface FormValues {
  subjectId: string
  teacherId: string
  roomId?: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

const DAYS = [1, 2, 3, 4, 5, 6, 7]

export default function TimetablePage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [classGroupId, setClassGroupId] = useState('')
  const [academicYearId, setAcademicYearId] = useState('')

  const classGroups = useQuery({ queryKey: ['class-groups'], queryFn: fetchClassGroups })
  const academicYears = useQuery({ queryKey: ['academic-years'], queryFn: fetchAcademicYears })
  const subjects = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects })
  const teachers = useQuery({ queryKey: ['teachers'], queryFn: fetchTeachers })
  const rooms = useQuery({ queryKey: ['rooms'], queryFn: fetchRooms })

  const timetable = useQuery({
    queryKey: ['timetable', classGroupId, academicYearId],
    queryFn: () => fetchTimetable({ classGroupId, academicYearId }),
    enabled: !!classGroupId && !!academicYearId,
  })

  const { register, handleSubmit, reset } = useForm<FormValues>()

  const createMutation = useMutation({
    mutationFn: createTimetableSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable', classGroupId, academicYearId] })
      reset()
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTimetableSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable', classGroupId, academicYearId] })
    },
  })

  const slotsByDay = useMemo(() => {
    const map = new Map<number, TimetableSlot[]>()
    for (const slot of timetable.data ?? []) {
      const list = map.get(slot.dayOfWeek) ?? []
      list.push(slot)
      map.set(slot.dayOfWeek, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime))
    }
    return map
  }, [timetable.data])

  function onSubmit(values: FormValues) {
    if (!classGroupId || !academicYearId) return
    createMutation.mutate({
      classGroupId,
      academicYearId,
      subjectId: values.subjectId,
      teacherId: values.teacherId,
      roomId: values.roomId || undefined,
      dayOfWeek: Number(values.dayOfWeek),
      startTime: values.startTime,
      endTime: values.endTime,
    })
  }

  const canCreate = !!classGroupId && !!academicYearId

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('timetable.title')}</h1>
        <button
          type="button"
          disabled={!canCreate}
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {t('timetable.create')}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={classGroupId}
          onChange={(e) => setClassGroupId(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="">{t('timetable.selectClass')}</option>
          {classGroups.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={academicYearId}
          onChange={(e) => setAcademicYearId(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="">{t('timetable.selectYear')}</option>
          {academicYears.data?.map((y) => (
            <option key={y.id} value={y.id}>
              {y.label}
            </option>
          ))}
        </select>
      </div>

      {showForm && canCreate && (
        <Card>
          {createMutation.isError && (
            <p className="mb-3 text-sm text-red-600">
              {(createMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                t('timetable.conflictError')}
            </p>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('subjectId', { required: true })}
            >
              <option value="">{t('timetable.subject')}</option>
              {subjects.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('teacherId', { required: true })}
            >
              <option value="">{t('timetable.teacher')}</option>
              {teachers.data?.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.user.firstName} {teacher.user.lastName}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('roomId')}
            >
              <option value="">{t('timetable.room')}</option>
              {rooms.data?.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('dayOfWeek', { required: true, valueAsNumber: true })}
            >
              <option value="">{t('timetable.dayOfWeek')}</option>
              {DAYS.map((day) => (
                <option key={day} value={day}>
                  {t(`timetable.day${day}`)}
                </option>
              ))}
            </select>
            <input
              type="time"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('startTime', { required: true })}
            />
            <input
              type="time"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('endTime', { required: true })}
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

      {canCreate && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DAYS.map((day) => (
            <Card key={day}>
              <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">{t(`timetable.day${day}`)}</h2>
              {(slotsByDay.get(day) ?? []).length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('timetable.noSlots')}</p>
              ) : (
                <ul className="space-y-2">
                  {(slotsByDay.get(day) ?? []).map((slot) => (
                    <li
                      key={slot.id}
                      className="rounded-lg border border-slate-100 p-2 text-sm dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(slot.id)}
                          className="text-xs font-medium text-red-600 hover:text-red-500"
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{slot.subject?.name}</p>
                      <p className="text-slate-500 dark:text-slate-400">
                        {slot.teacher?.user.firstName} {slot.teacher?.user.lastName}
                        {slot.room?.name ? ` · ${slot.room.name}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
