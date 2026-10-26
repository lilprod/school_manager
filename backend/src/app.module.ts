import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { StripSecretsInterceptor } from './common/interceptors/strip-secrets.interceptor.js';
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
import { MessagesModule } from './messages/messages.module.js';
import { AnnouncementsModule } from './announcements/announcements.module.js';
import { MeetingsModule } from './meetings/meetings.module.js';
import { FeeStructuresModule } from './fee-structures/fee-structures.module.js';
import { InvoicesModule } from './invoices/invoices.module.js';
import { ExpensesModule } from './expenses/expenses.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { TermsModule } from './terms/terms.module.js';
import { ContactsModule } from './contacts/contacts.module.js';
import { ClassCoefficientsModule } from './class-coefficients/class-coefficients.module.js';
import { ReportCommentsModule } from './report-comments/report-comments.module.js';
import { ExamsModule } from './exams/exams.module.js';

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
    MessagesModule,
    AnnouncementsModule,
    MeetingsModule,
    FeeStructuresModule,
    InvoicesModule,
    ExpensesModule,
    ReportsModule,
    TermsModule,
    ContactsModule,
    ClassCoefficientsModule,
    ReportCommentsModule,
    ExamsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: StripSecretsInterceptor },
  ],
})
export class AppModule {}
