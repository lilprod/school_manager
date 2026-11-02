# Sous-projet 13 — Enseignants/Staff : présence, contrats, évaluations

## Dépend de
10 (schéma : `StaffAttendance`, `Contract`, `Evaluation`).

## Modèle recommandé : sonnet

## Contexte
Trois sous-modules indépendants qui complètent `TeacherProfile`. Rappel
du périmètre volontairement limité (voir `09-OVERVIEW-OPS.md`) :
`Contract` enregistre les **termes** d'un contrat, ce n'est pas un moteur
de paie.

## Fichiers de référence
- `backend/src/attendance/` (pattern complet à dupliquer pour
  `StaffAttendance` : marquage individuel/en masse, résumé par statut)
- `backend/src/teachers/` (pattern de module existant à étendre)

## Spec — Présence du staff (`backend/src/staff-attendance/`)
Même structure que `backend/src/attendance/` mais sur `TeacherProfile`
au lieu de `StudentProfile`, et sans la notion de `classGroup`/`subject`
(un enseignant est présent ou non pour la journée, pas par cours).
DTO `MarkStaffAttendanceDto { teacherId, date, status: AttendanceStatus, note? }`.
Service : `mark`, `findAll(schoolId, filters: { teacherId?, date?, from?, to? })`,
`summaryForTeacher(schoolId, teacherId)` (comptage par statut, même
requête `groupBy` que `attendance.service.ts`). Pas de version "bulk" —
le besoin (marquer tout le staff d'un coup) est plus rare que pour les
élèves, à ajouter plus tard si demandé. Controller `@Roles(Role.ADMIN)`
pour marquer, `@Roles(Role.ADMIN, Role.TEACHER)` pour consulter (un
enseignant peut voir sa propre présence — filtrer `teacherId` =
son propre `TeacherProfile.id` si rôle TEACHER, comme nulle part ailleurs
dans le projet actuellement : ajouter cette vérification dans le service,
pattern simple `if (requesterRole === 'TEACHER' && teacherId !== requesterTeacherProfileId) throw ForbiddenException`).
Base path `staff-attendance`.

## Spec — Contrats (`backend/src/contracts/`)
DTO `CreateContractDto { teacherId, contractType: ContractType, salaryAmount: number, currency?: string, startDate: string, endDate?: string }`.
Service : CRUD standard scopé par école (vérifier que `teacherId`
appartient à l'école via une jointure `teacherProfile.user.schoolId`,
même pattern que `teachers.service.ts`). Pas d'`update` de `salaryAmount`
a posteriori par souci d'audit simple — en cas de changement de salaire,
créer un nouveau `Contract` avec une nouvelle `startDate` plutôt que
modifier l'ancien (garde l'historique). Donc : `create`, `findAllForTeacher(schoolId, teacherId)`,
`findOne`, `remove` (erreur de saisie uniquement). Controller
`@Roles(Role.ADMIN)` partout (données salariales sensibles — même un
enseignant ne doit pas voir le contrat d'un autre, et en v1 on ne lui
expose même pas le sien via cet endpoint ; s'il faut qu'un enseignant
voie son propre contrat, le signaler plutôt que l'ajouter sans
validation). Base path `teachers/:teacherId/contracts`.

## Spec — Évaluations (`backend/src/evaluations/`)
DTO `CreateEvaluationDto { teacherId, score: number, comments?: string, evaluationDate?: string }`.
Service : `create(schoolId, evaluatorId, dto)` (`evaluatorId` = l'ADMIN
connecté), `findAllForTeacher(schoolId, teacherId)`. Pas d'`update`/
`remove` (une évaluation est un fait daté, on en ajoute une nouvelle
plutôt que de corriger l'ancienne — même logique que les contrats).
Controller `@Roles(Role.ADMIN)` pour create/list, base path
`teachers/:teacherId/evaluations`.

## Fichiers à créer
- `backend/src/staff-attendance/` (module + controller + service + dto)
- `backend/src/contracts/` (module + controller + service + dto)
- `backend/src/evaluations/` (module + controller + service + dto)

## Fichiers à modifier
- `backend/src/app.module.ts` (trois imports — lire l'état actuel avant
  d'éditer)

## Ne pas toucher
`backend/src/teachers/` (consommer son `TeacherProfile` via Prisma
directement, ne pas modifier `TeachersService` existant).

## Critères d'acceptation
- `pnpm exec nest build` sans erreur.
- Marquer une présence staff, consulter le résumé.
- Créer deux contrats successifs pour le même enseignant (historique),
  vérifier qu'ils coexistent tous les deux.
- Créer une évaluation, la lister.
- Un `TEACHER` qui tente `GET /teachers/:autreId/contracts` → 403 (ou
  404 si vous préférez ne pas révéler l'existence du contrat).
- Commit + push.
