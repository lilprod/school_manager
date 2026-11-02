# Sous-projet 11 — Administratif (salles + emploi du temps)

## Dépend de
10 (schéma : `Room`, `TimetableSlot`).

## Modèle recommandé : sonnet

## Contexte
Deux modules NestJS indépendants mais liés : la gestion des salles
(CRUD simple) et l'emploi du temps (création de créneaux avec détection
de conflits — un enseignant ou une salle ne peut pas être sur deux
créneaux qui se chevauchent le même jour).

## Fichiers de référence
`backend/src/class-groups/` pour le pattern CRUD simple (Rooms).
`backend/src/attendance/attendance.service.ts` pour le style de
validation d'appartenance (`assertClassGroupInSchool`).

## Spec — Module Rooms (`backend/src/rooms/`)
DTOs : `CreateRoomDto { name: string; capacity?: number; type?: string }`,
`UpdateRoomDto` (mêmes champs optionnels).
Service : CRUD standard scopé par `schoolId`, conflit de nom →
`ConflictException` (pattern P2002, voir `subjects.service.ts`).
Controller : `@Roles(Role.ADMIN)` pour create/update/delete,
`@Roles(Role.ADMIN, Role.TEACHER)` pour list/get. Base path `rooms`.

## Spec — Module Timetable (`backend/src/timetable/`)
DTO `CreateTimetableSlotDto { classGroupId, subjectId, teacherId, roomId?,
academicYearId, dayOfWeek: number (1-7), startTime: string ("HH:mm"),
endTime: string }`. Validation : `@IsInt() @Min(1) @Max(7)` pour
`dayOfWeek`, `@Matches(/^([01]\d|2[0-3]):[0-5]\d$/)` pour les horaires.

Service :
- `create(schoolId, dto)` : vérifier que `classGroupId`/`subjectId`/
  `teacherId`/`roomId` (si fourni) appartiennent bien à `schoolId`
  (même pattern que `assertClassGroupInSchool`), puis **détecter les
  conflits** avant insertion : requête `prisma.timetableSlot.findMany`
  filtrée sur `dayOfWeek` + (`teacherId` égal OU `roomId` égal), puis en
  mémoire vérifier le chevauchement d'intervalles (`startTime < existing.endTime
  && endTime > existing.startTime` en comparant les chaînes "HH:mm"
  lexicographiquement — ça fonctionne car le format est à largeur fixe).
  Si conflit → `ConflictException('Ce créneau chevauche un cours existant pour cet enseignant ou cette salle.')`.
- `findAll(schoolId, filters: { classGroupId?, teacherId?, academicYearId? })`
- `findOne(schoolId, id)`, `remove(schoolId, id)` (pas d'update : supprimer
  et recréer plutôt que patcher un créneau, plus simple et suffisant en v1).

Controller : base path `timetable`, `@Roles(Role.ADMIN)` pour create/
remove, `@Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)` pour list/get
(un élève doit pouvoir consulter l'emploi du temps de sa classe — filtrer
côté frontend par `classGroupId` de l'élève, pas de restriction serveur
supplémentaire nécessaire puisque tout est déjà scopé par école).

## Fichiers à créer
- `backend/src/rooms/{rooms.module,rooms.controller,rooms.service}.ts` + `dto/`
- `backend/src/timetable/{timetable.module,timetable.controller,timetable.service}.ts` + `dto/`

## Fichiers à modifier
- `backend/src/app.module.ts` (deux nouveaux imports — lire l'état actuel
  du fichier avant d'éditer, d'autres sous-projets de cette vague y
  touchent aussi)

## Ne pas toucher
Les autres modules de cette vague (11-16 sont indépendants).

## Critères d'acceptation
- `pnpm exec nest build` sans erreur.
- Créer deux créneaux qui se chevauchent pour le même enseignant →
  409 sur le second. Même test avec la même salle. Deux créneaux qui ne
  se chevauchent pas (ou jours différents) → les deux passent.
- Commit + push.
