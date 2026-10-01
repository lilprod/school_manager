export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'

export interface User {
  id: string
  schoolId: string
  email: string
  role: Role
  firstName: string
  lastName: string
  phone?: string | null
  photoUrl?: string | null
  isActive: boolean
  locale: string
}

export interface School {
  id: string
  name: string
  address?: string | null
  phone?: string | null
  email?: string | null
  logoUrl?: string | null
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
