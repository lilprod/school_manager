import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ChangeEvent } from 'react'
import { Fragment, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  createContract,
  createEvaluation,
  createTeacher,
  deleteContract,
  fetchContracts,
  fetchEvaluations,
  fetchTeachers,
  uploadTeacherPhoto,
  type CreateContractPayload,
  type CreateEvaluationPayload,
  type CreateTeacherPayload,
} from '../api/teachers'
import { Card } from '../components/Card'

function TeacherDetails({ teacherId }: { teacherId: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showContractForm, setShowContractForm] = useState(false)
  const [showEvaluationForm, setShowEvaluationForm] = useState(false)

  const contracts = useQuery({
    queryKey: ['contracts', teacherId],
    queryFn: () => fetchContracts(teacherId),
  })
  const evaluations = useQuery({
    queryKey: ['evaluations', teacherId],
    queryFn: () => fetchEvaluations(teacherId),
  })

  const photoMutation = useMutation({
    mutationFn: (file: File) => uploadTeacherPhoto(teacherId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teachers'] }),
  })

  const contractForm = useForm<CreateContractPayload>()
  const createContractMutation = useMutation({
    mutationFn: (payload: CreateContractPayload) => createContract(teacherId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', teacherId] })
      contractForm.reset()
      setShowContractForm(false)
    },
  })

  const deleteContractMutation = useMutation({
    mutationFn: (id: string) => deleteContract(teacherId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts', teacherId] }),
  })

  const evaluationForm = useForm<CreateEvaluationPayload>()
  const createEvaluationMutation = useMutation({
    mutationFn: (payload: CreateEvaluationPayload) => createEvaluation(teacherId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations', teacherId] })
      evaluationForm.reset()
      setShowEvaluationForm(false)
    },
  })

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      photoMutation.mutate(file)
    }
    e.target.value = ''
  }

  return (
    <div className="space-y-4 border-t border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
      <label className="inline-block cursor-pointer text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
        {t('teachers.photo')}
        <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handlePhotoChange} />
      </label>

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('contracts.title')}</h3>
          <button
            type="button"
            onClick={() => setShowContractForm((v) => !v)}
            className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {t('contracts.create')}
          </button>
        </div>
        {showContractForm && (
          <form
            onSubmit={contractForm.handleSubmit((values) => createContractMutation.mutate(values))}
            className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-4"
          >
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...contractForm.register('contractType', { required: true })}
            >
              <option value="FULL_TIME">{t('contracts.fullTime')}</option>
              <option value="PART_TIME">{t('contracts.partTime')}</option>
              <option value="FIXED_TERM">{t('contracts.fixedTerm')}</option>
            </select>
            <input
              type="number"
              placeholder={t('contracts.salary') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...contractForm.register('salaryAmount', { required: true, valueAsNumber: true })}
            />
            <input
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...contractForm.register('startDate', { required: true })}
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
            >
              {t('common.save')}
            </button>
          </form>
        )}
        <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
          {contracts.data?.map((c) => (
            <li key={c.id} className="flex items-center justify-between">
              <span>
                {t(`contracts.${c.contractType === 'FULL_TIME' ? 'fullTime' : c.contractType === 'PART_TIME' ? 'partTime' : 'fixedTerm'}`)} —{' '}
                {c.salaryAmount} {c.currency} — {c.startDate.slice(0, 10)}
              </span>
              <button
                type="button"
                onClick={() => deleteContractMutation.mutate(c.id)}
                className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
              >
                {t('common.delete')}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('evaluations.title')}</h3>
          <button
            type="button"
            onClick={() => setShowEvaluationForm((v) => !v)}
            className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {t('evaluations.create')}
          </button>
        </div>
        {showEvaluationForm && (
          <form
            onSubmit={evaluationForm.handleSubmit((values) => createEvaluationMutation.mutate(values))}
            className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3"
          >
            <input
              type="number"
              step="0.1"
              placeholder={t('evaluations.score') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...evaluationForm.register('score', { required: true, valueAsNumber: true })}
            />
            <input
              placeholder={t('evaluations.comments') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...evaluationForm.register('comments')}
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
            >
              {t('common.save')}
            </button>
          </form>
        )}
        <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
          {evaluations.data?.map((ev) => (
            <li key={ev.id}>
              {ev.score}/20 — {ev.evaluationDate.slice(0, 10)} {ev.comments ? `— ${ev.comments}` : ''}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function TeachersPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const teachers = useQuery({ queryKey: ['teachers'], queryFn: fetchTeachers })
  const { register, handleSubmit, reset } = useForm<CreateTeacherPayload>()

  const createMutation = useMutation({
    mutationFn: createTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      reset()
      setShowForm(false)
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('nav.teachers')}</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {t('common.create')}
        </button>
      </div>

      {showForm && (
        <Card>
          <form
            onSubmit={handleSubmit((values) => createMutation.mutate(values))}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            <input
              placeholder={t('students.firstName') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('firstName', { required: true })}
            />
            <input
              placeholder={t('students.lastName') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('lastName', { required: true })}
            />
            <input
              placeholder={t('students.email') as string}
              type="email"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('email', { required: true })}
            />
            <input
              placeholder="Mot de passe"
              type="password"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('password', { required: true, minLength: 6 })}
            />
            <input
              placeholder="Matricule"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('employeeNumber', { required: true })}
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
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="pb-2">{t('students.lastName')}</th>
              <th className="pb-2">{t('students.firstName')}</th>
              <th className="pb-2">Matricule</th>
              <th className="pb-2">{t('students.email')}</th>
              <th className="pb-2">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {teachers.data?.map((teacher) => (
              <Fragment key={teacher.id}>
                <tr className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 text-slate-900 dark:text-white">{teacher.user.lastName}</td>
                  <td className="py-2 text-slate-900 dark:text-white">{teacher.user.firstName}</td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">{teacher.employeeNumber}</td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">{teacher.user.email}</td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => setExpandedId((id) => (id === teacher.id ? null : teacher.id))}
                      className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      {t('teachers.details')}
                    </button>
                  </td>
                </tr>
                {expandedId === teacher.id && (
                  <tr>
                    <td colSpan={5} className="p-0">
                      <TeacherDetails teacherId={teacher.id} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
