export interface SlotTimes {
  startTime: string;
  endTime: string;
}

export interface SlotResources {
  classGroupId: string;
  roomId?: string | null;
  supervisorId?: string | null;
}

export type ConflictKind = 'class' | 'room' | 'supervisor';

/** Deux plages "HH:mm" se chevauchent si chacune commence avant la fin de l'autre. */
export function timesOverlap(a: SlotTimes, b: SlotTimes): boolean {
  return a.startTime < b.endTime && a.endTime > b.startTime;
}

/**
 * Conflits entre un créneau candidat et des créneaux existants du même jour :
 * même classe, même salle ou même surveillant sur des horaires qui se chevauchent.
 */
export function findSlotConflicts(
  candidate: SlotTimes & SlotResources,
  sameDaySlots: (SlotTimes & SlotResources)[],
): ConflictKind[] {
  const kinds = new Set<ConflictKind>();
  for (const existing of sameDaySlots) {
    if (!timesOverlap(candidate, existing)) {
      continue;
    }
    if (existing.classGroupId === candidate.classGroupId) {
      kinds.add('class');
    }
    if (candidate.roomId && existing.roomId === candidate.roomId) {
      kinds.add('room');
    }
    if (candidate.supervisorId && existing.supervisorId === candidate.supervisorId) {
      kinds.add('supervisor');
    }
  }
  return Array.from(kinds);
}

export const CONFLICT_MESSAGES: Record<ConflictKind, string> = {
  class: 'cette classe a déjà un examen sur ce créneau',
  room: 'cette salle est déjà occupée sur ce créneau',
  supervisor: 'ce surveillant est déjà affecté sur ce créneau',
};
