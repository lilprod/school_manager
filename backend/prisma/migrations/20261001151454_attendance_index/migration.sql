-- DropIndex
DROP INDEX "Attendance_studentId_classGroupId_subjectId_date_key";

-- CreateIndex
CREATE INDEX "Attendance_studentId_classGroupId_subjectId_date_idx" ON "Attendance"("studentId", "classGroupId", "subjectId", "date");
