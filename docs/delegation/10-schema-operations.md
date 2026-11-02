# Sous-projet 10 — Schéma complet des modules opérationnels

## Dépend de
Rien de nouveau (base : phases 1 et 2 déjà en place). **Bloque tous les
sous-projets 11 à 19.**

## Modèle recommandé : sonnet, effort élevé
Une seule migration pour ~15 nouvelles tables. Une erreur ici (mauvais
type, relation manquante, FK oubliée) bloque ou casse tous les sous-
projets suivants. Relire le schéma complet une fois avant de lancer la
migration.

## Objectif
Ajouter au schéma Prisma (`backend/prisma/schema.prisma`) toutes les
tables nécessaires aux modules Administratif, Élèves (compléments),
Staff, Académique, Communication et Finance. **Un seul fichier de
migration pour tout**, pour éviter les conflits d'ordre entre migrations
si plusieurs sous-agents travaillaient en parallèle sur le schéma.

## Ce qui ne nécessite AUCUN changement de schéma (ne pas y toucher)
- **Photo de profil élève/enseignant** : `User.photoUrl` existe déjà.
  Le sous-projet 12 ajoute juste l'endpoint d'upload qui le renseigne.
- **Remise de diplôme / transfert** : `Enrollment.status` est déjà un
  `String` libre (`@default("active")`). Le sous-projet 12 l'utilise
  avec les valeurs `"graduated"` / `"transferred_out"`, aucune migration
  requise.
- **Carte d'élève** : généré à la volée en PDF à partir des données
  existantes (`StudentProfile` + `User`), aucun stockage nécessaire.

## Nouveaux enums

```prisma
enum ContractType {
  FULL_TIME
  PART_TIME
  FIXED_TERM
}

enum InvoiceStatus {
  PENDING
  PARTIALLY_PAID
  PAID
  OVERDUE
  CANCELLED
}

enum AnnouncementAudience {
  ALL
  ADMIN
  TEACHER
  STUDENT
  PARENT
}

enum MeetingStatus {
  REQUESTED
  CONFIRMED
  CANCELLED
  COMPLETED
}
```

Réutiliser les enums existants là où c'est pertinent : `AttendanceStatus`
pour la présence du staff, `PaymentMethod` (CASH/MOBILE_MONEY) pour les
paiements de frais de scolarité — ne pas créer de doublons.

## Nouveaux modèles — Administratif (sous-projet 11)

```prisma
model Room {
  id       String  @id @default(cuid())
  schoolId String
  school   School  @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  name     String
  capacity Int?
  type     String?

  timetableSlots TimetableSlot[]

  @@unique([schoolId, name])
}

model TimetableSlot {
  id             String         @id @default(cuid())
  classGroupId   String
  classGroup     ClassGroup     @relation(fields: [classGroupId], references: [id], onDelete: Cascade)
  subjectId      String
  subject        Subject        @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  teacherId      String
  teacher        TeacherProfile @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  roomId         String?
  room           Room?          @relation(fields: [roomId], references: [id])
  academicYearId String
  academicYear   AcademicYear   @relation(fields: [academicYearId], references: [id], onDelete: Cascade)
  dayOfWeek      Int
  startTime      String
  endTime        String

  @@index([classGroupId, dayOfWeek])
  @@index([teacherId, dayOfWeek])
  @@index([roomId, dayOfWeek])
}
```
`dayOfWeek` : 1 (lundi) à 7 (dimanche). `startTime`/`endTime` : chaînes
`"HH:mm"` (pas de type `Time` dédié, suffisant pour le v1 — la détection
de chevauchement se fait en comparant ces chaînes dans le service).

## Nouveaux modèles — Staff (sous-projet 13)

```prisma
model StaffAttendance {
  id           String           @id @default(cuid())
  teacherId    String
  teacher      TeacherProfile   @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  date         DateTime
  status       AttendanceStatus
  note         String?
  recordedById String
  createdAt    DateTime         @default(now())

  @@index([teacherId, date])
}

model Contract {
  id           String       @id @default(cuid())
  teacherId    String
  teacher      TeacherProfile @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  contractType ContractType
  salaryAmount Float
  currency     String       @default("XOF")
  startDate    DateTime
  endDate      DateTime?
  createdAt    DateTime     @default(now())
}

model Evaluation {
  id             String   @id @default(cuid())
  teacherId      String
  teacher        TeacherProfile @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  evaluatorId    String
  evaluator      User     @relation(fields: [evaluatorId], references: [id])
  evaluationDate DateTime @default(now())
  score          Float
  comments       String?
  createdAt      DateTime @default(now())
}
```

## Nouveaux modèles — Académique (sous-projet 14)

```prisma
model Syllabus {
  id             String       @id @default(cuid())
  subjectId      String
  subject        Subject      @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  classGroupId   String
  classGroup     ClassGroup   @relation(fields: [classGroupId], references: [id], onDelete: Cascade)
  academicYearId String
  academicYear   AcademicYear @relation(fields: [academicYearId], references: [id], onDelete: Cascade)
  title          String
  description    String?
  createdAt      DateTime     @default(now())
}

model LessonPlan {
  id           String         @id @default(cuid())
  teacherId    String
  teacher      TeacherProfile @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  subjectId    String
  subject      Subject        @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  classGroupId String
  classGroup   ClassGroup     @relation(fields: [classGroupId], references: [id], onDelete: Cascade)
  date         DateTime
  title        String
  objectives   String?
  content      String?
  createdAt    DateTime       @default(now())
}

model Assignment {
  id             String         @id @default(cuid())
  title          String
  description    String?
  subjectId      String
  subject        Subject        @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  classGroupId   String
  classGroup     ClassGroup     @relation(fields: [classGroupId], references: [id], onDelete: Cascade)
  academicYearId String
  academicYear   AcademicYear   @relation(fields: [academicYearId], references: [id], onDelete: Cascade)
  dueDate        DateTime
  createdById    String
  createdBy      TeacherProfile @relation(fields: [createdById], references: [id], onDelete: Cascade)
  createdAt      DateTime       @default(now())

  submissions AssignmentSubmission[]
}

model AssignmentSubmission {
  id           String         @id @default(cuid())
  assignmentId String
  assignment   Assignment     @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  studentId    String
  student      StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  content      String?
  submittedAt  DateTime       @default(now())
  grade        Float?
  feedback     String?

  @@unique([assignmentId, studentId])
}
```

## Nouveaux modèles — Communication (sous-projet 15)

```prisma
model Message {
  id          String    @id @default(cuid())
  senderId    String
  sender      User      @relation("SentMessages", fields: [senderId], references: [id], onDelete: Cascade)
  recipientId String
  recipient   User      @relation("ReceivedMessages", fields: [recipientId], references: [id], onDelete: Cascade)
  content     String
  readAt      DateTime?
  createdAt   DateTime  @default(now())

  @@index([recipientId, createdAt])
  @@index([senderId, createdAt])
}

model Announcement {
  id           String                @id @default(cuid())
  schoolId     String
  school       School                @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  authorId     String
  author       User                  @relation(fields: [authorId], references: [id])
  title        String
  content      String
  audience     AnnouncementAudience  @default(ALL)
  classGroupId String?
  classGroup   ClassGroup?           @relation(fields: [classGroupId], references: [id])
  publishedAt  DateTime              @default(now())
  createdAt    DateTime              @default(now())

  @@index([schoolId, publishedAt])
}

model ParentTeacherMeeting {
  id          String         @id @default(cuid())
  teacherId   String
  teacher     TeacherProfile @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  parentId    String
  parent      ParentProfile  @relation(fields: [parentId], references: [id], onDelete: Cascade)
  studentId   String
  student     StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  scheduledAt DateTime
  status      MeetingStatus  @default(REQUESTED)
  notes       String?
  createdAt   DateTime       @default(now())

  @@index([teacherId, scheduledAt])
  @@index([parentId, scheduledAt])
}
```
Note pour le sous-projet 15 : `Message` relie deux `User` quelconques
(pas de contrainte d'école) — un `ADMIN`/`TEACHER` ne doit pouvoir
écrire qu'à des utilisateurs de sa propre école (vérifié en service, pas
en DB, même logique que partout ailleurs dans ce projet) ; un `PARENT`
peut écrire aux enseignants de n'importe laquelle de ses écoles (cohérent
avec le parent multi-écoles de la phase précédente).

## Nouveaux modèles — Finance (sous-projet 16)

```prisma
model FeeStructure {
  id             String       @id @default(cuid())
  schoolId       String
  school         School       @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  academicYearId String
  academicYear   AcademicYear @relation(fields: [academicYearId], references: [id], onDelete: Cascade)
  classGroupId   String?
  classGroup     ClassGroup?  @relation(fields: [classGroupId], references: [id])
  name           String
  amount         Float
  currency       String       @default("XOF")
  createdAt      DateTime     @default(now())

  invoices Invoice[]
}

model Invoice {
  id             String        @id @default(cuid())
  studentId      String
  student        StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  feeStructureId String?
  feeStructure   FeeStructure? @relation(fields: [feeStructureId], references: [id])
  amount         Float
  currency       String        @default("XOF")
  dueDate        DateTime
  status         InvoiceStatus @default(PENDING)
  createdAt      DateTime      @default(now())

  payments FeePayment[]
}

model FeePayment {
  id           String        @id @default(cuid())
  invoiceId    String
  invoice      Invoice       @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  amount       Float
  method       PaymentMethod
  reference    String?
  recordedById String
  recordedBy   User          @relation(fields: [recordedById], references: [id])
  paidAt       DateTime      @default(now())

  @@index([invoiceId])
}

model Expense {
  id           String   @id @default(cuid())
  schoolId     String
  school       School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  category     String
  amount       Float
  currency     String   @default("XOF")
  description  String?
  date         DateTime @default(now())
  recordedById String
  recordedBy   User     @relation(fields: [recordedById], references: [id])
  createdAt    DateTime @default(now())

  @@index([schoolId, date])
}
```
**Rappel important** (déjà noté dans `00-OVERVIEW.md`, répété ici car
c'est le point de confusion le plus probable) : `FeePayment`/`Invoice`
sont les frais de scolarité **parent → école**. Ils sont totalement
distincts de `Payment`/`Subscription` (déjà existants) qui sont l'abonnement
SaaS **école → plateforme**. Ne pas les fusionner, ne pas réutiliser l'un
pour l'autre.

## Relations inverses à ajouter sur les modèles EXISTANTS
Chaque nouvelle relation ci-dessus a un champ `@relation` du côté "many" ;
Prisma exige le champ inverse du côté "one". Ajouter :

- **`School`** : `rooms Room[]`, `announcements Announcement[]`,
  `feeStructures FeeStructure[]`, `expenses Expense[]`
- **`AcademicYear`** : `timetableSlots TimetableSlot[]`,
  `syllabi Syllabus[]`, `assignments Assignment[]`,
  `feeStructures FeeStructure[]`
- **`ClassGroup`** : `timetableSlots TimetableSlot[]`,
  `syllabi Syllabus[]`, `lessonPlans LessonPlan[]`,
  `assignments Assignment[]`, `announcements Announcement[]`,
  `feeStructures FeeStructure[]`
- **`Subject`** : `timetableSlots TimetableSlot[]`,
  `syllabi Syllabus[]`, `lessonPlans LessonPlan[]`,
  `assignments Assignment[]`
- **`TeacherProfile`** : `timetableSlots TimetableSlot[]`,
  `staffAttendances StaffAttendance[]`, `contracts Contract[]`,
  `evaluations Evaluation[]`, `lessonPlans LessonPlan[]`,
  `assignmentsCreated Assignment[]`, `meetings ParentTeacherMeeting[]`
- **`StudentProfile`** : `assignmentSubmissions AssignmentSubmission[]`,
  `invoices Invoice[]`, `meetings ParentTeacherMeeting[]`
- **`ParentProfile`** : `meetings ParentTeacherMeeting[]`
- **`User`** : `sentMessages Message[] @relation("SentMessages")`,
  `receivedMessages Message[] @relation("ReceivedMessages")`,
  `announcementsAuthored Announcement[]`, `evaluationsGiven Evaluation[]`,
  `feePaymentsRecorded FeePayment[]`, `expensesRecorded Expense[]`

## Étapes concrètes
1. Ajouter les enums puis les modèles ci-dessus à
   `backend/prisma/schema.prisma`, puis toutes les relations inverses.
2. `pnpm exec prisma format && pnpm exec prisma validate`
3. `pnpm exec prisma migrate dev --name operational_modules`
4. `pnpm exec prisma generate` (fait automatiquement par `migrate dev`,
   vérifier que ça n'échoue pas)
5. `pnpm exec nest build` — doit rester sans erreur (aucun code
   applicatif ne référence encore ces modèles, donc aucune erreur de
   type ne devrait apparaître ; si `nest build` échoue, c'est un vrai
   problème de schéma à corriger ici, pas à reporter).

## Fichiers à créer/modifier
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/<timestamp>_operational_modules/` (généré)

## Ne pas toucher
- Aucun fichier `.ts` — ce sous-projet est 100% schéma, comme le 01 de
  la vague précédente.

## Critères d'acceptation
- `pnpm exec prisma validate` : OK
- Migration appliquée sans erreur ni reset nécessaire
- `pnpm exec nest build` : zéro erreur
- Commit + push
