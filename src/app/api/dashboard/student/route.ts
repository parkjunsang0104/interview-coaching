import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const sessions = await prisma.interviewSession.findMany({
    where: { userId, status: "COMPLETED" },
    include: {
      sessionFeedback: true,
      personalStatement: { select: { schoolType: true } },
    },
    orderBy: { completedAt: "asc" },
  });

  const scoreHistory = sessions
    .filter((s) => s.sessionFeedback)
    .map((s) => ({
      date: s.completedAt?.toISOString().split("T")[0] ?? "",
      total: Math.round(s.sessionFeedback!.avgTotalScore),
      content: Math.round(s.sessionFeedback!.avgContentScore),
      logic: Math.round(s.sessionFeedback!.avgLogicScore),
      completeness: Math.round(s.sessionFeedback!.avgCompletenessScore),
      expression: Math.round(s.sessionFeedback!.avgExpressionScore),
      schoolType: s.personalStatement.schoolType,
    }));

  const recentSessions = await prisma.interviewSession.findMany({
    where: { userId },
    include: {
      sessionFeedback: { select: { avgTotalScore: true } },
      personalStatement: { select: { schoolType: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({ scoreHistory, recentSessions });
}
