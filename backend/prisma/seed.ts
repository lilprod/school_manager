import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const DEMO_PASSWORD = 'Password123!';

async function hash(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log('🌱 Démarrage du seed...');

  const school = await prisma.school.create({
    data: {
      name: 'Lycée Victor Hugo',
      address: '12 rue des Écoles, 75005 Paris',
      phone: '+33 1 23 45 67 89',
      email: 'contact@lycee-victorhugo.fr',
    },
  });

  const academicYear = await prisma.academicYear.create({
    data: {
      schoolId: school.id,
      label: '2025-2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-06-30'),
      isCurrent: true,
    },
  });

  const classA = await prisma.classGroup.create({
    data: { schoolId: school.id, name: '6ème A', level: '6ème' },
  });
  const classB = await prisma.classGroup.create({
    data: { schoolId: school.id, name: '5ème B', level: '5ème' },
  });

  const subjectMath = await prisma.subject.create({
    data: { schoolId: school.id, name: 'Mathématiques', code: 'MATH' },
  });
  const subjectFrench = await prisma.subject.create({
    data: { schoolId: school.id, name: 'Français', code: 'FR' },
  });
  const subjectHistory = await prisma.subject.create({
    data: { schoolId: school.id, name: 'Histoire-Géographie', code: 'HG' },
  });
  const subjectScience = await prisma.subject.create({
    data: { schoolId: school.id, name: 'Sciences', code: 'SCI' },
  });

  const adminUser = await prisma.user.create({
    data: {
      schoolId: school.id,
      email: 'admin@ecole.fr',
      passwordHash: await hash(DEMO_PASSWORD),
      role: 'ADMIN',
      firstName: 'Alice',
      lastName: 'Admin',
    },
  });

  const teacherMathUser = await prisma.user.create({
    data: {
      schoolId: school.id,
      email: 'prof.math@ecole.fr',
      passwordHash: await hash(DEMO_PASSWORD),
      role: 'TEACHER',
      firstName: 'Jean',
      lastName: 'Dupont',
    },
  });
  const teacherMath = await prisma.teacherProfile.create({
    data: { userId: teacherMathUser.id, employeeNumber: 'EMP-001', qualifications: 'Agrégation de mathématiques' },
  });

  const teacherFrenchUser = await prisma.user.create({
    data: {
      schoolId: school.id,
      email: 'prof.francais@ecole.fr',
      passwordHash: await hash(DEMO_PASSWORD),
      role: 'TEACHER',
      firstName: 'Marie',
      lastName: 'Martin',
    },
  });
  const teacherFrench = await prisma.teacherProfile.create({
    data: { userId: teacherFrenchUser.id, employeeNumber: 'EMP-002', qualifications: 'CAPES de lettres modernes' },
  });

  for (const classGroup of [classA, classB]) {
    await prisma.teacherAssignment.create({
      data: {
        teacherId: teacherMath.id,
        classGroupId: classGroup.id,
        subjectId: subjectMath.id,
        academicYearId: academicYear.id,
      },
    });
    await prisma.teacherAssignment.create({
      data: {
        teacherId: teacherFrench.id,
        classGroupId: classGroup.id,
        subjectId: subjectFrench.id,
        academicYearId: academicYear.id,
      },
    });
  }

  const studentSeeds = [
    { firstName: 'Lucas', lastName: 'Bernard', classGroup: classA },
    { firstName: 'Emma', lastName: 'Petit', classGroup: classA },
    { firstName: 'Hugo', lastName: 'Robert', classGroup: classA },
    { firstName: 'Chloé', lastName: 'Richard', classGroup: classA },
    { firstName: 'Nathan', lastName: 'Durand', classGroup: classB },
    { firstName: 'Léa', lastName: 'Moreau', classGroup: classB },
    { firstName: 'Gabriel', lastName: 'Simon', classGroup: classB },
    { firstName: 'Manon', lastName: 'Laurent', classGroup: classB },
  ];

  const students: { profileId: string; userId: string; classGroupId: string; firstName: string; lastName: string }[] = [];

  for (const [index, seed] of studentSeeds.entries()) {
    const email = `eleve${index + 1}@ecole.fr`;
    const user = await prisma.user.create({
      data: {
        schoolId: school.id,
        email,
        passwordHash: await hash(DEMO_PASSWORD),
        role: 'STUDENT',
        firstName: seed.firstName,
        lastName: seed.lastName,
      },
    });
    const profile = await prisma.studentProfile.create({
      data: {
        userId: user.id,
        studentNumber: `STU-${String(index + 1).padStart(4, '0')}`,
        dateOfBirth: new Date(2013 - Math.floor(index / 4), index % 12, 10),
        gender: index % 2 === 0 ? 'M' : 'F',
      },
    });
    await prisma.enrollment.create({
      data: { studentId: profile.id, classGroupId: seed.classGroup.id, academicYearId: academicYear.id },
    });
    students.push({
      profileId: profile.id,
      userId: user.id,
      classGroupId: seed.classGroup.id,
      firstName: seed.firstName,
      lastName: seed.lastName,
    });
  }

  const parent1User = await prisma.user.create({
    data: {
      schoolId: school.id,
      email: 'parent1@ecole.fr',
      passwordHash: await hash(DEMO_PASSWORD),
      role: 'PARENT',
      firstName: 'Sophie',
      lastName: 'Bernard',
    },
  });
  const parent1 = await prisma.parentProfile.create({ data: { userId: parent1User.id } });
  await prisma.parentStudent.create({
    data: { parentId: parent1.id, studentId: students[0].profileId, relation: 'mère' },
  });
  await prisma.parentStudent.create({
    data: { parentId: parent1.id, studentId: students[1].profileId, relation: 'mère' },
  });

  const parent2User = await prisma.user.create({
    data: {
      schoolId: school.id,
      email: 'parent2@ecole.fr',
      passwordHash: await hash(DEMO_PASSWORD),
      role: 'PARENT',
      firstName: 'Marc',
      lastName: 'Durand',
    },
  });
  const parent2 = await prisma.parentProfile.create({ data: { userId: parent2User.id } });
  await prisma.parentStudent.create({
    data: { parentId: parent2.id, studentId: students[4].profileId, relation: 'père' },
  });

  const attendanceStatuses = ['PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'ABSENT'] as const;
  const today = new Date();
  for (let dayOffset = 1; dayOffset <= 5; dayOffset += 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    for (const [i, student] of students.entries()) {
      await prisma.attendance.create({
        data: {
          studentId: student.profileId,
          classGroupId: student.classGroupId,
          subjectId: subjectMath.id,
          date,
          status: attendanceStatuses[(i + dayOffset) % attendanceStatuses.length],
          recordedById: teacherMathUser.id,
        },
      });
    }
  }

  const assessmentConfigs = [
    { subject: subjectMath, classGroup: classA, title: 'Contrôle - Fractions' },
    { subject: subjectFrench, classGroup: classA, title: 'Dissertation - Le romantisme' },
    { subject: subjectMath, classGroup: classB, title: 'Contrôle - Géométrie' },
    { subject: subjectFrench, classGroup: classB, title: 'Dictée et grammaire' },
  ];

  for (const config of assessmentConfigs) {
    const assessment = await prisma.assessment.create({
      data: {
        title: config.title,
        type: 'EXAM',
        subjectId: config.subject.id,
        classGroupId: config.classGroup.id,
        academicYearId: academicYear.id,
        maxScore: 20,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10),
      },
    });

    const classStudents = students.filter((s) => s.classGroupId === config.classGroup.id);
    for (const [i, student] of classStudents.entries()) {
      await prisma.grade.create({
        data: {
          assessmentId: assessment.id,
          studentId: student.profileId,
          score: 10 + ((i * 3 + config.title.length) % 11),
        },
      });
    }
  }

  console.log('✅ Seed terminé.');
  console.log('');
  console.log('Comptes de démonstration (mot de passe commun) :', DEMO_PASSWORD);
  console.log(`  Admin   : ${adminUser.email}`);
  console.log(`  Prof.   : ${teacherMathUser.email}, ${teacherFrenchUser.email}`);
  console.log(`  Élève   : ${students[0].profileId ? 'eleve1@ecole.fr .. eleve8@ecole.fr' : ''}`);
  console.log(`  Parent  : ${parent1User.email}, ${parent2User.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
