export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'

export interface User {
  id: string
  schoolId: string | null
  email: string
  role: Role
  firstName: string
  lastName: string
  phone?: string | null
  photoUrl?: string | null
  isActive: boolean
  locale: string
}

export type SchoolStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED'
export type OnboardingSource = 'MANUAL' | 'SELF_SERVICE'
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED'
export type BillingPeriod = 'MONTHLY' | 'YEARLY'
export type PaymentMethod = 'CASH' | 'MOBILE_MONEY'

export interface School {
  id: string
  name: string
  address?: string | null
  phone?: string | null
  email?: string | null
  logoUrl?: string | null
  status?: SchoolStatus
  onboardingSource?: OnboardingSource
  requestedPlanId?: string | null
  subscription?: Subscription | null
  _count?: { users: number; classGroups: number }
}

export interface SchoolSummary extends School {
  status: SchoolStatus
  onboardingSource: OnboardingSource
}

export interface Plan {
  id: string
  name: string
  code: string
  priceAmount: number
  currency: string
  billingPeriod: BillingPeriod
  maxStudents?: number | null
  maxTeachers?: number | null
  maxClasses?: number | null
  isActive: boolean
}

export interface Payment {
  id: string
  amount: number
  currency: string
  method: PaymentMethod
  reference?: string | null
  notes?: string | null
  paidAt: string
}

export interface Subscription {
  id: string
  schoolId: string
  planId: string
  plan: Plan
  status: SubscriptionStatus
  startDate: string
  currentPeriodEnd?: string | null
  trialEndsAt?: string | null
  payments?: Payment[]
}

export interface AcademicYear {
  id: string
  label: string
  startDate: string
  endDate: string
  isCurrent: boolean
}

export interface ClassGroup {
  id: string
  name: string
  level: string
}

export interface Subject {
  id: string
  name: string
  code: string
}

export interface Enrollment {
  id: string
  classGroup: ClassGroup
  academicYear: AcademicYear
}

export interface StudentProfile {
  id: string
  studentNumber: string
  dateOfBirth?: string | null
  gender?: string | null
  user: User
  enrollments: Enrollment[]
}

export interface TeacherAssignment {
  id: string
  classGroup: ClassGroup
  subject: Subject
  academicYear: AcademicYear
}

export interface TeacherProfile {
  id: string
  employeeNumber: string
  qualifications?: string | null
  user: User
  assignments: TeacherAssignment[]
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'

export interface AttendanceRecord {
  id: string
  studentId: string
  classGroupId: string
  subjectId?: string | null
  date: string
  status: AttendanceStatus
  note?: string | null
}

export interface AttendanceSummaryEntry {
  status: AttendanceStatus
  count: number
}

export type AssessmentType = 'EXAM' | 'QUIZ' | 'HOMEWORK' | 'PROJECT'

export interface Assessment {
  id: string
  title: string
  type: AssessmentType
  maxScore: number
  date: string
  subject: Subject
  classGroup: ClassGroup
  academicYear: AcademicYear
}

export interface Grade {
  id: string
  score: number
  comment?: string | null
  assessment: Assessment
}

export interface ReportCardSubject {
  subjectId: string
  subjectName: string
  average: number
  assessmentCount: number
}

export interface ReportCard {
  studentId: string
  academicYearId: string
  subjects: ReportCardSubject[]
  overallAverage: number
}

// --- Administratif ---

export interface Room {
  id: string
  name: string
  capacity?: number | null
  type?: string | null
}

export interface TimetableSlot {
  id: string
  classGroupId: string
  classGroup?: ClassGroup
  subjectId: string
  subject?: Subject
  teacherId: string
  teacher?: TeacherProfile
  roomId?: string | null
  room?: Room | null
  academicYearId: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

// --- Staff ---

export interface StaffAttendanceRecord {
  id: string
  teacherId: string
  teacher?: TeacherProfile
  date: string
  status: AttendanceStatus
  note?: string | null
}

export type ContractType = 'FULL_TIME' | 'PART_TIME' | 'FIXED_TERM'

export interface Contract {
  id: string
  teacherId: string
  contractType: ContractType
  salaryAmount: number
  currency: string
  startDate: string
  endDate?: string | null
  createdAt: string
}

export interface Evaluation {
  id: string
  teacherId: string
  evaluatorId: string
  evaluator?: { id: string; firstName: string; lastName: string; email: string }
  evaluationDate: string
  score: number
  comments?: string | null
}

// --- Académique ---

export interface Syllabus {
  id: string
  subjectId: string
  subject?: Subject
  classGroupId: string
  classGroup?: ClassGroup
  academicYearId: string
  academicYear?: AcademicYear
  title: string
  description?: string | null
}

export interface LessonPlan {
  id: string
  teacherId: string
  subjectId: string
  subject?: Subject
  classGroupId: string
  classGroup?: ClassGroup
  date: string
  title: string
  objectives?: string | null
  content?: string | null
}

export interface AssignmentSubmission {
  id: string
  assignmentId: string
  studentId: string
  student?: StudentProfile
  content?: string | null
  submittedAt: string
  grade?: number | null
  feedback?: string | null
}

export interface Assignment {
  id: string
  title: string
  description?: string | null
  subjectId: string
  subject?: Subject
  classGroupId: string
  classGroup?: ClassGroup
  academicYearId: string
  dueDate: string
  createdById: string
}

// --- Communication ---

export interface Message {
  id: string
  senderId: string
  sender?: { id: string; firstName: string; lastName: string; email: string }
  recipientId: string
  recipient?: { id: string; firstName: string; lastName: string; email: string }
  content: string
  readAt?: string | null
  createdAt: string
}

export type AnnouncementAudience = 'ALL' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'

export interface Announcement {
  id: string
  title: string
  content: string
  audience: AnnouncementAudience
  classGroupId?: string | null
  classGroup?: ClassGroup | null
  authorId: string
  publishedAt: string
}

export type MeetingStatus = 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'

export interface ParentTeacherMeeting {
  id: string
  teacherId: string
  teacher?: TeacherProfile
  parentId: string
  studentId: string
  student?: StudentProfile
  scheduledAt: string
  status: MeetingStatus
  notes?: string | null
}

// --- Finance ---

export interface FeeStructure {
  id: string
  schoolId: string
  academicYearId: string
  classGroupId?: string | null
  classGroup?: ClassGroup | null
  name: string
  amount: number
  currency: string
}

export type InvoiceStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED'

export interface FeePayment {
  id: string
  invoiceId: string
  amount: number
  method: PaymentMethod
  reference?: string | null
  paidAt: string
}

export interface Invoice {
  id: string
  studentId: string
  student?: StudentProfile
  feeStructureId?: string | null
  feeStructure?: FeeStructure | null
  amount: number
  currency: string
  dueDate: string
  status: InvoiceStatus
  paidAmount: number
  balance: number
  payments?: FeePayment[]
}

export interface Expense {
  id: string
  schoolId: string
  category: string
  amount: number
  currency: string
  description?: string | null
  date: string
}

// --- Rapports ---

export interface ReportsSummary {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  attendanceRatePercent: number
  outstandingInvoicesTotal: number
  totalExpensesThisMonth: number
}
