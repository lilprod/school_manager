import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';
import { SchoolsModule } from './schools/schools.module.js';
import { AcademicYearsModule } from './academic-years/academic-years.module.js';
import { ClassGroupsModule } from './class-groups/class-groups.module.js';
import { SubjectsModule } from './subjects/subjects.module.js';
import { StudentsModule } from './students/students.module.js';
import { TeachersModule } from './teachers/teachers.module.js';
import { AttendanceModule } from './attendance/attendance.module.js';
import { GradingModule } from './grading/grading.module.js';
import { PlansModule } from './plans/plans.module.js';
import { PlatformSchoolsModule } from './platform-schools/platform-schools.module.js';
import { SubscriptionsModule } from './subscriptions/subscriptions.module.js';
import { RoomsModule } from './rooms/rooms.module.js';
import { TimetableModule } from './timetable/timetable.module.js';
import { SyllabiModule } from './syllabi/syllabi.module.js';
import { LessonPlansModule } from './lesson-plans/lesson-plans.module.js';
import { AssignmentsModule } from './assignments/assignments.module.js';
import { StaffAttendanceModule } from './staff-attendance/staff-attendance.module.js';
import { ContractsModule } from './contracts/contracts.module.js';
import { EvaluationsModule } from './evaluations/evaluations.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SchoolsModule,
    AcademicYearsModule,
    ClassGroupsModule,
    SubjectsModule,
    StudentsModule,
    TeachersModule,
    AttendanceModule,
    GradingModule,
    PlansModule,
    PlatformSchoolsModule,
    SubscriptionsModule,
    RoomsModule,
    TimetableModule,
    SyllabiModule,
    LessonPlansModule,
    AssignmentsModule,
    StaffAttendanceModule,
    ContractsModule,
    EvaluationsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
