import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAnswerFeedback } from "@/lib/claude";
import type { SchoolType } from "@/generated/prisma/client";

export const maxDuration = 60;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string; answerId: string }> }
) {
  const { answerId } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    include: {
      question: {
        include: {
          session: { include: { personalStatement: true } },
        },
      },
      feedback: true,
    },
  });

  if (!answer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (answer.feedback) return NextResponse.json({ feedback: answer.feedback });

  const schoolType = answer.question.session.personalStatement.schoolType as SchoolType;

  const result = await generateAnswerFeedback({
    question: answer.question.text,
    category: answer.question.category,
    transcript: answer.transcript ?? "",
    schoolType,
  });

  const feedback = await prisma.answerFeedback.create({
    data: {
      answerId,
      contentScore: result.contentScore,
      logicScore: result.logicScore,
      completenessScore: result.completenessScore,
      expressionScore: result.expressionScore,
      totalScore: result.totalScore,
      strengths: result.strengths,
      improvements: result.improvements,
      modelDirection: result.modelDirection,
    },
  });

  return NextResponse.json({ feedback });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string; answerId: string }> }
) {
  const { answerId } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const feedback = await prisma.answerFeedback.findUnique({
    where: { answerId },
  });

  return NextResponse.json({ feedback });
}
