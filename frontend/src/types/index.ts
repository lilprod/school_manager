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
