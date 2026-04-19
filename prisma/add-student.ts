import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const academy = await prisma.academy.findUnique({ where: { code: "DEMO001" } });
  if (!academy) throw new Error("학원을 찾을 수 없습니다.");

  const teacher = await prisma.user.findUnique({ where: { email: "teacher@demo.com" } });

  const passwordHash = await bcrypt.hash("student1234!", 12);
  const student = await prisma.user.upsert({
    where: { email: "junsang@demo.com" },
    update: {},
    create: {
      email: "junsang@demo.com",
      passwordHash,
      name: "박준상",
      role: "STUDENT",
      academyId: academy.id,
      teacherId: teacher?.id,
    },
  });

  console.log("✓ 학생 생성 완료");
  console.log("  이름:     ", student.name);
  console.log("  이메일:   ", student.email);
  console.log("  비밀번호: student1234!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
