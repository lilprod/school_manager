# Sous-projet 07 — Frontend : espace super-admin + inscription publique

## Dépend de
02, 03, 04, 05 (tous les endpoints backend `platform/*` doivent exister
et être testés).

## Bloque
08 (vérification end-to-end).

## Contexte
Le frontend (`frontend/`) a déjà : routage par rôle (`App.tsx` +
`routes/ProtectedRoute.tsx`), un store d'auth persistant (Zustand,
`stores/auth-store.ts`), un client API avec refresh JWT automatique
(`lib/api.ts`), i18n FR/EN (`i18n/locales/{fr,en}.json`), un layout avec
sidebar filtrée par rôle (`layouts/AppLayout.tsx`), et des pages
admin/enseignant déjà construites comme référence de style
(`pages/StudentsPage.tsx`, `pages/ClassesPage.tsx`). Il faut ajouter un
espace entièrement nouveau pour `SUPER_ADMIN`, plus une page publique
d'inscription d'école.

## Fichiers de référence à lire intégralement avant de commencer
- `frontend/src/App.tsx` (structure des routes)
- `frontend/src/routes/ProtectedRoute.tsx` (prop `roles`)
- `frontend/src/layouts/AppLayout.tsx` (tableau `NAV_ITEMS`, filtré par
  rôle de l'utilisateur connecté)
- `frontend/src/pages/ClassesPage.tsx` et `frontend/src/pages/StudentsPage.tsx`
  (pattern : `useQuery`/`useMutation` de `@tanstack/react-query`,
  formulaire avec `react-hook-form`, tableau Tailwind)
- `frontend/src/pages/LoginPage.tsx` (pattern de formulaire avec
  `zodResolver`, pour la page d'inscription publique)
- `frontend/src/pages/dashboards/ParentDashboard.tsx` (pattern de
  sélecteur quand il y a plusieurs entités — utile pour la liste
  d'écoles)
- `frontend/src/api/students.ts` et `frontend/src/api/academic.ts`
  (pattern des fonctions d'appel API, toutes basées sur l'instance `api`
  de `lib/api.ts`)
- `frontend/src/types/index.ts` (types partagés `Role`, etc.)

## Ce qu'il faut livrer

### 1. Types (`frontend/src/types/index.ts`)
Ajouter `'SUPER_ADMIN'` à l'union `Role`. Ajouter les interfaces `Plan`,
`Subscription`, `Payment`, `SchoolSummary` (champs : `id`, `name`,
`status`, `onboardingSource`, `subscription?: Subscription`) en miroir
exact des réponses backend des sous-projets 03/04/05.

### 2. Client API (`frontend/src/api/platform.ts`, nouveau fichier)
Fonctions : `fetchPublicPlans()`, `signupSchool(payload)`,
`fetchPlans(includeInactive?)`, `createPlan(payload)`, `updatePlan(id,
payload)`, `deactivatePlan(id)`, `fetchSchools(status?)`,
`fetchSchool(id)`, `createSchoolManually(payload)`, `approveSchool(id,
payload)`, `suspendSchool(id)`, `reactivateSchool(id)`,
`fetchSubscription(schoolId)`, `recordPayment(schoolId, payload)`,
`fetchPayments(schoolId)`. Même style que `frontend/src/api/students.ts`
(une fonction `async` par appel, typée, qui retourne `data`).

### 3. i18n
Ajouter les clés nécessaires dans `frontend/src/i18n/locales/fr.json` ET
`en.json` (toujours les deux fichiers en parallèle, jamais un seul) :
`nav.platform`, `platform.schools`, `platform.plans`, `platform.pending`,
`platform.approve`, `platform.suspend`, `platform.reactivate`,
`platform.recordPayment`, `platform.subscriptionStatus.*` (une clé par
valeur de `SubscriptionStatus`), `signup.title`, `signup.schoolName`,
etc. — suivre le style déjà en place (groupes par domaine fonctionnel).

### 4. Navigation (`frontend/src/layouts/AppLayout.tsx`)
Ajouter au tableau `NAV_ITEMS` une entrée `{ to: '/platform/schools',
labelKey: 'nav.platform', roles: ['SUPER_ADMIN'] }` (et éventuellement une
deuxième pour les plans) — **un utilisateur `SUPER_ADMIN` ne doit voir
aucun des liens existants** (Élèves, Enseignants, etc. n'ont pas de sens
pour lui puisqu'il n'a pas de `schoolId`) : vérifier que les entrées
existantes gardent bien leurs `roles` actuels (`['ADMIN', 'TEACHER']`
etc.) qui excluent déjà implicitement `SUPER_ADMIN` sans rien changer.

### 5. Pages à créer (`frontend/src/pages/platform/`)
- **`PlatformDashboardPage.tsx`** : cartes `StatCard` (composant existant
  `components/Card.tsx`) : nombre total d'écoles, nombre en attente
  d'approbation, nombre actives, somme des paiements enregistrés ce
  mois-ci (calcul simple côté front à partir de `fetchSchools()` +
  `fetchPayments` par école, ou juste les comptes d'écoles par statut si
  agréger tous les paiements est trop lourd à ce stade — **rester
  simple**, ce n'est pas un vrai dashboard analytique).
- **`PlatformSchoolsListPage.tsx`** : tableau de toutes les écoles
  (nom, statut, source d'onboarding, plan si abonnement existant), filtre
  par statut, lien vers le détail. Bouton "Créer une école" ouvrant un
  formulaire inline (même pattern que `ClassesPage.tsx`) pour
  `createSchoolManually`.
- **`PlatformSchoolDetailPage.tsx`** (route `/platform/schools/:id`) :
  infos école, statut, abonnement + plan, historique des paiements
  (tableau), formulaire "Enregistrer un paiement" (montant, méthode
  CASH/MOBILE_MONEY, référence, notes), boutons contextuels selon le
  statut : "Approuver" (si `PENDING_APPROVAL` — ouvre un petit formulaire
  pour choisir le plan final et le statut d'abonnement), "Suspendre" (si
  `ACTIVE`), "Réactiver" (si `SUSPENDED`).
- **`PlatformPlansPage.tsx`** : CRUD visuel des plans (liste + formulaire
  création/édition inline), même pattern que `SubjectsPage.tsx`.

### 6. Page publique d'inscription (`frontend/src/pages/SignupPage.tsx`)
Formulaire : nom de l'école, adresse/téléphone (optionnels), infos du
premier compte admin (email, mot de passe, prénom, nom), choix du plan
(`<select>` alimenté par `fetchPublicPlans()`). Soumission →
`signupSchool(...)` → message de succès clair : "Votre inscription est
enregistrée, un administrateur va valider votre compte sous peu." (pas de
redirection vers `/login` automatique en boucle — afficher le message et
proposer un lien vers `/login`). Même structure visuelle que
`LoginPage.tsx` (carte centrée, pas de sidebar).

### 7. Routes (`frontend/src/App.tsx`)
- Route publique `/signup` → `<SignupPage />` (hors `ProtectedRoute`, au
  même niveau que `/login`).
- Routes protégées `roles={['SUPER_ADMIN']}` : `/platform/dashboard`,
  `/platform/schools`, `/platform/schools/:id`, `/platform/plans`.
- Dans `DashboardPage.tsx` (routeur de dashboard par rôle existant),
  ajouter la redirection : un utilisateur `SUPER_ADMIN` qui arrive sur
  `/dashboard` doit être redirigé vers `/platform/dashboard` (ou bien
  gérer directement la racine `/` pour rediriger selon le rôle — choisir
  l'option la plus simple à intégrer sans casser le comportement actuel
  des 4 autres rôles).

## Fichiers à créer
- `frontend/src/api/platform.ts`
- `frontend/src/pages/platform/PlatformDashboardPage.tsx`
- `frontend/src/pages/platform/PlatformSchoolsListPage.tsx`
- `frontend/src/pages/platform/PlatformSchoolDetailPage.tsx`
- `frontend/src/pages/platform/PlatformPlansPage.tsx`
- `frontend/src/pages/SignupPage.tsx`

## Fichiers à modifier
- `frontend/src/types/index.ts`
- `frontend/src/i18n/locales/fr.json` et `en.json`
- `frontend/src/layouts/AppLayout.tsx`
- `frontend/src/App.tsx`
- `frontend/src/pages/DashboardPage.tsx`

## Ne pas toucher
- Les pages et dashboards des rôles ADMIN/TEACHER/STUDENT/PARENT déjà
  en place — sauf `ParentDashboard.tsx` à **revérifier** (pas forcément
  modifier) une fois 02 livré : confirmer dans un test manuel que
  `fetchMyChildren()` retourne bien des enfants de plusieurs écoles sans
  qu'aucun changement de code frontend ne soit nécessaire (la correction
  est entièrement côté backend).

## Critères d'acceptation
- `cd frontend && pnpm build` sans erreur.
- Test navigateur manuel (voir sous-projet 08 pour le protocole complet
  avec Playwright) : inscription self-service d'une école → connexion
  super-admin → l'école apparaît en attente → approbation → la nouvelle
  école devient active avec un abonnement → enregistrement d'un paiement
  → l'historique des paiements s'affiche.
- Commit + push.
