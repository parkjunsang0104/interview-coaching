/*
  Warnings:

  - You are about to drop the column `schoolType` on the `PersonalStatement` table. All the data in the column will be lost.
  - You are about to drop the column `strengths` on the `PersonalStatement` table. All the data in the column will be lost.
  - You are about to drop the column `weaknesses` on the `PersonalStatement` table. All the data in the column will be lost.
  - Added the required column `character` to the `PersonalStatement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `futurePlan` to the `PersonalStatement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `selfDirected` to the `PersonalStatement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetSchool` to the `PersonalStatement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PersonalStatement" DROP COLUMN "schoolType",
DROP COLUMN "strengths",
DROP COLUMN "weaknesses",
ADD COLUMN     "character" TEXT NOT NULL,
ADD COLUMN     "futurePlan" TEXT NOT NULL,
ADD COLUMN     "selfDirected" TEXT NOT NULL,
ADD COLUMN     "targetSchool" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "middleSchool" TEXT;

-- DropEnum
DROP TYPE "SchoolType";
