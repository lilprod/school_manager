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

## Comptes de démonstration

Après `pnpm db:seed`, tous les comptes partagent le mot de passe
`Password123!` :

| Rôle | Email |
|---|---|
| Administrateur | admin@ecole.fr |
| Enseignant | prof.math@ecole.fr, prof.francais@ecole.fr |
| Élève | eleve1@ecole.fr … eleve8@ecole.fr |
| Parent | parent1@ecole.fr, parent2@ecole.fr |

## Fonctionnalités livrées (Phase 1 — MVP)

- **Authentification** : JWT access + refresh tokens rotatifs, RBAC
  (ADMIN / TEACHER / STUDENT / PARENT), changement de mot de passe
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

## Roadmap — prochaines phases

Le prompt d'origine couvrait un ERP scolaire complet (12 modules, apps
web + mobile). Cette Phase 1 livre les fondations (auth, élèves,
enseignants, présences, notes). Prochaines étapes suggérées :

- **Phase 2** : finances (frais, factures, paiements), communication
  (messagerie, annonces), bibliothèque
- **Phase 3** : transport, rapports/analytics avancés (export PDF/Excel),
  application mobile (React Native), intégration paiement en ligne (Stripe)

## Sécurité

- Mots de passe hachés (bcrypt), jamais retournés par l'API
- Refresh tokens hachés en base (SHA-256) et révocables
- Validation stricte des entrées (class-validator, `whitelist` +
  `forbidNonWhitelisted`)
- Isolation des données par école (toutes les requêtes sont scopées par
  `schoolId`)
- Journal d'audit basique (`AuditLog`) sur les connexions
