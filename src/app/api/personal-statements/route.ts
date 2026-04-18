import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const activitySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  period: z.string().min(1),
});

const schema = z.object({
  schoolType: z.enum([
    "FOREIGN_LANGUAGE",
    "INTERNATIONAL",
    "AUTONOMOUS",
    "SCIENCE_GIFTED",
  ]),
  motivation: z.string().min(10),
  strengths: z.string().min(10),
  weaknesses: z.string().min(10),
  activities: z.array(activitySchema).min(1).max(3),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다.", details: parsed.error.flatten() }, { status: 400 });
  }

  const statement = await prisma.personalStatement.create({
    data: {
      userId: session.user.id,
      schoolType: parsed.data.schoolType,
      motivation: parsed.data.motivation,
      strengths: parsed.data.strengths,
      weaknesses: parsed.data.weaknesses,
      activities: parsed.data.activities,
    },
  });

  const interviewSession = await prisma.interviewSession.create({
    data: {
      userId: session.user.id,
      personalStatementId: statement.id,
      status: "CREATED",
    },
  });

  return NextResponse.json({ sessionId: interviewSession.id }, { status: 201 });
}
