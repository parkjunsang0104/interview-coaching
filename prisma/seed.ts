import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const academy = await prisma.academy.upsert({
    where: { code: "DEMO001" },
    update: {},
    create: {
      name: "데모 학원",
      code: "DEMO001",
    },
  });

  const adminHash = await bcrypt.hash("admin1234!", 12);
  await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      passwordHash: adminHash,
      name: "관리자",
      role: "ADMIN",
      academyId: academy.id,
    },
  });

  const teacherHash = await bcrypt.hash("teacher1234!", 12);
  await prisma.user.upsert({
    where: { email: "teacher@demo.com" },
    update: {},
    create: {
      email: "teacher@demo.com",
      passwordHash: teacherHash,
      name: "홍길동 선생님",
      role: "TEACHER",
      academyId: academy.id,
    },
  });

  console.log("✓ 시드 완료");
  console.log("  관리자: admin@demo.com / admin1234!");
  console.log("  교사:   teacher@demo.com / teacher1234!");
  console.log("  학원 코드:", academy.code);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
