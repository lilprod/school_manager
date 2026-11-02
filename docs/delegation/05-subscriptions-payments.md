# Sous-projet 05 — Abonnements & paiements manuels (espèces / mobile money)

## Dépend de
01 (schéma), 02 (auth), 04 (provisioning — une école doit pouvoir avoir
un abonnement avant d'enregistrer un paiement dessus).

## Bloque
06 (seed), 07 (frontend), 08.

## Contexte
Le super-admin reçoit un paiement **physiquement** (espèces ou mobile
money, hors de l'application — aucune intégration d'API de paiement en
v1) puis vient **l'enregistrer** dans l'app. Cet enregistrement doit avoir
un effet réel sur l'abonnement (pas juste un log) : il fait passer
l'abonnement de l'école en `ACTIVE` s'il ne l'était pas, et prolonge sa
période courante.

## Fichiers de référence à lire
- `backend/src/attendance/attendance.service.ts` (pattern de calcul de
  dates, transactions Prisma)
- `backend/src/platform-schools/` (créé au sous-projet 04 — ce
  sous-projet dépend directement de ses modèles/services ; lire
  `platform-schools.service.ts` pour comprendre comment `Subscription`
  est déjà créée là-bas)

## Spec exacte

### DTO (`backend/src/subscriptions/dto/record-payment.dto.ts`)
```ts
export class RecordPaymentDto {
  amount: number;        // @IsNumber() @Min(0)
  currency?: string;     // @IsOptional() @IsString() — défaut celle du plan
  method: 'CASH' | 'MOBILE_MONEY'; // @IsEnum(PaymentMethod)
  reference?: string;    // @IsOptional() @IsString() — ex: id de transaction mobile money, saisi à la main
  notes?: string;        // @IsOptional() @IsString()
  paidAt?: string;       // @IsOptional() @IsDateString() — défaut: maintenant
}
```

### DTO (`backend/src/subscriptions/dto/update-subscription.dto.ts`)
```ts
export class UpdateSubscriptionDto {
  planId?: string;    // @IsOptional() @IsString() — changement de plan (upgrade/downgrade)
  status?: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED'; // @IsOptional() @IsEnum(...)
}
```

### Service (`backend/src/subscriptions/subscriptions.service.ts`)

- **`findBySchool(schoolId)`** : retourne l'abonnement de l'école avec
  `plan` inclus et ses `payments` triés par `paidAt desc`. 404 si l'école
  n'a pas d'abonnement (cas d'une école encore `PENDING_APPROVAL`).

- **`recordPayment(schoolId, recordedById, dto: RecordPaymentDto)`** :
  1. Récupère l'abonnement de l'école (404 si absent — on ne peut pas
     payer un abonnement qui n'existe pas, il faut d'abord `approve` au
     sous-projet 04).
  2. Crée la ligne `Payment` (`subscriptionId`, tous les champs du DTO,
     `recordedById` = l'utilisateur SUPER_ADMIN connecté,
     `currency: dto.currency ?? subscription.plan.currency`,
     `paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date()`).
  3. **Calcule et applique la nouvelle période** : si
     `subscription.status` n'est pas `ACTIVE`, le repasse à `ACTIVE`. Le
     nouveau `currentPeriodEnd` = (la plus tardive entre `now` et
     l'actuel `currentPeriodEnd`) **+ 1 mois** si
     `plan.billingPeriod === 'MONTHLY'`, **+ 1 an** si `'YEARLY'`. Utiliser
     une fonction utilitaire simple avec `Date` natif (pas besoin d'une
     librairie de dates pour ce calcul).
  4. Fait les étapes 2-3 dans un `$transaction`. Retourne l'abonnement
     mis à jour avec la liste des paiements.

- **`update(schoolId, dto: UpdateSubscriptionDto)`** : changement manuel
  de plan et/ou de statut par le super-admin (ex: suspendre pour impayé
  sans passer par `recordPayment`). Vérifie que le nouveau `planId`
  existe et est actif si fourni.

### Controller (`backend/src/subscriptions/subscriptions.controller.ts`)
Base path `platform/schools/:schoolId/subscription` — toutes les routes
`@Roles(Role.SUPER_ADMIN)` :
```ts
@Get()
findBySchool(@Param('schoolId') schoolId: string) {}

@Patch()
update(@Param('schoolId') schoolId: string, @Body() dto: UpdateSubscriptionDto) {}

@Post('payments')
recordPayment(
  @CurrentUser() user: AuthenticatedUser,
  @Param('schoolId') schoolId: string,
  @Body() dto: RecordPaymentDto,
) {}

@Get('payments')
listPayments(@Param('schoolId') schoolId: string) {}
```

## Fichiers à créer
- `backend/src/subscriptions/subscriptions.module.ts`
- `backend/src/subscriptions/subscriptions.controller.ts`
- `backend/src/subscriptions/subscriptions.service.ts`
- `backend/src/subscriptions/dto/record-payment.dto.ts`
- `backend/src/subscriptions/dto/update-subscription.dto.ts`

## Fichiers à modifier
- `backend/src/app.module.ts` (import `SubscriptionsModule`)

## Ne pas toucher
- `backend/src/platform-schools/` (sous-projet 04 — consommer seulement,
  ne pas dupliquer la logique de création d'abonnement qui s'y trouve
  déjà pour le cas `approve`/`createManually`).

## Critères d'acceptation
- `pnpm exec nest build` sans erreur.
- Test manuel : approuver une école en attente (sous-projet 04) avec un
  plan mensuel → `currentPeriodEnd` est `null` ou non défini à ce stade
  (c'est normal, seule `recordPayment` fixe une échéance). Enregistrer un
  paiement `CASH` → l'abonnement passe/reste `ACTIVE` et
  `currentPeriodEnd` est maintenant "aujourd'hui + 1 mois". Enregistrer un
  second paiement → l'échéance avance encore d'un mois à partir de la
  précédente échéance (pas à partir d'aujourd'hui, si l'échéance
  précédente est dans le futur).
- `GET .../payments` retourne l'historique dans l'ordre antéchronologique.
- Commit + push.
