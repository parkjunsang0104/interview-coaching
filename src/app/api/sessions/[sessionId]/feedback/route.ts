import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSessionSummary } from "@/lib/claude";

export const maxDuration = 60;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.sessionFeedback.findUnique({ where: { sessionId } });
  if (existing) return NextResponse.json({ feedback: existing });

  const questions = await prisma.question.findMany({
    where: { sessionId },
    include: { answer: { include: { feedback: true } } },
    orderBy: { orderIndex: "asc" },
  });

  const qaPairs = questions
    .filter((q) => q.answer)
    .map((q) => ({
      question: q.text,
      transcript: q.answer?.transcript ?? "",
      totalScore: q.answer?.feedback?.totalScore ?? 0,
    }));

  if (qaPairs.length === 0) {
    return NextResponse.json({ error: "답변이 없습니다." }, { status: 400 });
  }

  const summary = await generateSessionSummary(qaPairs);

  const feedback = await prisma.sessionFeedback.create({
    data: {
      sessionId,
      avgContentScore: summary.avgContentScore,
      avgLogicScore: summary.avgLogicScore,
      avgCompletenessScore: summary.avgCompletenessScore,
      avgExpressionScore: summary.avgExpressionScore,
      avgTotalScore: summary.avgTotalScore,
      overallSummary: summary.overallSummary,
      overallStrengths: summary.overallStrengths,
      overallImprovements: summary.overallImprovements,
    },
  });

  await prisma.interviewSession.update({
    where: { id: sessionId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  return NextResponse.json({ feedback });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [interviewSession, feedback, questions] = await Promise.all([
    prisma.interviewSession.findFirst({
      where: { id: sessionId },
      include: { personalStatement: true },
    }),
    prisma.sessionFeedback.findUnique({ where: { sessionId } }),
    prisma.question.findMany({
      where: { sessionId },
      include: { answer: { include: { feedback: true } } },
      orderBy: { orderIndex: "asc" },
    }),
  ]);

  return NextResponse.json({ session: interviewSession, feedback, questions });
}
