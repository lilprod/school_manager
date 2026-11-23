# Sous-projet 03 — Module Plans (super-admin)

## Dépend de
01 (schéma), 02 (auth multi-tenant — pour que `@Roles(Role.SUPER_ADMIN)`
fonctionne et que `AuthenticatedUser.schoolId` soit bien `string | null`).

## Bloque
04 (le provisioning d'école référence un `planId` existant),
05 (les abonnements référencent un plan).

## Contexte
Le modèle `Plan` existe déjà dans le schéma (sous-projet 01) :
```prisma
model Plan {
  id            String        @id @default(cuid())
  name          String
  code          String        @unique
  priceAmount   Float
  currency      String        @default("XOF")
  billingPeriod BillingPeriod @default(MONTHLY)  // MONTHLY | YEARLY
  maxStudents   Int?
  maxTeachers   Int?
  maxClasses    Int?
  isActive      Boolean       @default(true)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}
```
Il faut construire le module NestJS de gestion de ce catalogue de plans,
réservé au rôle `SUPER_ADMIN`. C'est un CRUD classique, le plus simple des
sous-projets de cette phase — bon point de départ pour se familiariser
avec les conventions du repo.

## Fichier de référence à lire avant de commencer
`backend/src/subjects/` (module le plus simple du repo : controller +
service + 2 DTOs + module). Reproduire exactement ce pattern.

## Spec exacte

### DTOs (`backend/src/plans/dto/`)
`create-plan.dto.ts` :
```ts
export class CreatePlanDto {
  name: string;            // @IsString()
  code: string;            // @IsString() — identifiant unique, ex: "starter", "pro"
  priceAmount: number;     // @IsNumber() @Min(0)
  currency?: string;       // @IsOptional() @IsString() — défaut "XOF" si absent
  billingPeriod: 'MONTHLY' | 'YEARLY'; // @IsEnum(BillingPeriod)
  maxStudents?: number;    // @IsOptional() @IsInt() @Min(1)
  maxTeachers?: number;    // @IsOptional() @IsInt() @Min(1)
  maxClasses?: number;     // @IsOptional() @IsInt() @Min(1)
}
```
`update-plan.dto.ts` : mêmes champs, tous `@IsOptional()`, plus
`isActive?: boolean`.

Décorer chaque champ avec `@ApiProperty(...)` (voir
`backend/src/subjects/dto/create-subject.dto.ts` pour le style exact).

### Service (`backend/src/plans/plans.service.ts`)
- `create(dto: CreatePlanDto)` → `prisma.plan.create(...)`. Si
  `Prisma.PrismaClientKnownRequestError` code `P2002` (code déjà pris) →
  `ConflictException('Un plan avec ce code existe déjà.')` (voir
  `subjects.service.ts` pour le pattern exact de gestion de cette erreur).
- `findAll(includeInactive = false)` → liste tous les plans, triés par
  `priceAmount asc`. Par défaut ne retourne que `isActive: true` sauf si
  `includeInactive` est `true`.
- `findOne(id)` → 404 (`NotFoundException`) si absent.
- `update(id, dto: UpdatePlanDto)` → vérifie l'existence puis update.
- `deactivate(id)` → **pas de suppression physique** (un plan peut être
  référencé par des `Subscription` existantes) : met `isActive: false`.
  Pas de méthode `remove`/delete au sens SQL.

### Controller (`backend/src/plans/plans.controller.ts`)
Base path `platform/plans`. Toutes les routes `@Roles(Role.SUPER_ADMIN)`
sauf la liste qui doit aussi être lisible en lecture seule par un
`ADMIN` (pour qu'une école puisse voir le catalogue de plans disponibles,
utile pour le sous-projet 07 frontend self-service) :

```ts
@ApiTags('platform-plans')
@ApiBearerAuth()
@Controller('platform/plans')
export class PlansController {
  @Roles(Role.SUPER_ADMIN)
  @Post()
  create(@Body() dto: CreatePlanDto) {}

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {}
  // includeInactive est une query string ("true"/"false") à parser en booléen

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {}

  @Roles(Role.SUPER_ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {}

  @Roles(Role.SUPER_ADMIN)
  @Delete(':id')
  deactivate(@Param('id') id: string) {}
}
```

Attention : la liste des plans (`GET /platform/plans`) doit aussi être
accessible **sans authentification** pour alimenter la page d'inscription
publique self-service (sous-projet 04/07, un prospect doit pouvoir voir
les plans avant de créer un compte). Ajouter une route publique dédiée
plutôt que de retirer la protection de la route existante :
```ts
@Public()
@Get('public')
findAllPublic() {
  return this.plansService.findAll(false); // uniquement les plans actifs
}
```
(Déclarer cette route **avant** `@Get(':id')` dans la classe pour éviter
que NestJS ne la matche comme `:id = "public"` — même règle que pour
`students.controller.ts` avec `me/profile` et `my-children` déjà en place
avant `:id`.)

### Module (`backend/src/plans/plans.module.ts`)
Pattern standard (voir `subjects.module.ts`), exporter `PlansService` (le
sous-projet 04 en aura besoin pour vérifier qu'un `planId` existe et est
actif).

### Câblage dans `app.module.ts`
Ajouter `PlansModule` aux imports (même pattern que les modules
existants).

## Fichiers à créer
- `backend/src/plans/plans.module.ts`
- `backend/src/plans/plans.controller.ts`
- `backend/src/plans/plans.service.ts`
- `backend/src/plans/dto/create-plan.dto.ts`
- `backend/src/plans/dto/update-plan.dto.ts`

## Fichiers à modifier
- `backend/src/app.module.ts` (ajout de l'import)

## Ne pas toucher
- Tout le reste du backend existant.

## Critères d'acceptation
- `pnpm exec nest build` sans erreur.
- Test manuel (via Swagger `/docs` ou `curl`) : connecté en SUPER_ADMIN
  (voir sous-projet 02 pour obtenir un token — s'il n'y a pas encore de
  compte SUPER_ADMIN en base, en créer un temporairement via `psql`/un
  script Node ad-hoc juste pour le test, sans le committer), créer un
  plan, le lister, le modifier, le désactiver. Vérifier que
  `GET /platform/plans/public` répond sans token.
- Commit + push.
