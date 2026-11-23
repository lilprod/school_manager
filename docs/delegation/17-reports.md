# Sous-projet 17 — Rapports : exports CSV et PDF

## Dépend de
13 (présence staff), 14, 16 (finance) — pour avoir des données
représentatives à exporter en plus de l'attendance/grading déjà
existants. **Ne modifie aucun schéma.**

## Modèle recommandé : sonnet

## Contexte
Module transverse : pas de nouvelle table, uniquement des endpoints
d'agrégation/export au-dessus des données déjà en place. Périmètre
volontairement limité (voir `09-OVERVIEW-OPS.md`) : CSV pour les
rapports tabulaires (aucune dépendance), un seul PDF de démonstration
(bulletin déjà calculé par `grading.service.ts`). Pas de tableur Excel
natif, pas d'"analyse de tendances" au sens BI.

## Fichiers de référence
- `backend/src/grading/grading.service.ts` (méthode `reportCard` —
  réutiliser telle quelle, ne pas recalculer la logique de moyenne)
- `pdfkit` déjà installé par le sous-projet 12 — réutiliser la même
  dépendance, ne pas en ajouter une seconde.

## Spec (`backend/src/reports/`)
Pas de `dto/` nécessaire (tout en query params).

### Export CSV — présences
`GET /reports/attendance.csv?classGroupId=&from=&to=` `@Roles(Role.ADMIN, Role.TEACHER)` :
réutilise `AttendanceService.findAll` (l'injecter), transforme le
résultat en CSV (colonnes : nom, prénom, classe, date, statut) à la main
(`Array.join(',')` par ligne suffit, pas besoin de librairie CSV pour un
format aussi simple — attention à échapper les virgules dans les
champs texte avec des guillemets si nécessaire). Réponse avec
`res.set({ 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="presences.csv"' })`.

### Export CSV — finances
`GET /reports/finance.csv?classGroupId=&academicYearId=` `@Roles(Role.ADMIN)` :
réutilise `InvoicesService.findAll` (l'injecter), colonnes : élève,
classe, montant, montant payé, statut, échéance.

### Export CSV — présence staff
`GET /reports/staff-attendance.csv?from=&to=` `@Roles(Role.ADMIN)` :
même principe via `StaffAttendanceService.findAll`.

### Export PDF — bulletin
`GET /reports/report-card/:studentId.pdf?academicYearId=` (même contrôle
d'accès que `GET /grades/student/:studentId/report-card` — réutiliser
`StudentAccessService.assertCanView`, donc accessible aussi à l'élève et
son parent, pas seulement ADMIN/TEACHER) : appelle
`GradingService.reportCard`, génère un PDF simple avec `pdfkit` (en-tête
école, nom élève, tableau matière/moyenne, moyenne générale en bas).

### Résumé agrégé — dashboard admin
`GET /reports/summary` `@Roles(Role.ADMIN)` : un seul endpoint JSON (pas
d'export fichier) qui retourne `{ totalStudents, totalTeachers,
totalClasses, attendanceRatePercent (sur les 30 derniers jours, calculé
simplement : présents / (présents+absents) sur `Attendance`),
outstandingInvoicesTotal (somme des factures `PENDING`/`PARTIALLY_PAID`/
`OVERDUE`), totalExpensesThisMonth }`. Ce endpoint sert le futur tableau
de bord admin enrichi (sous-projet 18 frontend) — ne pas construire la
page ici, uniquement l'API.

## Fichiers à créer
- `backend/src/reports/` (module + controller + service — pas de `dto/`)

## Fichiers à modifier
- `backend/src/app.module.ts` (un import)

## Ne pas toucher
Les services existants ne sont qu'injectés/lus (`AttendanceService`,
`GradingService`, `InvoicesService`, `StaffAttendanceService`) — ne pas
les modifier pour servir ce module ; si une méthode manque (ex. un
filtre non prévu), ajouter une méthode dédiée dans `ReportsService` qui
fait sa propre requête Prisma plutôt que d'élargir l'API d'un autre
module pour un seul besoin de reporting.

## Critères d'acceptation
- `pnpm exec nest build` sans erreur.
- Chaque export CSV s'ouvre correctement (vérifier les en-têtes de
  colonnes et au moins une ligne de données sur un jeu de test).
- Le PDF de bulletin a un en-tête `%PDF-` valide et contient le nom de
  l'élève (vérification simple : la taille du buffer est non nulle et
  le texte brut extrait contient le nom — ou à défaut, ouverture visuelle
  manuelle du fichier généré).
- `GET /reports/summary` retourne des nombres cohérents avec les
  données de test.
- Commit + push.
