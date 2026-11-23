# Sous-projet 16 — Finance : frais de scolarité, factures, paiements, dépenses

## Dépend de
10 (schéma : `FeeStructure`, `Invoice`, `FeePayment`, `Expense`).

## Modèle recommandé : sonnet, effort élevé
Manipulation d'argent réel (frais de scolarité des familles) — vérifier
les calculs de solde avec le même soin que le sous-projet 05 (paiements
d'abonnement SaaS), dont c'est ici l'équivalent côté école↔parent.

## ⚠️ Rappel — ne pas confondre avec l'existant
`Payment`/`Subscription` (sous-projets 01/04/05) = abonnement **école →
plateforme** (SaaS). Ce sous-projet = frais de scolarité **parent →
école**. Deux domaines métier séparés, deux jeux de tables séparés déjà
posés au sous-projet 10 (`FeePayment`/`Invoice` ici,
`Payment`/`Subscription` ailleurs). Ne touchez à aucun fichier de
`backend/src/subscriptions/` ou `backend/src/platform-schools/`.

## Fichiers de référence
`backend/src/subscriptions/subscriptions.service.ts` (pattern
d'enregistrement de paiement — mais **attention**, la logique de calcul
y est différente : ici pas de "période d'abonnement" à prolonger, c'est
un solde de facture à réduire).

## Spec — Barème de frais (`backend/src/fee-structures/`)
DTO `CreateFeeStructureDto { academicYearId, classGroupId?, name, amount: number, currency?: string }`.
CRUD standard scopé par école, `@Roles(Role.ADMIN)` pour create/update/
remove, lecture `@Roles(Role.ADMIN)` uniquement (information financière
interne, pas besoin que profs/élèves la consultent directement — ils
verront le montant via leur facture). Base path `fee-structures`.

## Spec — Factures (`backend/src/invoices/`)
DTO `CreateInvoiceDto { studentId, feeStructureId?, amount?: number, currency?: string, dueDate: string }`
(si `feeStructureId` fourni et `amount` absent, reprendre le montant/devise
du barème). DTO `CreateBulkInvoicesDto { feeStructureId: string, classGroupId: string, dueDate: string }`
— crée une facture pour chaque élève actuellement inscrit dans
`classGroupId` avec le montant du barème (cas d'usage principal : facturer
toute une classe d'un coup).

Service :
- `create(schoolId, dto)`, `createBulkForClass(schoolId, dto)` (boucle
  sur les élèves de la classe, `createMany` ou boucle de `create` dans
  une transaction — ignorer silencieusement un élève qui a déjà une
  facture pour ce même `feeStructureId` plutôt que planter toute
  l'opération : logguer/compter les ignorés, retourner
  `{ created: number, skipped: number }`).
- `findAll(schoolId, filters: { studentId?, status?, classGroupId? })`.
- `findOne(schoolId, id)` avec `payments` inclus.
- **`recalculateStatus(invoiceId)`** (méthode privée appelée après
  chaque paiement) : somme des `FeePayment.amount` de la facture ; si
  `0` → `PENDING` ; si `< invoice.amount` → `PARTIALLY_PAID` ; si
  `>= invoice.amount` → `PAID` (ne jamais rembourser un trop-perçu en
  v1, juste plafonner l'affichage si besoin côté frontend) ; si
  `dueDate < now()` et statut encore `PENDING`/`PARTIALLY_PAID` →
  `OVERDUE` à la place (calculer ce dernier cas aussi au moment de la
  **lecture** dans `findAll`/`findOne`, pas seulement après paiement,
  sinon une facture impayée reste `PENDING` indéfiniment même après
  échéance — appliquer un petit helper `deriveDisplayStatus(invoice)`
  utilisé en lecture, sans forcément réécrire le champ en base à chaque
  lecture).

## Spec — Paiements de frais (`backend/src/invoices/` toujours, sous-ressource)
DTO `RecordFeePaymentDto { amount: number, method: PaymentMethod, reference?: string, paidAt?: string }`.
`recordPayment(invoiceId, recordedById, dto)` : crée le `FeePayment`,
appelle `recalculateStatus`, retourne la facture à jour avec son
historique de paiements. **Valider que le paiement ne dépasse pas le
solde restant** (`amount` demandé ≤ `invoice.amount - sommeDéjàPayée`) —
sinon `BadRequestException('Ce paiement dépasse le solde restant dû.')`
(contrairement à l'abonnement SaaS, ici un trop-perçu n'a pas de sens
métier clair, donc on le bloque plutôt que de l'autoriser silencieusement).

Controller : base path `students/:studentId/invoices` pour la vue par
élève (`GET`), et `invoices` pour la gestion globale
(`POST`, `POST /bulk`, `GET`, `GET :id`, `POST :id/payments`). Tout en
`@Roles(Role.ADMIN)` sauf `GET students/:studentId/invoices` qui doit
aussi être lisible par le `STUDENT` lui-même et son/ses `PARENT`
(réutiliser le pattern de vérification d'accès de
`StudentAccessService.assertCanView` — l'importer, ne pas dupliquer).

## Spec — Dépenses (`backend/src/expenses/`)
DTO `CreateExpenseDto { category: string, amount: number, currency?: string, description?: string, date?: string }`.
CRUD simple scopé par école, `@Roles(Role.ADMIN)` partout. Base path
`expenses`.

## Fichiers à créer
- `backend/src/fee-structures/` (module + controller + service + dto)
- `backend/src/invoices/` (module + controller + service + dto)
- `backend/src/expenses/` (module + controller + service + dto)

## Fichiers à modifier
- `backend/src/app.module.ts` (trois imports)

## Ne pas toucher
`backend/src/subscriptions/`, `backend/src/platform-schools/` (voir
avertissement en tête de document).

## Critères d'acceptation
- `pnpm exec nest build` sans erreur.
- Facturation en masse d'une classe de 3 élèves → 3 factures créées ;
  relancer la même opération → `skipped: 3, created: 0`.
- Paiement partiel → statut `PARTIALLY_PAID`, solde restant correct.
  Paiement complémentaire qui solde → `PAID`.
- Tentative de paiement supérieur au solde restant → 400.
- Facture dont la `dueDate` est passée et non soldée → apparaît comme
  `OVERDUE` en lecture.
- Un élève voit ses propres factures ; un élève d'une autre famille ne
  peut pas voir celles d'un autre élève (403/404).
- Commit + push.
