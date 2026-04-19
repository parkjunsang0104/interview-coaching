import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const activitySchema = z.object({
  category: z.enum(["LEADERSHIP", "CLUB", "STUDENT_COUNCIL", "VOLUNTEER", "OTHER"]).optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  period: z.string().min(1),
});

const schema = z.object({
  studentId: z.string().min(1),
  targetSchool: z.string().min(1),
  motivation: z.string().min(10),
  character: z.string().min(10),
  selfDirected: z.string().min(10),
  futurePlan: z.string().min(10),
  activities: z.array(activitySchema).min(1).max(5),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력값이 올바르지 않습니다.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const student = await prisma.user.findFirst({
    where: {
      id: parsed.data.studentId,
      role: "STUDENT",
      academyId: session.user.academyId ?? undefined,
      isActive: true,
    },
  });

  if (!student) {
    return NextResponse.json({ error: "해당 학생을 찾을 수 없습니다." }, { status: 404 });
  }

  const statement = await prisma.personalStatement.create({
    data: {
      userId: student.id,
      targetSchool: parsed.data.targetSchool,
      motivation: parsed.data.motivation,
      character: parsed.data.character,
      selfDirected: parsed.data.selfDirected,
      futurePlan: parsed.data.futurePlan,
      activities: parsed.data.activities,
    },
  });

  const interviewSession = await prisma.interviewSession.create({
    data: {
      userId: student.id,
      personalStatementId: statement.id,
      status: "CREATED",
    },
  });

  return NextResponse.json(
    { sessionId: interviewSession.id, studentName: student.name },
    { status: 201 }
  );
}
