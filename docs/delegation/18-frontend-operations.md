# Sous-projet 18 — Frontend : intégration des modules opérationnels

## Dépend de
11 à 17 (tous les endpoints backend de cette vague doivent exister).

## Modèle recommandé : sonnet
Volume de fichiers élevé mais répétitif — chaque page reproduit un
pattern déjà établi dans ce repo, aucune conception nouvelle.

## Fichiers de référence (lire avant de commencer)
- `frontend/src/pages/ClassesPage.tsx` : CRUD simple (liste + formulaire
  inline toggle) — pattern pour Rooms, Fee Structures, Expenses, Syllabi.
- `frontend/src/pages/StudentsPage.tsx` : liste filtrée par `<select>`
  dépendant d'un autre module — pattern pour Timetable, Contracts.
- `frontend/src/pages/GradesPage.tsx` : "sélectionner une entité puis
  agir dessus" (créer une évaluation puis saisir les notes) — pattern
  pour Assignments (créer un devoir puis corriger les soumissions) et
  Invoices (créer une facture puis enregistrer un paiement).
- `frontend/src/pages/AttendancePage.tsx` : grille de statuts par
  personne — pattern pour la présence du staff.
- `frontend/src/api/students.ts`, `frontend/src/api/grading.ts` : style
  des fonctions d'appel API.
- `frontend/src/layouts/AppLayout.tsx` (tableau `NAV_ITEMS`),
  `frontend/src/App.tsx` (structure des routes),
  `frontend/src/i18n/locales/{fr,en}.json` (toujours éditer les deux en
  parallèle).

## Pages à créer, par module

**Administratif** (`pages/RoomsPage.tsx`, `pages/TimetablePage.tsx`) :
Rooms = CRUD simple. Timetable = sélection classe + année, tableau
jour×créneaux, formulaire de création de créneau (classe/matière/prof/
salle déjà choisis dans des `<select>` alimentés par les API existantes).

**Élèves** (étendre `StudentsPage.tsx`, pas de nouvelle page) : bouton
"Photo" (input file + upload) et "Carte d'élève" (lien `<a href=".../id-card" target="_blank">`,
le navigateur affiche le PDF) sur chaque ligne ou sur la fiche détail ;
bouton "Diplômer" avec confirmation.

**Staff** (`pages/StaffAttendancePage.tsx`, étendre `TeachersPage.tsx`
pour Contracts/Evaluations) : présence staff = même grille que
`AttendancePage.tsx` sans le filtre classe. Contrats/évaluations =
section dans la fiche détail enseignant (à créer : `pages/TeacherDetailPage.tsx`
si elle n'existe pas encore — vérifier, sinon ajouter l'historique en
accordéon simple dans `TeachersPage.tsx`).

**Académique** (`pages/SyllabiPage.tsx`, `pages/LessonPlansPage.tsx`,
`pages/AssignmentsPage.tsx`) : les deux premières en CRUD simple. La
troisième : liste des devoirs (prof) avec lien vers une vue de
correction listant les soumissions ; côté élève, une section "Mes
devoirs" dans `StudentDashboard.tsx` listant les devoirs à rendre avec
un champ texte de soumission.

**Communication** (`pages/MessagesPage.tsx`, `pages/AnnouncementsPage.tsx`,
`pages/MeetingsPage.tsx`) : messagerie = boîte de réception/envoyés
simple (liste + formulaire d'envoi avec un champ email ou sélection
destinataire — pour le v1, un simple champ texte "ID ou email du
destinataire" suffit, pas d'annuaire de contacts à construire).
Annonces = liste + formulaire de création (admin/prof). Réunions = liste
filtrée par rôle + bouton confirmer/annuler (prof/admin) ou demander
(parent, depuis `ParentDashboard.tsx`).

**Finance** (`pages/FeeStructuresPage.tsx`, `pages/InvoicesPage.tsx`,
`pages/ExpensesPage.tsx`) : barèmes et dépenses en CRUD simple.
Factures = liste filtrable par classe/statut, bouton "Facturer la
classe" (appelle le bulk), et par facture un formulaire "Enregistrer un
paiement". Ajouter une section "Mes factures" dans `StudentDashboard.tsx`
et `ParentDashboard.tsx` (lecture seule).

**Rapports** (`pages/ReportsPage.tsx`) : boutons de téléchargement
(liens directs vers les endpoints CSV/PDF, pas besoin d'appel API côté
JS pour un simple téléchargement de fichier — `<a href="/api/reports/....csv">`)
plus les compteurs de `GET /reports/summary` affichés en `StatCard`
dans `AdminDashboard.tsx` existant (enrichir ce composant plutôt que
dupliquer un nouveau dashboard).

## Navigation
Ajouter dans `NAV_ITEMS` (`AppLayout.tsx`) : Salles/Emploi du temps
(ADMIN, TEACHER), Présence staff/Contrats/Évaluations (ADMIN ; présence
aussi TEACHER pour son propre historique), Curriculum/Plans de cours/
Devoirs (ADMIN, TEACHER — Devoirs aussi STUDENT), Messages/Annonces/
Réunions (tous rôles), Finances (ADMIN). Regrouper visuellement par
section si la liste devient longue (un simple séparateur/titre de
groupe dans le rendu de la sidebar suffit, pas besoin de sous-menus
dépliables pour ce volume).

## i18n
Ajouter les clés nécessaires dans `fr.json`/`en.json` pour chaque
nouvelle page, en suivant le même regroupement par domaine déjà en
place (`attendance.*`, `grades.*`, etc.) : `rooms.*`, `timetable.*`,
`staffAttendance.*`, `contracts.*`, `evaluations.*`, `syllabi.*`,
`lessonPlans.*`, `assignments.*`, `messages.*`, `announcements.*`,
`meetings.*`, `invoices.*`, `expenses.*`, `reports.*`.

## Fichiers à créer
Un fichier `frontend/src/api/<module>.ts` par module backend (10
fichiers), et les pages listées ci-dessus (~16 nouvelles pages).

## Fichiers à modifier
- `frontend/src/App.tsx` (nouvelles routes)
- `frontend/src/layouts/AppLayout.tsx` (nouveaux `NAV_ITEMS`)
- `frontend/src/i18n/locales/fr.json` et `en.json`
- `frontend/src/pages/StudentsPage.tsx`, `TeachersPage.tsx` (extensions)
- `frontend/src/pages/dashboards/AdminDashboard.tsx`,
  `StudentDashboard.tsx`, `ParentDashboard.tsx` (sections ajoutées)
- `frontend/src/types/index.ts` (nouveaux types miroir du backend)

## Ne pas toucher
Les pages/dashboards déjà stables de la vague SaaS (`pages/platform/`,
`pages/SignupPage.tsx` s'ils existent déjà — vérifier l'état réel du
repo, le sous-projet "18" de la vague précédente a pu avoir un nom de
dossier différent).

## Critères d'acceptation
- `cd frontend && pnpm build` sans erreur.
- Navigation manuelle en navigateur réel (Playwright ou équivalent,
  voir le pattern déjà utilisé dans ce projet pour les vagues
  précédentes) : au moins un scénario bout-en-bout par module (créer un
  créneau d'emploi du temps, facturer une classe et payer une facture,
  envoyer un message, soumettre et corriger un devoir).
- Commit + push.
