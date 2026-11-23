# Sous-projet 12 — Élèves : compléments (photo, carte, diplôme)

## Dépend de
10 (schéma — bien que ce sous-projet n'ajoute en réalité **aucune**
nouvelle table, voir ci-dessous).

## Modèle recommandé : sonnet

## Contexte
Trois fonctionnalités du module "Élèves" du cahier des charges d'origine
restaient absentes. Toutes les trois s'appuient sur des champs **déjà
existants** — pas de migration nécessaire :
- Photo de profil → `User.photoUrl` existe déjà (actuellement jamais
  renseigné par un endpoint dédié).
- Carte d'élève → générée à la volée en PDF, aucun stockage.
- Remise de diplôme/transfert → `Enrollment.status` (`String`, défaut
  `"active"`) existe déjà, juste inutilisé au-delà de la valeur par défaut.

## Fichiers de référence
- `backend/src/students/students.service.ts` et `students.controller.ts`
  (fichiers à **étendre**, pas à recréer)
- Pour le PDF : aucune dépendance de génération PDF n'est encore installée
  dans ce projet. Installer `pdfkit` (`pnpm add pdfkit && pnpm add -D @types/pdfkit`)
  — légère, pas de dépendance système (contrairement à puppeteer).
- Pour l'upload : installer `@nestjs/platform-express` est déjà présent
  (c'est la plateforme HTTP du projet) ; utiliser `multer` via
  `FileInterceptor` de `@nestjs/platform-express` (`pnpm add -D @types/multer`,
  `multer` est déjà une dépendance transitive de `@nestjs/platform-express`,
  vérifier avec `pnpm why multer` avant de l'ajouter explicitement).

## Spec

### 1. Upload de photo (`POST /students/:id/photo`)
Dans `students.controller.ts`, ajouter une route `@Roles(Role.ADMIN)`
avec `@UseInterceptors(FileInterceptor('file'))`, body
`@UploadedFile() file: Express.Multer.File`. Stocker le fichier sur le
disque local du conteneur backend, dossier `backend/uploads/photos/`
(créer ce dossier, l'ajouter à `.gitignore` — ce sont des données, pas du
code), nom de fichier = `${studentProfile.id}-${Date.now()}${extname(file.originalname)}`.
Servir ce dossier en statique : dans `main.ts`, ajouter
`app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' })`
(NestJS Express — importer `useStaticAssets` depuis
`@nestjs/platform-express`). Le service met à jour
`User.photoUrl = '/uploads/photos/<nom-fichier>'`. Valider le type MIME
(`image/jpeg`, `image/png` uniquement) et une taille max (ex. 2 Mo) via
les options de `FileInterceptor` (`limits: { fileSize: 2 * 1024 * 1024 }`,
`fileFilter`). Appliquer le **même endpoint/logique** pour les enseignants
(`POST /teachers/:id/photo` dans `teachers.controller.ts`) — dupliquer le
petit bout de logique plutôt que sur-architecturer un module de fichiers
partagé pour deux endpoints.

### 2. Carte d'élève (`GET /students/:id/id-card`)
Nouvelle route `@Roles(Role.ADMIN)` (ou `Role.ADMIN, Role.TEACHER`) dans
`students.controller.ts`. Le service charge l'élève (réutiliser
`findOne`), génère un PDF au format carte (ex. 85x55mm, `pdfkit` permet
de définir la taille de page en points : `new PDFDocument({ size: [240, 153] })`
≈ ce format) contenant : nom de l'école, nom/prénom, numéro d'élève,
classe actuelle, photo si disponible (`doc.image(path, ...)` — lire le
fichier depuis `uploads/photos/` si `photoUrl` est renseigné, sinon
passer son emplacement). Retourner le buffer PDF avec
`res.set({ 'Content-Type': 'application/pdf' }); res.send(buffer)`
(utiliser `@Res() res` manuellement pour ce endpoint précis, pas le flux
de retour JSON habituel de NestJS).

### 3. Remise de diplôme / transfert (`POST /students/:id/graduate`)
Dans `students.service.ts`, nouvelle méthode `graduate(schoolId, id)` :
trouve l'inscription (`Enrollment`) la plus récente de l'élève (déjà un
pattern existant dans `findOne`/`studentInclude`), met son `status` à
`"graduated"`, et désactive le compte (`User.isActive = false`, même
pattern que `remove()` existant). Route `POST /students/:id/graduate`,
`@Roles(Role.ADMIN)`. Ne pas confondre avec `transfer()` qui existe déjà
(changement de classe/année en cours de scolarité) — `graduate` est une
sortie définitive.

## Fichiers à modifier (aucun fichier à créer, uniquement étendre l'existant)
- `backend/src/students/students.controller.ts`, `students.service.ts`
- `backend/src/teachers/teachers.controller.ts`, `teachers.service.ts`
  (route photo uniquement)
- `backend/src/main.ts` (fichiers statiques)
- `backend/.gitignore` (ajouter `uploads/`)
- `backend/package.json` (pdfkit, multer types)

## Ne pas toucher
Les autres modules de cette vague.

## Critères d'acceptation
- `pnpm exec nest build` sans erreur.
- Upload d'une image sur un élève → `GET /students/:id/me/profile` (ou
  `/students/:id`) reflète le nouveau `photoUrl`, le fichier est
  accessible via `GET /uploads/photos/<nom>`.
- `GET /students/:id/id-card` renvoie un PDF valide (vérifier les
  premiers octets `%PDF-`).
- `POST /students/:id/graduate` → l'élève n'apparaît plus dans
  `GET /students` (qui filtre déjà `isActive` ? vérifier — sinon
  ajouter ce filtre à cette occasion) et son compte ne permet plus de
  se connecter (`isActive: false`).
- Commit + push.
