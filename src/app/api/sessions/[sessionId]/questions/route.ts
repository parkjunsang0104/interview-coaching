import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateQuestions } from "@/lib/claude";
import type { SchoolType } from "@/generated/prisma/client";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const interviewSession = await prisma.interviewSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
    include: { personalStatement: true },
  });

  if (!interviewSession) {
    return NextResponse.json({ error: "세션을 찾을 수 없습니다." }, { status: 404 });
  }

  if (interviewSession.status !== "CREATED") {
    const questions = await prisma.question.findMany({
      where: { sessionId },
      orderBy: { orderIndex: "asc" },
    });
    return NextResponse.json({ questions });
  }

  const ps = interviewSession.personalStatement;
  const activities = ps.activities as Array<{
    title: string;
    description: string;
    period: string;
  }>;

  const generated = await generateQuestions({
    schoolType: ps.schoolType as SchoolType,
    motivation: ps.motivation,
    strengths: ps.strengths,
    weaknesses: ps.weaknesses,
    activities,
  });

  const questions = await prisma.$transaction(
    generated.map((q, idx) =>
      prisma.question.create({
        data: {
          sessionId,
          orderIndex: idx + 1,
          category: q.category,
          text: q.text,
        },
      })
    )
  );

  await prisma.interviewSession.update({
    where: { id: sessionId },
    data: { status: "QUESTIONS_READY" },
  });

  return NextResponse.json({ questions });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const questions = await prisma.question.findMany({
    where: { sessionId },
    include: { answer: { include: { feedback: true } } },
    orderBy: { orderIndex: "asc" },
  });

  return NextResponse.json({ questions });
}
