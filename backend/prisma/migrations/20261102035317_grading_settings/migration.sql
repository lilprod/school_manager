-- CreateTable
CREATE TABLE "GradingSettings" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "congratulationsMin" DOUBLE PRECISION NOT NULL DEFAULT 16,
    "encouragementsMin" DOUBLE PRECISION NOT NULL DEFAULT 14,
    "honorRollMin" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "warningBelow" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GradingSettings_schoolId_key" ON "GradingSettings"("schoolId");

-- AddForeignKey
ALTER TABLE "GradingSettings" ADD CONSTRAINT "GradingSettings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
