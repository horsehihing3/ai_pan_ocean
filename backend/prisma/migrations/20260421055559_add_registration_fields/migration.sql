-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "address" TEXT,
ADD COLUMN     "addressDetail" TEXT,
ADD COLUMN     "industryEtc" TEXT,
ADD COLUMN     "nameEn" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- AlterTable
ALTER TABLE "registration_requests" ADD COLUMN     "address" TEXT,
ADD COLUMN     "addressDetail" TEXT,
ADD COLUMN     "applicantContactEmail" TEXT,
ADD COLUMN     "applicantTitle" TEXT,
ADD COLUMN     "bizFileKey" TEXT,
ADD COLUMN     "companyNameEn" TEXT,
ADD COLUMN     "companyPhone" TEXT,
ADD COLUMN     "industryEtc" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "title" TEXT;
