-- CreateEnum
CREATE TYPE "OpinionType" AS ENUM ('NEAR_MISS', 'ACCIDENT_REPORT', 'GENERAL');

-- CreateTable
CREATE TABLE "worker_opinions" (
    "id" TEXT NOT NULL,
    "type" "OpinionType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "consentAgreed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,

    CONSTRAINT "worker_opinions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "worker_opinions" ADD CONSTRAINT "worker_opinions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_opinions" ADD CONSTRAINT "worker_opinions_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
