import { describe, expect, it } from 'vitest';
import { findSlotConflicts, timesOverlap } from './exam-conflicts.js';

const slot = (o: Partial<Parameters<typeof findSlotConflicts>[0]> = {}) => ({
  classGroupId: 'c1',
  roomId: 'r1',
  supervisorId: 't1',
  startTime: '08:00',
  endTime: '10:00',
  ...o,
});

describe('timesOverlap', () => {
  it('détecte un chevauchement partiel', () => {
    expect(timesOverlap({ startTime: '08:00', endTime: '10:00' }, { startTime: '09:00', endTime: '11:00' })).toBe(true);
  });
  it('détecte une plage incluse', () => {
    expect(timesOverlap({ startTime: '08:00', endTime: '12:00' }, { startTime: '09:00', endTime: '10:00' })).toBe(true);
  });
  it('autorise des plages qui se touchent', () => {
    expect(timesOverlap({ startTime: '08:00', endTime: '10:00' }, { startTime: '10:00', endTime: '12:00' })).toBe(false);
  });
});

describe('findSlotConflicts', () => {
  it('ne signale rien sans chevauchement horaire', () => {
    expect(findSlotConflicts(slot({ startTime: '10:00', endTime: '12:00' }), [slot()])).toEqual([]);
  });
  it('signale classe, salle et surveillant identiques', () => {
    expect(findSlotConflicts(slot({ startTime: '09:00', endTime: '11:00' }), [slot()]).sort()).toEqual([
      'class',
      'room',
      'supervisor',
    ]);
  });
  it('ne signale que la ressource commune', () => {
    const existing = slot({ classGroupId: 'c2', supervisorId: 't2' });
    expect(findSlotConflicts(slot({ startTime: '09:00', endTime: '11:00' }), [existing])).toEqual(['room']);
  });
  it('ignore salle et surveillant absents', () => {
    const candidate = slot({ roomId: null, supervisorId: undefined, classGroupId: 'c9' });
    const existing = slot({ roomId: null, supervisorId: null });
    expect(findSlotConflicts(candidate, [existing])).toEqual([]);
  });
});
