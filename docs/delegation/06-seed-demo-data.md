# Sous-projet 06 — Seed de démonstration mis à jour

## Dépend de
01, 02, 03, 04, 05 (tous les modèles et modules doivent exister — le seed
peut écrire directement via Prisma sans passer par les endpoints HTTP,
mais les enums/modèles `Plan`/`Subscription`/`Payment`/`SchoolStatus`
doivent exister dans le client généré).

## Bloque
08 (vérification end-to-end).

## Contexte
`backend/prisma/seed.ts` crée actuellement une seule école ("Lycée Victor
Hugo") avec ses classes/matières/utilisateurs/présences/notes. Il faut
l'étendre pour démontrer **tout** le nouveau modèle de gouvernance,
notamment le scénario qui a motivé le changement d'architecture : **un
parent avec des enfants dans deux écoles différentes**.

## Fichier de référence
`backend/prisma/seed.ts` — lire entièrement avant de modifier. Respecter
le style existant (fonction `hash()`, `DEMO_PASSWORD = 'Password123!'`,
logs `console.log` à la fin récapitulant les comptes créés).

## Ce qu'il faut ajouter au seed existant (ne pas supprimer ce qui existe)

1. **Trois `Plan`** :
   - `code: 'starter'`, `name: 'Starter'`, `priceAmount: 15000`,
     `currency: 'XOF'`, `billingPeriod: 'MONTHLY'`, `maxStudents: 100`,
     `maxTeachers: 10`, `maxClasses: 5`
   - `code: 'standard'`, `name: 'Standard'`, `priceAmount: 35000`,
     `billingPeriod: 'MONTHLY'`, `maxStudents: 500`, `maxTeachers: 40`,
     `maxClasses: 20`
   - `code: 'premium'`, `name: 'Premium'`, `priceAmount: 350000`,
     `billingPeriod: 'YEARLY'`, pas de limites (`maxStudents`/
     `maxTeachers`/`maxClasses` à `null`)

2. **Un compte `SUPER_ADMIN`** : `super.admin@platform.app` /
   `DEMO_PASSWORD`, `schoolId: null`, `role: 'SUPER_ADMIN'`.

3. **L'école existante ("Lycée Victor Hugo") devient officiellement
   active** : mettre à jour sa création pour inclure
   `status: 'ACTIVE'`, `onboardingSource: 'MANUAL'`, puis créer une
   `Subscription` (`planId` = plan "standard", `status: 'ACTIVE'`,
   `currentPeriodEnd` = aujourd'hui + 1 mois) et un `Payment` de
   démonstration dessus (`method: 'CASH'`, `amount: 35000`,
   `recordedById` = le compte super-admin créé au point 2, `notes: 'Paiement initial - espèces'`).

4. **Une deuxième école** ("Collège Molière" ou nom similaire), avec :
   - Sa propre `AcademicYear`, au moins une `ClassGroup`, un `Subject`.
   - Un compte ADMIN, un enseignant, 2-3 élèves (mêmes helpers que pour
     la première école — factoriser si c'est naturel, mais ne pas
     sur-ingénierer un helper générique si ça complique la lecture du
     script, un copier-coller ajusté est acceptable ici).
   - `status: 'ACTIVE'`, `onboardingSource: 'SELF_SERVICE'`, une
     `Subscription` sur le plan "starter" en `status: 'TRIALING'`
     (**sans** paiement enregistré — pour démontrer le cas "essai en
     cours, pas encore payé").

5. **Une troisième école en attente** ("École Les Flamboyants" ou
   similaire) : juste `School` + son compte ADMIN, `status:
   'PENDING_APPROVAL'`, `onboardingSource: 'SELF_SERVICE'`,
   `requestedPlanId` = id du plan "starter", **aucune** `Subscription` —
   pour démontrer la file d'attente de validation du super-admin. Pas
   besoin de classes/élèves pour celle-ci.

6. **Le scénario clé — parent multi-écoles** : un des parents déjà créés
   pour "Lycée Victor Hugo" (ex. `parent1@ecole.fr`, déjà lié à
   `eleve1@ecole.fr`/`eleve2@ecole.fr` dans le seed existant) doit **en
   plus** être lié via `ParentStudent` à l'un des élèves créés pour
   "Collège Molière" au point 4. **Ne pas créer un nouveau `ParentProfile`
   pour ça** — réutiliser `parent1`'s `ParentProfile` existant, juste
   ajouter une ligne `ParentStudent` supplémentaire pointant vers l'élève
   de l'autre école. C'est exactement ce qui doit fonctionner grâce au
   sous-projet 02.

## À la fin du script
Étendre les `console.log` récapitulatifs existants pour afficher aussi :
- l'email du compte super-admin
- les noms des 3 écoles et leurs statuts
- un rappel explicite : "`parent1@ecole.fr` a des enfants dans 2 écoles
  différentes — vérifier `GET /students/my-children`"

## Fichiers à modifier
- `backend/prisma/seed.ts` (uniquement ce fichier)

## Ne pas toucher
- Aucun autre fichier. Si le seed révèle un bug dans un service (par
  exemple une méthode qui n'accepte pas encore `schoolId: null` et plante
  à l'exécution), **ne pas corriger le service ici** — documenter le
  problème précisément dans le message de fin de tâche pour qu'il soit
  traité dans le bon sous-projet (très probablement un oubli du
  sous-projet 02).

## Critères d'acceptation
- `cd backend && pnpm db:seed` s'exécute sans erreur sur une base
  fraîchement migrée (`pnpm exec prisma migrate reset --force` au
  préalable **uniquement avec confirmation explicite de l'utilisateur**,
  puis `pnpm exec prisma migrate deploy` ou `migrate dev`, puis le seed).
- Après le seed : `parent1@ecole.fr` existe, lié à au moins 3 élèves dans
  2 écoles différentes.
- Les 3 écoles existent avec les statuts attendus (`ACTIVE`/`ACTIVE`/
  `PENDING_APPROVAL`).
- Commit + push.
