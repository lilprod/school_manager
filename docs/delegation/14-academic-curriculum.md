# Sous-projet 14 — Académique : curriculum, plans de cours, devoirs

## Dépend de
10 (schéma : `Syllabus`, `LessonPlan`, `Assignment`, `AssignmentSubmission`).

## Modèle recommandé : sonnet

## Contexte
Trois sous-modules qui complètent le module Académique du cahier des
charges, distincts du module `grading/` existant (qui gère les
évaluations notées) : ici, le contenu pédagogique (quoi enseigner,
comment, et les devoirs à rendre en ligne — sans note immédiate,
contrairement à `Assessment`/`Grade`).

## Fichiers de référence
`backend/src/grading/` (pattern le plus proche : CRUD scopé par
`classGroupId`/`subjectId`/`academicYearId`, plus une sous-ressource
liée — `grades` pour `Assessment`, ici `submissions` pour `Assignment`).

## Spec — Curriculum (`backend/src/syllabi/`)
DTO `CreateSyllabusDto { subjectId, classGroupId, academicYearId, title, description? }`.
CRUD standard (`create`/`findAll(schoolId, filters)`/`findOne`/`update`/`remove`),
vérifier l'appartenance école via `classGroupId` (pattern
`assertClassGroupInSchool`). Controller `@Roles(Role.ADMIN, Role.TEACHER)`
pour create/update/remove, lecture ouverte à tous les rôles authentifiés
de l'école (élèves/parents doivent pouvoir consulter le programme — même
logique que `subjects.controller.ts` qui n'a pas de `@Roles` sur `findAll`/`findOne`).
Base path `syllabi`.

## Spec — Plans de cours (`backend/src/lesson-plans/`)
DTO `CreateLessonPlanDto { subjectId, classGroupId, date: string, title, objectives?, content? }`.
`teacherId` = le `TeacherProfile.id` de l'enseignant connecté (pas dans
le DTO, déduit côté service — un enseignant ne planifie que ses propres
cours). CRUD, `@Roles(Role.TEACHER)` pour create/update/remove (un
enseignant gère ses propres plans ; vérifier dans le service que le
`LessonPlan` à modifier/supprimer appartient bien au `teacherId` du
demandeur, sinon `ForbiddenException` — pas de rôle ADMIN ici
volontairement : un admin n'édite pas le plan de cours d'un enseignant,
il peut seulement le consulter). `@Roles(Role.ADMIN, Role.TEACHER)` pour
list/get (un admin peut consulter mais pas modifier). Base path
`lesson-plans`.

## Spec — Devoirs et soumissions (`backend/src/assignments/`)
DTO `CreateAssignmentDto { subjectId, classGroupId, academicYearId, title, description?, dueDate: string }`
(`createdById` déduit du `TeacherProfile` du connecté, même logique que
`lesson-plans`). DTO `SubmitAssignmentDto { content?: string }`
(soumission texte libre en v1 — pas d'upload de fichier, cohérent avec
`09-OVERVIEW-OPS.md`). DTO `GradeSubmissionDto { grade: number, feedback?: string }`.

Service :
- `create(schoolId, teacherId, dto)`, `findAll(schoolId, filters)`,
  `findOne(schoolId, id)`, `remove(schoolId, id)` — `@Roles(Role.TEACHER)`
  pour create/remove (même vérification de propriété que les plans de
  cours), lecture ouverte aux rôles de l'école.
- `submit(studentId, assignmentId, dto)` : upsert dans
  `AssignmentSubmission` (un élève peut resoumettre avant la correction
  — `update` si une soumission existe déjà et qu'elle n'a pas encore de
  `grade`, sinon `ConflictException('Ce devoir a déjà été corrigé.')`).
  `@Roles(Role.STUDENT)`.
- `gradeSubmission(schoolId, teacherId, submissionId, dto)` : vérifie que
  le devoir appartient bien à ce `teacherId`, met à jour `grade`/`feedback`.
  `@Roles(Role.TEACHER)`.
- `findMySubmission(studentId, assignmentId)` et
  `findSubmissions(schoolId, teacherId, assignmentId)` (liste pour
  correction, avec `student.user` inclus).

Controller : base path `assignments`, sous-routes
`POST /assignments/:id/submit`, `GET /assignments/:id/submissions`,
`PATCH /assignments/:id/submissions/:submissionId/grade`.

## Fichiers à créer
- `backend/src/syllabi/` (module + controller + service + dto)
- `backend/src/lesson-plans/` (module + controller + service + dto)
- `backend/src/assignments/` (module + controller + service + dto)

## Fichiers à modifier
- `backend/src/app.module.ts` (trois imports)

## Ne pas toucher
`backend/src/grading/` (module distinct, ne pas fusionner `Assignment`
avec `Assessment` même si la forme se ressemble — l'un est noté
immédiatement par saisie en masse, l'autre est une soumission d'élève
corrigée individuellement).

## Critères d'acceptation
- `pnpm exec nest build` sans erreur.
- Un enseignant crée un devoir, un élève le soumet, l'enseignant le
  corrige, l'élève voit sa note.
- Un élève ne peut pas resoumettre après correction (409).
- Un enseignant ne peut pas modifier le plan de cours d'un collègue (403).
- Commit + push.
