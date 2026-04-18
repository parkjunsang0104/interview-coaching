import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2).max(20),
  email: z.string().email(),
  password: z.string().min(6),
  inviteCode: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  const { name, email, password, inviteCode } = parsed.data;

  const invite = await prisma.inviteCode.findUnique({
    where: { code: inviteCode },
    include: { academy: true },
  });

  if (!invite || invite.status !== "ACTIVE" || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "유효하지 않거나 만료된 초대 코드입니다." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "이미 사용 중인 이메일입니다." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "STUDENT",
      academyId: invite.academyId,
    },
  });

  await prisma.inviteCode.update({
    where: { id: invite.id },
    data: { status: "USED", usedById: user.id, usedAt: new Date() },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
