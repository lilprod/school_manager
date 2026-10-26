import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchReportCard } from '../api/grading'
import { openReportCardPdf } from '../api/reports'
import { fetchTerms } from '../api/terms'
import { Card } from './Card'

interface Props {
  studentId: string
  academicYearId: string
}

export function ReportCardSection({ studentId, academicYearId }: Props) {
  const { t } = useTranslation()
  const [termId, setTermId] = useState('')

  const terms = useQuery({ queryKey: ['terms', academicYearId], queryFn: () => fetchTerms(academicYearId) })
  const reportCard = useQuery({
    queryKey: ['report-card', studentId, academicYearId, termId],
    queryFn: () => fetchReportCard(studentId, academicYearId, termId || undefined),
  })

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('grades.reportCard')}</p>
        <div className="flex items-center gap-3">
          <select
            value={termId}
            onChange={(e) => setTermId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="">{t('terms.wholeYear')}</option>
            {terms.data?.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => openReportCardPdf(studentId, academicYearId, termId || undefined)}
            className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {t('grades.downloadPdf')}
          </button>
        </div>
      </div>

      {reportCard.data && reportCard.data.subjects.length > 0 ? (
        <>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="pb-2">{t('grades.subject')}</th>
                <th className="pb-2">{t('grades.coefficient')}</th>
                <th className="pb-2">{t('grades.average')}</th>
              </tr>
            </thead>
            <tbody>
              {reportCard.data.subjects.map((s) => (
                <tr key={s.subjectId} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 text-slate-900 dark:text-white">{s.subjectName}</td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">{s.coefficient}</td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">{s.average}/20</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
            {t('dashboard.overallAverage')} : {reportCard.data.overallAverage}/20
          </p>
        </>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('common.noData')}</p>
      )}
    </Card>
  )
}
