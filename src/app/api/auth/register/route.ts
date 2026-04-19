import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2).max(20),
  email: z.string().email(),
  password: z.string().min(6),
  academyCode: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  const { name, email, password, academyCode } = parsed.data;

  const academy = await prisma.academy.findUnique({
    where: { code: academyCode.trim().toUpperCase() },
  });

  if (!academy || !academy.isActive) {
    return NextResponse.json(
      { error: "존재하지 않거나 비활성화된 학원 코드입니다." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "이미 사용 중인 이메일입니다." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "STUDENT",
      academyId: academy.id,
    },
  });

  return NextResponse.json(
    { success: true, academyName: academy.name },
    { status: 201 }
  );
}
