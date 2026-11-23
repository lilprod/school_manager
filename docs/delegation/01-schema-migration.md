# Sous-projet 01 — Schéma multi-tenant + migration

## Dépend de
Rien (premier sous-projet). **Bloque tous les autres.**

## Contexte
Le schéma Prisma (`backend/prisma/schema.prisma`) a déjà été édité dans
une session précédente pour introduire la gouvernance multi-tenant. Les
changements sont **non commités** (vérifier avec `git status` /
`git diff backend/prisma/schema.prisma` en premier). Il faut : relire ce
qui existe, confirmer que c'est complet et cohérent avec la spec
ci-dessous, générer la migration, et committer.

## Objectif
Avoir un schéma Prisma validé, migré sur la base de dev locale, et commité,
qui introduit :
- un rôle `SUPER_ADMIN` hors de toute école ;
- `User.schoolId` optionnel (nullable) ;
- un statut et une source d'onboarding sur `School` ;
- les modèles `Plan`, `Subscription`, `Payment`.

## Spec exacte attendue

```prisma
enum Role {
  SUPER_ADMIN
  ADMIN
  TEACHER
  STUDENT
  PARENT
}

enum SchoolStatus {
  PENDING_APPROVAL
  ACTIVE
  SUSPENDED
}

enum OnboardingSource {
  MANUAL
  SELF_SERVICE
}

enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  SUSPENDED
  CANCELLED
}

enum BillingPeriod {
  MONTHLY
  YEARLY
}

enum PaymentMethod {
  CASH
  MOBILE_MONEY
}
```

Sur `model School` : ajouter
```prisma
status           SchoolStatus     @default(PENDING_APPROVAL)
onboardingSource OnboardingSource @default(MANUAL)
subscription     Subscription?
```
(la relation inverse `subscription` est optionnelle côté School, 1-1 avec
`Subscription.schoolId @unique`).

Sur `model User` : `schoolId` et la relation `school` deviennent optionnels
(`String?` / `School?`), le reste ne change pas. Ajouter la relation
inverse `recordedPayments Payment[]` (utilisée par `Payment.recordedBy`).

Nouveaux modèles (en fin de fichier, avant ou après `AuditLog`, peu
importe) :

```prisma
model Plan {
  id            String        @id @default(cuid())
  name          String
  code          String        @unique
  priceAmount   Float
  currency      String        @default("XOF")
  billingPeriod BillingPeriod @default(MONTHLY)
  maxStudents   Int?
  maxTeachers   Int?
  maxClasses    Int?
  isActive      Boolean       @default(true)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  subscriptions Subscription[]
}

model Subscription {
  id               String             @id @default(cuid())
  schoolId         String             @unique
  school           School             @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  planId           String
  plan             Plan               @relation(fields: [planId], references: [id])
  status           SubscriptionStatus @default(TRIALING)
  startDate        DateTime           @default(now())
  currentPeriodEnd DateTime?
  trialEndsAt      DateTime?
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  payments Payment[]
}

model Payment {
  id             String        @id @default(cuid())
  subscriptionId String
  subscription   Subscription  @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  amount         Float
  currency       String        @default("XOF")
  method         PaymentMethod
  reference      String?
  notes          String?
  recordedById   String
  recordedBy     User          @relation(fields: [recordedById], references: [id])
  paidAt         DateTime      @default(now())
  createdAt      DateTime      @default(now())

  @@index([subscriptionId])
}
```

**Important** : `Subscription.schoolId` est `@unique` — une école n'a
qu'un seul abonnement "courant" à la fois (pas d'historique de plusieurs
lignes `Subscription`). L'historique de facturation se fait via les
lignes `Payment`, pas via plusieurs `Subscription`.

## Pourquoi `User.schoolId` devient nullable
Un `SUPER_ADMIN` n'appartient à aucune école. Un `PARENT` peut avoir des
enfants dans plusieurs écoles différentes : son identité (`User`) ne doit
donc plus être rattachée à une seule école — seule la relation
`ParentStudent` (déjà existante, non scopée par école) détermine quels
élèves, dans quelles écoles, il peut voir. `ADMIN`/`TEACHER`/`STUDENT`
gardent un `schoolId` renseigné (validé au niveau applicatif, pas au
niveau du schéma — Prisma ne permet pas de nullabilité conditionnelle par
valeur d'enum).

## Étapes concrètes
1. `cd backend && git diff prisma/schema.prisma` — vérifier l'état actuel
   contre la spec ci-dessus. Compléter si des éléments manquent.
2. `pnpm exec prisma format && pnpm exec prisma validate`
3. S'assurer que PostgreSQL tourne (`pg_lsclusters`, sinon `service
   postgresql start`) et que le rôle `school` a bien `CREATEDB` (nécessaire
   pour la base fantôme de `migrate dev` — si erreur `P3014`, lancer :
   `sudo -u postgres psql -c "ALTER ROLE school CREATEDB;"`).
4. `pnpm exec prisma migrate dev --name multi_tenant_governance`
   - Si Prisma signale un écart entre les migrations locales et l'état de
     la base (DB déjà modifiée dans une session précédente) et demande un
     reset : la base locale ne contient que des données de démo
     jetables (pas de données réelles). **Demander confirmation explicite
     à l'utilisateur avant tout `prisma migrate reset`** (Prisma lui-même
     bloque cette commande sans confirmation explicite transmise via la
     variable d'environnement `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`)
     — ne pas contourner cette protection.
5. `pnpm exec nest build` doit passer sans erreur (le code existant
   référence `user.schoolId` comme `string` non-nullable à plusieurs
   endroits — **ignorer ces erreurs de type pour l'instant**, elles seront
   corrigées dans le sous-projet 02 ; mais la génération du client Prisma
   et la compilation du schéma lui-même ne doivent produire aucune erreur
   liée à Prisma. Si `nest build` échoue À CAUSE du schéma/migration,
   c'est un vrai problème à corriger ici. S'il échoue uniquement sur des
   erreurs de type `schoolId` dans `auth/`, `students/`, `attendance/`,
   `grading/`, c'est attendu et laissé au sous-projet 02).
6. Committer `backend/prisma/schema.prisma` et le nouveau dossier
   `backend/prisma/migrations/<timestamp>_multi_tenant_governance/`.

## Fichiers concernés
- `backend/prisma/schema.prisma` (déjà modifié, à finaliser)
- `backend/prisma/migrations/` (nouveau dossier de migration généré)

## Ne pas toucher
- Aucun fichier `.ts` dans `backend/src/` — cette tâche est 100% schéma.

## Critères d'acceptation
- `pnpm exec prisma validate` : OK
- `pnpm exec prisma migrate dev` appliqué sans erreur, migration présente
  dans `prisma/migrations/`
- `pnpm exec prisma generate` régénère le client sans erreur
- Commit poussé sur `origin/claude/school-management-system-fz5xzt`
