import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { AttendanceService } from '../attendance/attendance.service.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { MENTION_LABELS_FR } from '../grading/report-card.js';
import { StudentAccessService, type Requester } from '../common/access/student-access.service.js';
import { GradingService } from '../grading/grading.service.js';
import { InvoicesService } from '../invoices/invoices.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StaffAttendanceService } from '../staff-attendance/staff-attendance.service.js';

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(columns: string[], rows: unknown[][]): string {
  const lines = [columns.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(','));
  }
  return lines.join('\n');
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attendanceService: AttendanceService,
    private readonly gradingService: GradingService,
    private readonly invoicesService: InvoicesService,
    private readonly staffAttendanceService: StaffAttendanceService,
    private readonly studentAccess: StudentAccessService,
  ) {}

  async attendanceCsv(schoolId: string, query: { classGroupId?: string; from?: string; to?: string }) {
    const records = await this.attendanceService.findAll(schoolId, query);
    return toCsv(
      ['nom', 'prénom', 'classe', 'date', 'statut'],
      records.map((record) => [
        record.student.user.lastName,
        record.student.user.firstName,
        record.classGroup.name,
        record.date.toISOString().slice(0, 10),
        record.status,
      ]),
    );
  }

  async financeCsv(schoolId: string, query: { classGroupId?: string; academicYearId?: string }) {
    const invoices = await this.invoicesService.findAll(schoolId, { classGroupId: query.classGroupId });

    const studentIds = invoices.map((invoice) => invoice.studentId);
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: { in: studentIds },
        ...(query.academicYearId ? { academicYearId: query.academicYearId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { classGroup: true },
    });
    const classByStudent = new Map<string, string>();
    for (const enrollment of enrollments) {
      if (!classByStudent.has(enrollment.studentId)) {
        classByStudent.set(enrollment.studentId, enrollment.classGroup.name);
      }
    }

    return toCsv(
      ['élève', 'classe', 'montant', 'montant payé', 'statut', 'échéance'],
      invoices.map((invoice) => {
        const student = (invoice as unknown as { student: { user: { lastName: string; firstName: string } } })
          .student;
        return [
          `${student.user.lastName} ${student.user.firstName}`,
          classByStudent.get(invoice.studentId) ?? '',
          invoice.amount,
          invoice.paidAmount,
          invoice.status,
          invoice.dueDate.toISOString().slice(0, 10),
        ];
      }),
    );
  }

  async staffAttendanceCsv(schoolId: string, requester: AuthenticatedUser, query: { from?: string; to?: string }) {
    const records = await this.staffAttendanceService.findAll(schoolId, requester, query);
    return toCsv(
      ['nom', 'prénom', 'date', 'statut'],
      records.map((record) => [
        record.teacher.user.lastName,
        record.teacher.user.firstName,
        record.date.toISOString().slice(0, 10),
        record.status,
      ]),
    );
  }

  async reportCardPdf(
    schoolId: string | null,
    requester: Requester,
    studentId: string,
    academicYearId: string,
    termId?: string,
  ): Promise<Buffer> {
    const reportCard = await this.gradingService.reportCard(schoolId, requester, studentId, academicYearId, termId);
    const term = termId ? await this.prisma.term.findUnique({ where: { id: termId } }) : null;

    const student = await this.prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: { user: { include: { school: true } } },
    });

    const schoolName = student?.user.school?.name ?? 'École';
    const studentName = student ? `${student.user.firstName} ${student.user.lastName}` : studentId;

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (error: Error) => reject(error));

      doc.fontSize(16).font('Helvetica-Bold').text(schoolName, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(term ? `Bulletin de notes — ${term.name}` : 'Bulletin de notes', { align: 'center' });
      doc.moveDown(1.5);
      doc.fontSize(12).font('Helvetica-Bold').text(`Élève : ${studentName}`);
      doc.moveDown(1);

      doc.fontSize(11).font('Helvetica-Bold');
      doc.text('Matière (coef.)', 40, doc.y, { continued: true, width: 300 });
      doc.text('Moyenne / 20', { align: 'right' });
      doc.moveDown(0.5);
      doc.font('Helvetica');

      for (const subject of reportCard.subjects) {
        doc.text(`${subject.subjectName} (${subject.coefficient})`, 40, doc.y, { continued: true, width: 300 });
        doc.text(String(subject.average), { align: 'right' });
        const subjectComment = reportCard.subjectComments[subject.subjectId];
        if (subjectComment) {
          doc.fontSize(9).fillColor('#555555').text(subjectComment, 50, doc.y, { width: 480 });
          doc.fontSize(11).fillColor('black');
        }
      }

      doc.moveDown(1.5);
      doc.fontSize(13).font('Helvetica-Bold').text(`Moyenne générale : ${reportCard.overallAverage} / 20`);
      if (reportCard.rank !== null) {
        doc
          .fontSize(11)
          .font('Helvetica')
          .text(
            `Rang : ${reportCard.rank} / ${reportCard.classSize}  —  Moyenne de la classe : ${reportCard.classAverage} / 20`,
          );
      }
      if (reportCard.mention) {
        doc.font('Helvetica-Bold').text(`Mention : ${MENTION_LABELS_FR[reportCard.mention]}`);
      }
      if (reportCard.generalComment) {
        doc.moveDown(1);
        doc.font('Helvetica-Bold').text('Appréciation générale');
        doc.font('Helvetica').text(reportCard.generalComment);
      }

      doc.end();
    });
  }

  async summary(schoolId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalStudents, totalTeachers, totalClasses, attendanceGrouped, outstandingInvoices, expensesThisMonth] =
      await Promise.all([
        this.prisma.studentProfile.count({ where: { user: { schoolId, isActive: true } } }),
        this.prisma.teacherProfile.count({ where: { user: { schoolId, isActive: true } } }),
        this.prisma.classGroup.count({ where: { schoolId } }),
        this.prisma.attendance.groupBy({
          by: ['status'],
          where: { classGroup: { schoolId }, date: { gte: thirtyDaysAgo } },
          _count: { status: true },
        }),
        this.prisma.invoice.aggregate({
          where: {
            student: { user: { schoolId } },
            status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
          },
          _sum: { amount: true },
        }),
        this.prisma.expense.aggregate({
          where: { schoolId, date: { gte: startOfMonth } },
          _sum: { amount: true },
        }),
      ]);

    const present = attendanceGrouped.find((g) => g.status === 'PRESENT')?._count.status ?? 0;
    const absent = attendanceGrouped.find((g) => g.status === 'ABSENT')?._count.status ?? 0;
    const attendanceRatePercent =
      present + absent === 0 ? 0 : Math.round((present / (present + absent)) * 10000) / 100;

    return {
      totalStudents,
      totalTeachers,
      totalClasses,
      attendanceRatePercent,
      outstandingInvoicesTotal: outstandingInvoices._sum.amount ?? 0,
      totalExpensesThisMonth: expensesThisMonth._sum.amount ?? 0,
    };
  }
}
