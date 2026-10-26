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

export type Mention = 'CONGRATULATIONS' | 'ENCOURAGEMENTS' | 'HONOR_ROLL' | 'WARNING';

export const MENTION_LABELS_FR: Record<Mention, string> = {
  CONGRATULATIONS: 'Félicitations',
  ENCOURAGEMENTS: 'Encouragements',
  HONOR_ROLL: "Tableau d'honneur",
  WARNING: 'Avertissement travail',
};

/** Mention automatique selon la moyenne générale (sur 20). */
export function mentionFor(average: number): Mention | null {
  if (average >= 16) return 'CONGRATULATIONS';
  if (average >= 14) return 'ENCOURAGEMENTS';
  if (average >= 12) return 'HONOR_ROLL';
  if (average < 8) return 'WARNING';
  return null;
}

export interface ClassStanding {
  rank: number | null;
  classSize: number;
  classAverage: number | null;
}

/**
 * Rang dans la classe : 1 + nombre d'élèves ayant une moyenne strictement
 * supérieure (les ex æquo partagent le même rang). Seuls les élèves ayant au
 * moins une note comptent dans l'effectif classé.
 */
export function computeStanding(studentId: string, averages: Map<string, number>): ClassStanding {
  const classSize = averages.size;
  const own = averages.get(studentId);
  if (own === undefined) {
    return { rank: null, classSize, classAverage: classSize > 0 ? classAverage(averages) : null };
  }
  let better = 0;
  for (const value of averages.values()) {
    if (value > own) better += 1;
  }
  return { rank: better + 1, classSize, classAverage: classAverage(averages) };
}

function classAverage(averages: Map<string, number>): number {
  let sum = 0;
  for (const value of averages.values()) sum += value;
  return round(sum / averages.size);
}
