# Sous-projet 15 — Communication : messagerie, annonces, réunions

## Dépend de
10 (schéma : `Message`, `Announcement`, `ParentTeacherMeeting`), et
indirectement de la correction d'accès cross-école du sous-projet 02
(un parent doit pouvoir écrire aux enseignants de n'importe laquelle de
ses écoles — même principe que `StudentAccessService`, voir ci-dessous).

## Modèle recommandé : sonnet

## Fichiers de référence
- `backend/src/common/access/student-access.service.ts` (pattern à
  réutiliser pour vérifier qu'un parent a bien un enfant dans l'école de
  l'enseignant à qui il écrit/demande un rendez-vous)
- `backend/src/attendance/` (pattern CRUD + résumé)

## Spec — Messagerie (`backend/src/messages/`)
DTO `SendMessageDto { recipientId: string, content: string }`.
Service :
- `send(senderId, dto)` : vérifie que l'expéditeur a le droit d'écrire au
  destinataire — règle : même `schoolId` (ADMIN/TEACHER/STUDENT entre
  eux au sein d'une école), **ou** lien `ParentStudent` existant entre
  l'expéditeur/destinataire parent et un élève de l'autre école (si l'un
  des deux est `PARENT`). Implémenter une petite méthode privée
  `assertCanMessage(sender, recipientId)` : si `sender.role === 'PARENT'`
  ou destinataire `role === 'PARENT'`, vérifier via `ParentStudent` qu'un
  élève commun existe dans l'école de l'autre ; sinon comparer les
  `schoolId`. Sinon `ForbiddenException`.
- `findInbox(userId)` : messages reçus, tri `createdAt desc`, inclut
  `sender` (prénom/nom/rôle).
- `findSent(userId)` : messages envoyés.
- `markAsRead(userId, messageId)` : vérifie que `recipientId === userId`,
  met `readAt = now()` si pas déjà lu.
- `unreadCount(userId)`.

Controller : base path `messages`, aucune restriction de rôle particulière
(tous les rôles authentifiés peuvent échanger, la vérification fine est
dans le service) : `POST /messages`, `GET /messages/inbox`,
`GET /messages/sent`, `PATCH /messages/:id/read`,
`GET /messages/unread-count`.

## Spec — Annonces (`backend/src/announcements/`)
DTO `CreateAnnouncementDto { title, content, audience?: AnnouncementAudience, classGroupId? }`
(`audience` défaut `ALL`). Service : `create(schoolId, authorId, dto)`
`@Roles(Role.ADMIN, Role.TEACHER)` (un enseignant ne peut cibler que
`audience: 'STUDENT'`/`'PARENT'` avec un `classGroupId` qui lui est
assigné — vérifier via `TeacherAssignment` ; un ADMIN peut tout cibler
sans restriction). `findAllForUser(schoolId, user)` : filtre les
annonces où `audience === 'ALL'` **ou** `audience === user.role` **ou**
(`classGroupId` correspond à la classe de l'élève/enfant du demandeur —
pour un ADMIN/TEACHER retourner simplement toutes les annonces de
l'école). `remove(schoolId, id)` `@Roles(Role.ADMIN)` uniquement (un
enseignant ne supprime pas, il peut seulement créer — évite qu'il efface
une annonce d'un collègue).

Controller : base path `announcements`, `POST`/`DELETE :id` comme
ci-dessus, `GET` ouvert à tous les rôles authentifiés (filtrage dans le
service).

## Spec — Réunions parents-profs (`backend/src/meetings/`)
DTO `RequestMeetingDto { teacherId, studentId, scheduledAt: string, notes? }`.
Service :
- `request(parentId, dto)` `@Roles(Role.PARENT)` : vérifie le lien
  `ParentStudent` (réutiliser `StudentAccessService` ou dupliquer la
  vérification de guardian — ce service est petit, dupliquer trois
  lignes est acceptable plutôt que de créer une dépendance croisée entre
  modules), crée avec `status: 'REQUESTED'`.
- `confirm(teacherId, meetingId)` / `cancel(...)` `@Roles(Role.TEACHER, Role.ADMIN)` :
  vérifie que la réunion concerne bien ce `teacherId` (sauf si ADMIN).
- `findAllForUser(user)` : un `PARENT` voit ses propres demandes
  (`parentId`), un `TEACHER` voit celles qui lui sont adressées
  (`teacherId`), un `ADMIN` voit tout pour son école (jointure via
  `teacher.user.schoolId`).

Controller : base path `meetings`, `POST` (parent), `PATCH :id/confirm`,
`PATCH :id/cancel` (teacher/admin), `GET` (filtré par rôle dans le
service, pas de `@Roles` bloquant sur la lecture).

## Fichiers à créer
- `backend/src/messages/` (module + controller + service + dto)
- `backend/src/announcements/` (module + controller + service + dto)
- `backend/src/meetings/` (module + controller + service + dto)

## Fichiers à modifier
- `backend/src/app.module.ts` (trois imports)

## Ne pas toucher
`backend/src/common/access/student-access.service.ts` (le consommer en
lecture si besoin, ne pas le modifier — il est déjà correct pour son
usage actuel).

## Critères d'acceptation
- `pnpm exec nest build` sans erreur.
- Un ADMIN et un TEACHER de la même école échangent un message ; un
  utilisateur d'une autre école ne peut pas leur écrire (403) sauf s'il
  est parent d'un élève commun.
- Une annonce `audience: 'STUDENT'` n'apparaît pas pour un `TEACHER` qui
  la consulte, mais apparaît pour un élève de l'école.
- Un parent demande un rendez-vous pour un enfant qui n'est pas le sien
  → 403. Pour son propre enfant → 201, puis l'enseignant confirme.
- Commit + push.
