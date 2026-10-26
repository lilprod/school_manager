# Vue d'ensemble — Phase "SaaS multi-tenant"

## Contexte du projet

`school_manager` est un système de gestion scolaire (NestJS/TypeScript/
Prisma/PostgreSQL pour le backend, React/TypeScript/Tailwind pour le
frontend). Une Phase 1 (MVP) est terminée et en production logique sur la
branche `claude/school-management-system-fz5xzt` : authentification JWT,
RBAC (ADMIN/TEACHER/STUDENT/PARENT), gestion école/classes/matières/élèves/
enseignants, présences, notes. Tout est scopé par `schoolId` dans une base
partagée (pattern multi-tenant "shared database, shared schema,
discriminator column").

Cette nouvelle phase transforme l'app en véritable plateforme SaaS :
- un rôle **SUPER_ADMIN** hors de toute école, qui gère la plateforme ;
- un catalogue de **plans/licences** ;
- un **provisioning** des écoles en deux modes : manuel (super-admin) et
  self-service (l'école s'inscrit elle-même, en attente de validation) ;
- une **facturation manuelle** (espèces / mobile money enregistrés à la
  main, aucune intégration API de paiement en v1) ;
- la prise en charge d'un **parent ayant des enfants dans plusieurs
  écoles différentes** (identité non rattachée à une seule école).

## Comment utiliser ces documents

Chaque fichier `NN-nom.md` de ce dossier est un **sous-projet autonome**,
rédigé pour être confié à un sous-agent qui n'a pas le contexte de cette
conversation. Chaque document contient : le contexte nécessaire, l'objectif,
les dépendances, la spec technique précise (endpoints, DTOs, champs), les
conventions de code à respecter, les fichiers à toucher, les fichiers à NE
PAS toucher (pour éviter les conflits entre sous-agents), et les critères
d'acceptation.

**Travail déjà fait** : le schéma Prisma (`backend/prisma/schema.prisma`)
a déjà été modifié pour ajouter les nouveaux modèles — voir le doc 01 pour
le détail exact et ce qu'il reste à faire (migration + vérification).
Rien d'autre n'a encore été codé pour cette phase.

## Graphe de dépendances — ordre d'exécution obligatoire

```
01 Schéma + migration
      │
      ▼
02 Auth multi-tenant + accès cross-école des parents
      │
      ├──────────────┬──────────────┐
      ▼              ▼              ▼
03 Module Plans   (peut démarrer en parallèle de 04/05
   (super-admin)   une fois 02 fait, mais 04 a besoin de
      │             plans existants pour les tests manuels)
      ▼
04 Provisioning écoles (manuel + self-service)
      │
      ▼
05 Abonnements & paiements manuels
      │
      ▼
06 Seed de démonstration mis à jour
      │
      ▼
07 Frontend — espace super-admin + inscription publique
      │
      ▼
08 Vérification end-to-end + mise à jour README
```

**Ces sous-projets ne sont PAS parallélisables entre eux dans l'ordre
01→02→03→04→05→06**, parce que chacun dépend d'un état de schéma/migration
et souvent de endpoints produits par le précédent, et que les migrations
Prisma sont intrinsèquement séquentielles (une seule base de dev). Un seul
sous-agent à la fois doit travailler sur le backend. Le frontend (07) peut
démarrer dès que 02-05 sont posés. 08 doit être fait en dernier.

Si plusieurs sous-agents sont lancés, les faire travailler **en séquence
sur la même branche**, chacun committant et poussant avant que le suivant
ne commence (le document suivant doit toujours lire l'état réel du repo,
pas supposer l'état décrit ici).

## Règles communes à tous les sous-projets

- **Branche** : `claude/school-management-system-fz5xzt` (déjà checked out).
  Ne pas créer de nouvelle branche.
- **Gestionnaire de paquets** : `pnpm` partout (jamais `npm`/`yarn`) — un
  bug connu de npm sur cet environnement empêche `npm install` de
  fonctionner sur ce projet.
- **Base de données locale** : PostgreSQL tourne nativement (pas de
  Docker daemon disponible dans les sandboxes de session). Si `pg_lsclusters`
  montre le cluster `down`, lancer `service postgresql start`. Les
  identifiants attendus par `backend/.env` sont `school:school@localhost:5432/school_manager`.
- **Style de code backend** : NestJS en ESM (`"type": "module"` dans
  `package.json`) — **tous les imports relatifs doivent avoir l'extension
  `.js`** même si le fichier source est `.ts` (convention NodeNext).
  DTOs avec `class-validator` + `@ApiProperty` (Swagger). Un module =
  `*.module.ts` + `*.controller.ts` + `*.service.ts` + `dto/*.dto.ts`,
  voir `backend/src/students/` comme référence complète de ce pattern.
- **RBAC** : décorateur `@Roles(Role.XXX)` + `RolesGuard` déjà global
  (posé dans `app.module.ts` via `APP_GUARD`). Une route sans `@Roles(...)`
  est accessible à tout utilisateur authentifié, quel que soit son rôle.
  `@Public()` retire aussi l'exigence d'authentification JWT (voir
  `auth.controller.ts` pour l'usage mixte public/protégé dans un même
  contrôleur).
- **Toujours vérifier avant de committer** : `cd backend && pnpm exec nest
  build` doit passer sans erreur. Pour le frontend : `cd frontend && pnpm
  build`. Ne jamais committer un état qui ne compile pas.
- **Commits** : un commit par sous-projet terminé, message descriptif en
  anglais (comme l'historique existant), push vers `origin` après chaque
  commit réussi.
- **Ne jamais** inventer d'intégration de paiement réelle (Stripe, etc.) :
  la facturation v1 est un enregistrement manuel en base, point final.
- **Ne jamais** ajouter d'envoi d'email réel (pas de service SMTP
  configuré) : toute vérification "email" en v1 se fait par validation
  manuelle du super-admin, pas par lien de confirmation envoyé par mail.

## Hors scope (noté pour plus tard, ne pas construire maintenant)

- Application des quotas de plan (`maxStudents`/`maxTeachers`/`maxClasses`)
  au moment de la création d'un élève/enseignant/classe — les champs
  existent dans `Plan`, mais leur **application** n'est pas demandée dans
  cette phase. Ne pas l'implémenter sauf demande explicite.
- Expiration automatique des essais (`trialEndsAt`) — pas de tâche planifiée
  (cron) dans ce projet pour l'instant. `trialEndsAt` est juste informatif.
- Routage par sous-domaine par école — reporté à une phase ultérieure.
- Durcissement de l'isolation via Prisma Client Extension — recommandé pour
  plus tard, pas dans cette phase.
