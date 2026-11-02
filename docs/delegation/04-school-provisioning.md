# Sous-projet 04 — Provisioning des écoles (manuel + self-service)

## Dépend de
01 (schéma), 02 (auth multi-tenant), 03 (module Plans — pour valider
qu'un `planId`/`code` de plan existe et est actif).

## Bloque
05 (les paiements s'enregistrent contre l'abonnement créé ici), 06, 07, 08.

## Contexte
Deux façons de créer une école doivent exister :

1. **Manuel (super-admin)** : le super-admin crée l'école et son premier
   compte ADMIN directement, choisit un plan, l'école est **active
   immédiatement** (ou en attente si le super-admin choisit de ne pas
   l'activer tout de suite — cas rare, mais prévoir le flag).
2. **Self-service (l'école s'inscrit elle-même)** : formulaire public,
   l'école est créée en statut `PENDING_APPROVAL`, **sans abonnement
   actif**. Le super-admin doit ensuite l'approuver manuellement
   (après avoir reçu le paiement en espèces/mobile money — géré au
   sous-projet 05) pour qu'elle devienne `ACTIVE` avec un abonnement.

Décision déjà prise (ne pas la remettre en question) : en self-service, on
ne crée **pas** de ligne `Subscription` à l'inscription — seulement à
l'approbation. Le plan souhaité par le prospect est mémorisé sur `School`
via un nouveau champ `requestedPlanId` (nullable, pas de contrainte FK
stricte nécessaire — un simple `String?` suffit, pas besoin de relation
Prisma dédiée, un ID de plan suffit pour l'affichage côté super-admin).

**Ce nouveau champ `requestedPlanId` doit être ajouté au schéma** — si le
sous-projet 01 ne l'a pas prévu, l'ajouter ici (migration incrémentale
`add_school_requested_plan`), ce n'est pas une régression du travail
précédent, juste un détail de modélisation découvert à l'implémentation.

## Fichiers de référence à lire
- `backend/src/students/students.service.ts` (`create` — pattern de
  création d'un `User` + profil associé dans une transaction Prisma
  `$transaction`, avec hash bcrypt du mot de passe, `SALT_ROUNDS = 10`,
  vérification d'email déjà pris → `ConflictException`)
- `backend/src/auth/auth.controller.ts` (usage de `@Public()` sur
  certaines routes d'un contrôleur qui en a aussi des protégées)

## Spec exacte

### Migration incrémentale (si besoin)
```prisma
model School {
  // ... champs existants ...
  requestedPlanId String?
}
```

### DTOs (`backend/src/platform-schools/dto/`)

`signup-school.dto.ts` (inscription publique) :
```ts
export class SignupSchoolDto {
  schoolName: string;       // @IsString() @MinLength(2)
  address?: string;         // @IsOptional() @IsString()
  phone?: string;           // @IsOptional() @IsString()
  adminEmail: string;       // @IsEmail()
  adminPassword: string;    // @IsString() @MinLength(6)
  adminFirstName: string;   // @IsString()
  adminLastName: string;    // @IsString()
  planCode: string;         // @IsString() — code d'un Plan existant et actif
}
```

`create-school.dto.ts` (provisioning manuel par le super-admin) : mêmes
champs que `SignupSchoolDto` plus :
```ts
planId: string;             // @IsString() — id direct du plan choisi
activateImmediately?: boolean; // @IsOptional() @IsBoolean(), défaut true
```

`approve-school.dto.ts` :
```ts
export class ApproveSchoolDto {
  planId: string;                          // @IsString()
  subscriptionStatus?: 'ACTIVE' | 'TRIALING'; // @IsOptional() @IsEnum(...), défaut 'ACTIVE'
  trialEndsAt?: string;                    // @IsOptional() @IsDateString()
}
```

### Service (`backend/src/platform-schools/platform-schools.service.ts`)

- **`signup(dto: SignupSchoolDto)`** : contrôles → vérifier que
  `dto.adminEmail` n'est pas déjà pris (même check que
  `StudentsService.create`), vérifier que le `Plan` référencé par
  `planCode` existe et `isActive: true` (sinon `BadRequestException`).
  Dans une transaction : créer `School` (`status: 'PENDING_APPROVAL'`,
  `onboardingSource: 'SELF_SERVICE'`, `requestedPlanId: plan.id`), puis
  `User` (`role: 'ADMIN'`, `schoolId` = celui de l'école créée,
  `passwordHash` via bcrypt comme dans `StudentsService.create`). **Ne
  pas créer de `Subscription`**. Retourner l'école créée (sans le hash de
  mot de passe — même pattern de `sanitize` que dans les autres services).

- **`createManually(dto: CreateSchoolDto)`** (appelé par le super-admin) :
  mêmes contrôles (email, plan actif — ici par `planId` direct). Dans une
  transaction : créer `School` (`status`: `ACTIVE` si
  `activateImmediately !== false`, sinon `PENDING_APPROVAL`;
  `onboardingSource: 'MANUAL'`), créer `User` ADMIN, **et** si le statut
  est `ACTIVE`, créer directement la `Subscription`
  (`status: 'ACTIVE'`, `planId`). Si `activateImmediately` est `false`,
  ne pas créer de `Subscription` (même état qu'un self-service en
  attente — l'approbation se fera via `approve()` ci-dessous).

- **`findAll(filters: { status?: SchoolStatus })`** : liste toutes les
  écoles avec leur `subscription` et `plan` inclus (`include`), triées
  par `createdAt desc`. Réservé au super-admin.

- **`findOne(id)`** : détail d'une école avec `subscription.plan` et
  compteurs utiles (`_count` Prisma sur `users`, `classGroups` par
  exemple, optionnel mais appréciable pour le dashboard super-admin).

- **`approve(id, dto: ApproveSchoolDto)`** : vérifie que l'école existe et
  est en `PENDING_APPROVAL` (sinon `BadRequestException` — on n'approuve
  qu'une école en attente). Vérifie que le plan existe et est actif. Crée
  la `Subscription` (`status` = `dto.subscriptionStatus ?? 'ACTIVE'`,
  `planId`, `trialEndsAt` si fourni), passe `School.status` à `ACTIVE`.

- **`suspend(id)`** : passe `School.status` à `SUSPENDED` et, si une
  `Subscription` existe, son `status` à `SUSPENDED` également.

- **`reactivate(id)`** : passe `School.status` à `ACTIVE` (uniquement si
  une `Subscription` existe déjà — sinon `BadRequestException`, il faut
  passer par `approve` dans ce cas) et `Subscription.status` à `ACTIVE`.

### Controller (`backend/src/platform-schools/platform-schools.controller.ts`)
Base path `platform/schools` :
```ts
@Public()
@Post('signup')
signup(@Body() dto: SignupSchoolDto) {}

@Roles(Role.SUPER_ADMIN)
@Post()
createManually(@Body() dto: CreateSchoolDto) {}

@Roles(Role.SUPER_ADMIN)
@Get()
findAll(@Query('status') status?: SchoolStatus) {}

@Roles(Role.SUPER_ADMIN)
@Get(':id')
findOne(@Param('id') id: string) {}

@Roles(Role.SUPER_ADMIN)
@Post(':id/approve')
approve(@Param('id') id: string, @Body() dto: ApproveSchoolDto) {}

@Roles(Role.SUPER_ADMIN)
@Post(':id/suspend')
suspend(@Param('id') id: string) {}

@Roles(Role.SUPER_ADMIN)
@Post(':id/reactivate')
reactivate(@Param('id') id: string) {}
```

### Anti-spam sur la route publique `signup`
Installer `@nestjs/throttler` (`pnpm add @nestjs/throttler`). Enregistrer
`ThrottlerModule.forRoot([{ ttl: 900000, limit: 5 }])` (15 min / 5
requêtes) dans `app.module.ts`, et appliquer spécifiquement sur la route
`signup` via le décorateur `@Throttle(...)` de ce package (consulter la
doc du package pour la syntaxe exacte de la version installée — NestJS a
changé cette API entre versions majeures, vérifier avec
`pnpm why @nestjs/throttler` quelle version est posée et adapter la
syntaxe en conséquence). Ne **pas** appliquer ce throttling globalement
sur toute l'API — seulement sur `POST /platform/schools/signup`, pour ne
pas limiter artificiellement les autres endpoints déjà testés.

## Fichiers à créer
- `backend/src/platform-schools/platform-schools.module.ts`
- `backend/src/platform-schools/platform-schools.controller.ts`
- `backend/src/platform-schools/platform-schools.service.ts`
- `backend/src/platform-schools/dto/signup-school.dto.ts`
- `backend/src/platform-schools/dto/create-school.dto.ts`
- `backend/src/platform-schools/dto/approve-school.dto.ts`

## Fichiers à modifier
- `backend/prisma/schema.prisma` (ajout `requestedPlanId` si nécessaire
  — migration incrémentale dédiée, ne pas re-générer la migration du
  sous-projet 01)
- `backend/src/app.module.ts` (import `PlatformSchoolsModule` et
  `ThrottlerModule`)
- `backend/package.json` / `pnpm-lock.yaml` (nouvelle dépendance)

## Ne pas toucher
- Le module `backend/src/schools/` existant (gestion du profil de SA
  PROPRE école par un ADMIN déjà connecté — `GET/PATCH /schools/me`).
  C'est un concept différent du `platform-schools/` créé ici (vue
  plateforme, multi-écoles, réservée au super-admin). Ne pas fusionner
  les deux modules.
- `backend/src/plans/` (sous-projet 03, déjà livré — seulement le
  **consommer** via `PlansService` injecté, ne pas le modifier).

## Critères d'acceptation
- `pnpm exec nest build` sans erreur.
- Scénario self-service testé manuellement : `POST /platform/schools/signup`
  sans token → 201, école visible avec `status: PENDING_APPROVAL` dans
  `GET /platform/schools` (en SUPER_ADMIN), pas de `subscription`. Puis
  `POST /platform/schools/:id/approve` → l'école passe à `ACTIVE` avec un
  abonnement.
- Scénario manuel testé : `POST /platform/schools` (SUPER_ADMIN) avec
  `activateImmediately: true` → école + admin + abonnement créés
  directement actifs en une seule requête.
- 6ᵉ appel à `/platform/schools/signup` en moins de 15 minutes depuis la
  même IP → 429 Too Many Requests.
- Commit + push.
