-- AlterTable
ALTER TABLE "User" ADD COLUMN     "image" TEXT,
ADD COLUMN     "isIndividual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboarded" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "passwordHash" DROP NOT NULL;
