# Gestion d'École — School Management System

Système de gestion scolaire (MVP / Phase 1) : authentification par rôle,
gestion des élèves, enseignants, classes, matières, présences et notes.

Backend TypeScript/NestJS + PostgreSQL/Prisma, frontend React/TypeScript.
Voir [Roadmap](#roadmap--prochaines-phases) pour le périmètre complet prévu
(finances, bibliothèque, transport, mobile, etc.) et ce qui est déjà livré.

## Stack technique

| Composant | Technologie |
|---|---|
| Backend | NestJS (TypeScript, ESM), Prisma ORM, PostgreSQL |
| Authentification | JWT (access + refresh tokens rotatifs), RBAC |
| Rate-limiting | `@nestjs/throttler` (inscription self-service) |
| Fichiers / PDF | `multer` (upload photo), `pdfkit` (carte d'élève, bulletin PDF) |
| Frontend | React 19 + Vite, TypeScript, Tailwind CSS v4 |
| État / données | Zustand (auth), TanStack Query (données serveur) |
| Formulaires | React Hook Form + Zod |
| i18n | i18next (Français par défaut, Anglais) |
| Documentation API | Swagger (`/docs` sur le backend) |

## Structure du dépôt

```
backend/    API NestJS + schéma Prisma + migrations + seed
frontend/   Application web React
docker-compose.yml
```

## Démarrage rapide (sans Docker — recommandé pour le développement)

Prérequis : Node.js 22+, pnpm, PostgreSQL 16 accessible en local.

### 1. Base de données

Créez une base et un rôle PostgreSQL correspondant à `backend/.env` (ou
copiez `.env.example` et adaptez-le) :

```bash
createuser school --createdb --pwprompt   # mot de passe: school
createdb school_manager -O school
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # adapter si besoin
pnpm install
pnpm exec prisma migrate deploy   # applique les migrations
pnpm db:seed                      # données de démonstration
pnpm start:dev                    # http://localhost:3000, docs: /docs
```

### 3. Frontend

```bash
cd frontend
pnpm install
pnpm dev   # http://localhost:5173 (proxy /api -> backend :3000)
```

## Démarrage avec Docker Compose

```bash
docker compose up --build
# Backend:  http://localhost:3000 (docs: /docs)
# Frontend: http://localhost:8080
```

Le conteneur backend applique automatiquement les migrations au démarrage
(`prisma migrate deploy`). Pour charger les données de démonstration :

```bash
docker compose exec backend pnpm db:seed
```

> Note : cette configuration Docker a été validée syntaxiquement
> (`docker compose config`) mais n'a pas pu être testée en exécution dans
> l'environnement de développement de cette session (démon Docker non
> disponible). Le flux applicatif complet a en revanche été testé de bout
> en bout en navigateur réel via le mode "sans Docker" ci-dessus.

## Architecture multi-tenant

Le système héberge plusieurs écoles sur une base de données et un schéma
partagés ("shared database, shared schema") : la colonne `schoolId`,
présente sur la quasi-totalité des tables, sert de discriminant et toutes
les requêtes applicatives sont scopées par cette valeur. Le rôle
`SUPER_ADMIN` opère au niveau plateforme et n'est rattaché à aucune école
(`schoolId` nul) ; il gère les écoles, les plans et les abonnements. Un
parent peut avoir des enfants inscrits dans plusieurs écoles différentes :
son compte n'est donc, lui non plus, pas rattaché à une école unique, et
l'accès à ses enfants n'est jamais filtré par `schoolId`.

## Comptes de démonstration

Après `pnpm db:seed`, tous les comptes partagent le mot de passe
`Password123!` :

| Rôle | Email |
|---|---|
| Super-administrateur (plateforme) | super.admin@platform.app |
| Administrateur | admin@ecole.fr |
| Enseignant | prof.math@ecole.fr, prof.francais@ecole.fr |
| Élève | eleve1@ecole.fr … eleve8@ecole.fr |
| Parent | parent1@ecole.fr, parent2@ecole.fr |

Le seed crée également trois écoles illustrant les statuts possibles :
une école active avec abonnement payé (Lycée Victor Hugo), une école
active en période d'essai sans paiement encore enregistré (Collège
Molière), et une école en attente d'approbation (École Les Flamboyants).
Le compte `parent1@ecole.fr` a des enfants dans deux écoles différentes,
pour illustrer le support des parents multi-écoles.

## Fonctionnalités livrées (Phase 1 — MVP)

- **Authentification** : JWT access + refresh tokens rotatifs, RBAC
  (SUPER_ADMIN / ADMIN / TEACHER / STUDENT / PARENT), changement de mot
  de passe
- **Administration** : profil école, années académiques, classes, matières
- **Élèves** : inscription, profils, historique de classe, transfert,
  liaison avec les parents/tuteurs
- **Enseignants** : profils, affectation classe + matière + année
- **Présences** : saisie individuelle ou par classe entière, historique,
  résumé par élève (accessible à l'élève et à ses parents)
- **Notes** : évaluations (examen/quiz/devoir/projet), saisie en masse,
  moyennes par matière et bulletin (normalisés sur 20)
- **Interface** : tableaux de bord par rôle, FR/EN, mode sombre, design
  responsive

### Plateforme SaaS (Phase 1.5)

- **Provisioning des écoles** : création manuelle par un super-admin
  (école immédiatement active) et inscription self-service publique
  (`/signup`, école en attente d'approbation)
- **Plans / licences** : CRUD des plans (quotas, tarifs, périodicité),
  exposition publique des plans actifs pour le formulaire d'inscription
- **Abonnements** : suivi du statut (essai/actif/suspendu/annulé) par
  école, approbation/suspension/réactivation par le super-admin
- **Paiements manuels** : enregistrement d'un paiement (espèces ou mobile
  money, pas d'intégration API en v1), historique par école, mise à jour
  automatique de l'échéance d'abonnement
- **Parents multi-écoles** : un même parent peut consulter les données de
  ses enfants scolarisés dans des écoles différentes

### Modules opérationnels

- **Administratif** : gestion des salles, emploi du temps par classe
  (créneaux jour/heure/matière/enseignant/salle) avec détection des
  chevauchements (même enseignant ou même salle)
- **Élèves (compléments)** : photo de profil (upload), carte d'élève
  générée en PDF, passage au statut diplômé/transféré
- **Enseignants / Staff** : présence du personnel enseignant, historique
  des contrats (temps plein/partiel/CDD, sans calcul de paie),
  évaluations
- **Académique** : programmes (syllabus) par matière/classe/année,
  plans de cours par enseignant, devoirs avec soumission par l'élève et
  correction par l'enseignant
- **Communication** : messagerie directe entre utilisateurs (règles
  d'accès spécifiques au parent multi-écoles), annonces ciblées par
  rôle et/ou classe, demandes de rendez-vous parent-enseignant
  (confirmation/annulation/clôture)
- **Finance (frais de scolarité)** : barèmes de frais, facturation
  individuelle ou par classe entière, paiements partiels ou complets
  (espèces/mobile money) avec statut de facture dérivé automatiquement
  (en attente/partiellement payée/payée/en retard/annulée) — **distinct**
  de la facturation SaaS plateforme (abonnement école → plateforme)
- **Rapports** : exports CSV (présences, finances, présences du
  personnel), export PDF du bulletin, résumé agrégé pour le tableau de
  bord administrateur (effectifs, taux de présence, factures impayées,
  dépenses du mois)

## Roadmap — prochaines phases

Le prompt d'origine couvrait un ERP scolaire complet (12 modules, apps
web + mobile). Les Phases 1 et 1.5 livrent les fondations et la
gouvernance SaaS multi-écoles ; les modules opérationnels ci-dessus
complètent la gestion quotidienne d'une école. Prochaines étapes
suggérées :

- **Phase 2** : bibliothèque
- **Phase 3** : transport, analytics avancés (tableaux de bord BI),
  application mobile (React Native), intégration paiement en ligne (Stripe)

Hors scope, noté pour plus tard (voir `docs/delegation/00-OVERVIEW.md` et
`docs/delegation/09-OVERVIEW-OPS.md`) :

- Application effective des quotas de plan (`maxStudents`/`maxTeachers`/
  `maxClasses`)
- Expiration automatique des essais (`trialEndsAt`)
- Routage par sous-domaine dédié à chaque école
- Durcissement de l'isolation multi-tenant via une Prisma Client
  Extension (au-delà du scoping applicatif actuel par `schoolId`)
- Paie réelle (calcul de charges sociales, bulletins de salaire) — les
  contrats enregistrent uniquement les termes (salaire, type, dates)
- Export Excel natif (`.xlsx`) — les rapports tabulaires sont en CSV
- Pièces jointes de fichiers réels (devoirs, messages) — texte/URL
  uniquement en v1, pas d'intégration S3/Cloudinary
- Notifications push/email/SMS pour messages et annonces — in-app
  uniquement (lecture au prochain login)

## Sécurité

- Mots de passe hachés (bcrypt), jamais retournés par l'API
- Refresh tokens hachés en base (SHA-256) et révocables
- Validation stricte des entrées (class-validator, `whitelist` +
  `forbidNonWhitelisted`)
- Isolation des données par école (toutes les requêtes sont scopées par
  `schoolId`)
- Journal d'audit basique (`AuditLog`) sur les connexions
- Rate-limiting sur l'inscription self-service publique (`/platform/schools/signup`)
  pour limiter les abus (`@nestjs/throttler`)
- Upload de photo de profil validé côté serveur (type MIME JPEG/PNG
  uniquement, taille maximale 2 Mo) avant écriture sur disque
- Messagerie directe avec contrôle d'accès cross-école : un ADMIN/TEACHER
  ne peut écrire qu'aux utilisateurs de sa propre école ; un PARENT peut
  écrire aux enseignants de n'importe laquelle des écoles de ses enfants,
  jamais à un utilisateur sans lien réel avec lui
