export interface GradeInput {
  score: number;
  maxScore: number;
  assessmentCoefficient: number;
  subjectId: string;
  subjectName: string;
  subjectCoefficient: number;
}

export interface ReportCardSubject {
  subjectId: string;
  subjectName: string;
  coefficient: number;
  average: number;
  assessmentCount: number;
}

export interface ReportCardResult {
  subjects: ReportCardSubject[];
  overallAverage: number;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Moyenne de matière : moyenne des notes ramenées sur 20, pondérée par le
 * coefficient de chaque évaluation. Moyenne générale : moyenne des moyennes de
 * matière, pondérée par le coefficient de chaque matière.
 */
export function computeReportCard(grades: GradeInput[]): ReportCardResult {
  const bySubject = new Map<
    string,
    { subjectName: string; coefficient: number; weighted: number; weights: number; count: number }
  >();

  for (const grade of grades) {
    const weight = grade.assessmentCoefficient;
    const entry = bySubject.get(grade.subjectId) ?? {
      subjectName: grade.subjectName,
      coefficient: grade.subjectCoefficient,
      weighted: 0,
      weights: 0,
      count: 0,
    };
    entry.weighted += (grade.score / grade.maxScore) * 20 * weight;
    entry.weights += weight;
    entry.count += 1;
    bySubject.set(grade.subjectId, entry);
  }

  const subjects: ReportCardSubject[] = [];
  let overallWeighted = 0;
  let overallWeights = 0;

  for (const [subjectId, entry] of bySubject) {
    const average = entry.weights > 0 ? entry.weighted / entry.weights : 0;
    subjects.push({
      subjectId,
      subjectName: entry.subjectName,
      coefficient: entry.coefficient,
      average: round(average),
      assessmentCount: entry.count,
    });
    if (entry.weights > 0) {
      overallWeighted += average * entry.coefficient;
      overallWeights += entry.coefficient;
    }
  }

  return {
    subjects,
    overallAverage: overallWeights > 0 ? round(overallWeighted / overallWeights) : 0,
  };
}
