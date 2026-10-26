import { describe, expect, it } from 'vitest';
import { computeReportCard, type GradeInput } from './report-card.js';

const grade = (overrides: Partial<GradeInput>): GradeInput => ({
  score: 10,
  maxScore: 20,
  assessmentCoefficient: 1,
  subjectId: 'math',
  subjectName: 'Maths',
  subjectCoefficient: 1,
  ...overrides,
});

describe('computeReportCard', () => {
  it('retourne 0 sans notes', () => {
    expect(computeReportCard([])).toEqual({ subjects: [], overallAverage: 0 });
  });

  it('ramène chaque note sur 20', () => {
    const result = computeReportCard([grade({ score: 8, maxScore: 10 })]);
    expect(result.subjects[0].average).toBe(16);
    expect(result.overallAverage).toBe(16);
  });

  it('pondère les évaluations par leur coefficient dans une matière', () => {
    // (20 * 1 + 10 * 3) / 4 = 12.5
    const result = computeReportCard([
      grade({ score: 20, assessmentCoefficient: 1 }),
      grade({ score: 10, assessmentCoefficient: 3 }),
    ]);
    expect(result.subjects[0].average).toBe(12.5);
  });

  it('pondère les matières par leur coefficient dans la moyenne générale', () => {
    // Maths 20 (coef 3), Histoire 10 (coef 1) -> (60 + 10) / 4 = 17.5
    const result = computeReportCard([
      grade({ score: 20, subjectId: 'math', subjectCoefficient: 3 }),
      grade({ score: 10, subjectId: 'hist', subjectName: 'Histoire', subjectCoefficient: 1 }),
    ]);
    expect(result.overallAverage).toBe(17.5);
    expect(result.subjects.map((s) => s.coefficient)).toEqual([3, 1]);
  });

  it('ne laisse pas le nombre d\'évaluations d\'une matière peser sur la moyenne générale', () => {
    // 3 notes en maths à 20, 1 note en histoire à 0, coefficients égaux -> 10, pas 15
    const result = computeReportCard([
      grade({ score: 20 }),
      grade({ score: 20 }),
      grade({ score: 20 }),
      grade({ score: 0, subjectId: 'hist', subjectName: 'Histoire' }),
    ]);
    expect(result.overallAverage).toBe(10);
  });

  it('arrondit à deux décimales', () => {
    const result = computeReportCard([grade({ score: 10 }), grade({ score: 10 }), grade({ score: 11 })]);
    expect(result.subjects[0].average).toBe(10.33);
  });
});
