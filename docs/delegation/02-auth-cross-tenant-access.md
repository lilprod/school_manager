# Sous-projet 02 — Auth multi-tenant + accès cross-école des parents

## Dépend de
01 (schéma + migration déjà appliquée et commitée).

## Bloque
03, 04, 05 (toutes les routes `SUPER_ADMIN` s'appuient sur ce qui est fait
ici), et la correction parent est un pré-requis pour que le seed (06) et
les tests (08) puissent démontrer le scénario "parent avec enfants dans
plusieurs écoles".

## Contexte
Avant cette tâche, `User.schoolId` était non-nullable et chaque service
scope ses requêtes par `schoolId`. Le schéma permet maintenant
`schoolId: null` (pour `SUPER_ADMIN` et pour `PARENT`), mais **tout le
code applicatif suppose encore qu'il existe toujours** — ce qui va soit
casser la compilation TypeScript, soit (pire) produire des résultats vides
silencieux pour un parent multi-écoles. Cette tâche a deux volets
indissociables :

**Volet A — relâcher le typage** pour que `schoolId: string | null` se
propage proprement (JWT, guard, decorator).

**Volet B — corriger le bug réel** : plusieurs services scopent une
requête "est-ce que je peux voir cet élève / ses présences / ses notes ?"
en utilisant `user.schoolId` (l'école du **demandeur**) comme filtre,
alors qu'il faudrait soit ne pas filtrer par école du tout pour un parent
(puisqu'il peut avoir des enfants dans des écoles différentes de la
sienne — qui n'existe même plus), soit filtrer par l'école **de l'élève
consulté**, jamais celle du demandeur.

## Fichiers à lire avant de commencer (pour le style et le contexte exact)
- `backend/src/auth/types/authenticated-user.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/strategies/jwt.strategy.ts`
- `backend/src/common/access/student-access.service.ts`
- `backend/src/students/students.service.ts` (méthodes `findMyProfile`,
  `findMyChildren`)
- `backend/src/attendance/attendance.service.ts` (méthodes
  `findForStudent`, `summaryForStudent`)
- `backend/src/grading/grading.service.ts` (méthodes `gradesForStudent`,
  `reportCard`)

## Changements précis à apporter

### 1. `AuthenticatedUser` (type)
```ts
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  schoolId: string | null;
}
```

### 2. `JwtStrategy.validate` et `AuthService`
Le payload JWT signé (`signAccessToken`) et la méthode `validate` du
`JwtStrategy` retournent déjà `user.schoolId` tel quel — il suffit que le
type `JwtPayload.schoolId` et le retour de `validate` acceptent
`string | null`. Aucune logique à changer, seulement les types (et au
besoin l'annotation du payload signé dans `signAccessToken`).

### 3. `StudentAccessService.assertCanView`
Signature actuelle : `assertCanView(schoolId: string, requester, studentId)`.
Nouvelle signature : `assertCanView(schoolId: string | null, requester, studentId)`.

Le `where` de la recherche de l'élève doit devenir conditionnel :
```ts
const student = await this.prisma.studentProfile.findFirst({
  where: { id: studentId, ...(schoolId ? { user: { schoolId } } : {}) },
});
```
Logique de rôle inchangée pour ADMIN/TEACHER/STUDENT. Pour PARENT, la
vérification du lien `ParentStudent` reste la vraie barrière de sécurité
(déjà correcte) — ne pas y toucher.

### 4. Tous les appelants de `assertCanView`
Dans `attendance.service.ts` (`findForStudent`, `summaryForStudent`) et
`grading.service.ts` (`gradesForStudent`, `reportCard`) : **après** l'appel
à `assertCanView`, ces méthodes refiltrent la vraie requête de données par
`classGroup: { schoolId }` (ou `assessment: { classGroup: { schoolId } } }`)
en utilisant **le `schoolId` du demandeur**. C'est le même bug : pour un
parent avec `schoolId = null`, ce filtre retourne un tableau vide même
après un contrôle d'accès réussi. Retirer ce filtre `schoolId` de la
requête de données elle-même une fois l'accès validé par
`assertCanView` — il n'apporte rien de plus que la vérification déjà
faite (le `studentId` est déjà garanti valide et autorisé à ce stade).
Exemple de correction dans `attendance.service.ts` :
```ts
async findForStudent(schoolId: string | null, requester: Requester, studentId: string) {
  await this.studentAccess.assertCanView(schoolId, requester, studentId);
  return this.prisma.attendance.findMany({
    where: { studentId },               // <- plus de classGroup: { schoolId }
    include: { classGroup: true, subject: true },
    orderBy: { date: 'desc' },
  });
}
```
Appliquer le même principe à `summaryForStudent`, `gradesForStudent`,
`reportCard`.

### 5. `StudentsService.findMyProfile` / `findMyChildren`
- `findMyProfile(schoolId, userId)` : **ne pas changer** — un `STUDENT` a
  toujours un `schoolId` non-null, ce filtre reste correct et utile.
- `findMyChildren(schoolId, parentUserId)` : **bug réel, à corriger**.
  Actuellement :
  ```ts
  const parentProfile = await this.prisma.parentProfile.findFirst({
    where: { userId: parentUserId, user: { schoolId } },
  });
  ...
  const students = await this.prisma.studentProfile.findMany({
    where: { guardians: { some: { parentId: parentProfile.id } }, user: { schoolId } },
    ...
  });
  ```
  Retirer complètement `user: { schoolId }` des deux `where` (le
  `parentProfile` se cherche uniquement par `userId` ; les enfants se
  cherchent uniquement via le lien `guardians`/`ParentStudent`, sans
  filtre d'école — c'est précisément ce qui permet des enfants dans des
  écoles différentes). Changer la signature en
  `findMyChildren(parentUserId: string)` (le paramètre `schoolId` devient
  inutile, le supprimer plutôt que de le garder mort) et mettre à jour le
  seul appelant dans `students.controller.ts` (`findMyChildren`, route
  `GET /students/my-children`) en conséquence.

### 6. Décorateur `@Roles` et `RolesGuard` — **aucun changement requis**
`RolesGuard` vérifie déjà `requiredRoles.includes(user.role)` sans se
soucier de `schoolId`. Ajouter `@Roles(Role.SUPER_ADMIN)` sur une future
route fonctionnera tel quel. Ne pas créer de nouveau guard "platform" —
ce serait une duplication inutile.

### 7. Contrôleurs appelant les méthodes modifiées
Mettre à jour les signatures des appels dans `attendance.controller.ts`,
`grading.controller.ts`, `students.controller.ts` pour correspondre aux
nouvelles signatures de service (essentiellement : s'assurer que
`user.schoolId` (désormais `string | null`) se propage sans forcer de cast
`as string`).

## Fichiers à modifier (liste complète)
- `backend/src/auth/types/authenticated-user.ts`
- `backend/src/auth/strategies/jwt.strategy.ts`
- `backend/src/auth/auth.service.ts` (uniquement les types, pas la logique)
- `backend/src/common/access/student-access.service.ts`
- `backend/src/attendance/attendance.service.ts`
- `backend/src/grading/grading.service.ts`
- `backend/src/students/students.service.ts`
- `backend/src/students/students.controller.ts`

## Ne pas toucher
- `backend/prisma/schema.prisma` (déjà fait au sous-projet 01)
- `RolesGuard`, `JwtAuthGuard`, les décorateurs `@Roles`/`@Public`/
  `@CurrentUser` (aucun changement nécessaire, voir point 6)
- Les modules `schools/`, `teachers/`, `class-groups/`, `subjects/`,
  `academic-years/` (ADMIN/TEACHER gardent un `schoolId` non-null, rien à
  y corriger)

## Critères d'acceptation
- `cd backend && pnpm exec nest build` : **zéro erreur** (y compris les
  erreurs de type `schoolId` laissées de côté au sous-projet 01).
- Test manuel minimal avant de committer : créer (via `psql` ou un script
  ad-hoc, pas besoin d'endpoint dédié à ce stade) un `ParentProfile` lié à
  deux `StudentProfile` appartenant à deux écoles différentes, se
  connecter en tant que ce parent, appeler `GET /students/my-children` et
  vérifier que les **deux** enfants apparaissent.
- Commit + push.
