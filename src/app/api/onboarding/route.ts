import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("individual") }),
  z.object({ type: z.literal("academy"), academyCode: z.string().min(1) }),
]);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  if (parsed.data.type === "individual") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { isIndividual: true, onboarded: true, academyId: null },
    });
    return NextResponse.json({ success: true, type: "individual" });
  }

  // 학원 소속
  const academy = await prisma.academy.findUnique({
    where: { code: parsed.data.academyCode.toUpperCase() },
  });

  if (!academy || !academy.isActive) {
    return NextResponse.json(
      { error: "존재하지 않거나 비활성화된 학원 코드입니다." },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      academyId: academy.id,
      isIndividual: false,
      onboarded: true,
    },
  });

  return NextResponse.json({
    success: true,
    type: "academy",
    academyName: academy.name,
  });
}
