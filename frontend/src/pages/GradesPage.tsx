import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { fetchAcademicYears, fetchClassGroups, fetchSubjects } from '../api/academic'
import {
  createAssessment,
  enterGrades,
  fetchAssessments,
  type CreateAssessmentPayload,
} from '../api/grading'
import { fetchStudents } from '../api/students'
import { Card } from '../components/Card'

export default function GradesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [classGroupId, setClassGroupId] = useState('')
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null)
  const [scores, setScores] = useState<Record<string, string>>({})

  const classGroups = useQuery({ queryKey: ['class-groups'], queryFn: fetchClassGroups })
  const subjects = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects })
  const years = useQuery({ queryKey: ['academic-years'], queryFn: fetchAcademicYears })
  const currentYear = years.data?.find((y) => y.isCurrent) ?? years.data?.[0]

  const assessments = useQuery({
    queryKey: ['assessments', classGroupId],
    queryFn: () => fetchAssessments({ classGroupId: classGroupId || undefined }),
  })

  const students = useQuery({
    queryKey: ['students', classGroupId],
    queryFn: () => fetchStudents(classGroupId),
    enabled: !!classGroupId && !!selectedAssessmentId,
  })

  const { register, handleSubmit, reset } = useForm<CreateAssessmentPayload>()

  const createMutation = useMutation({
    mutationFn: createAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] })
      reset()
      setShowForm(false)
    },
  })

  const gradesMutation = useMutation({
    mutationFn: (assessmentId: string) =>
      enterGrades(
        assessmentId,
        Object.entries(scores)
          .filter(([, value]) => value !== '')
          .map(([studentId, value]) => ({ studentId, score: Number(value) })),
      ),
    onSuccess: () => {
      setScores({})
      setSelectedAssessmentId(null);
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('grades.title')}</h1>
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
            onSubmit={handleSubmit((values) =>
              createMutation.mutate({ ...values, academicYearId: currentYear?.id ?? values.academicYearId }),
            )}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            <input
              placeholder={t('grades.assessment') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('title', { required: true })}
            />
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('type', { required: true })}
              defaultValue="EXAM"
            >
              <option value="EXAM">Examen</option>
              <option value="QUIZ">Quiz</option>
              <option value="HOMEWORK">Devoir</option>
              <option value="PROJECT">Projet</option>
            </select>
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('subjectId', { required: true })}
            >
              <option value="">{t('grades.subject')}</option>
              {subjects.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('classGroupId', { required: true })}
            >
              <option value="">{t('students.class')}</option>
              {classGroups.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('date', { required: true })}
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

      <select
        value={classGroupId}
        onChange={(e) => {
          setClassGroupId(e.target.value)
          setSelectedAssessmentId(null)
        }}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      >
        <option value="">{t('attendance.selectClass')}</option>
        {classGroups.data?.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <Card>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="pb-2">{t('grades.assessment')}</th>
              <th className="pb-2">{t('grades.subject')}</th>
              <th className="pb-2">{t('attendance.date')}</th>
              <th className="pb-2">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {assessments.data?.map((a) => (
              <tr key={a.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-2 text-slate-900 dark:text-white">{a.title}</td>
                <td className="py-2 text-slate-700 dark:text-slate-300">{a.subject.name}</td>
                <td className="py-2 text-slate-700 dark:text-slate-300">{a.date.slice(0, 10)}</td>
                <td className="py-2">
                  <button
                    type="button"
                    onClick={() => {
                      setClassGroupId(a.classGroup.id)
                      setSelectedAssessmentId(a.id)
                    }}
                    className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {t('common.edit')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {selectedAssessmentId && students.data && (
        <Card>
          <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">{t('grades.score')}</p>
          <div className="space-y-2">
            {students.data.map((student) => (
              <div key={student.id} className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-900 dark:text-white">
                  {student.user.firstName} {student.user.lastName}
                </span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={scores[student.id] ?? ''}
                  onChange={(e) => setScores((prev) => ({ ...prev, [student.id]: e.target.value }))}
                  className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => gradesMutation.mutate(selectedAssessmentId)}
            disabled={gradesMutation.isPending}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {t('common.save')}
          </button>
        </Card>
      )}
    </div>
  )
}
