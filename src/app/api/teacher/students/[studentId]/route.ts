import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const session = await auth();
  if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 같은 학원 소속 학생인지 확인
  const student = await prisma.user.findFirst({
    where: {
      id: studentId,
      role: "STUDENT",
      academyId: session.user.academyId ?? undefined,
    },
  });

  if (!student) {
    return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
  }

  // 자기 자신은 삭제 불가
  if (student.id === session.user.id) {
    return NextResponse.json({ error: "자신의 계정은 삭제할 수 없습니다." }, { status: 400 });
  }

  // 학생 삭제 (PersonalStatement, InterviewSession 등은 Cascade로 함께 삭제됨)
  await prisma.user.delete({ where: { id: studentId } });

  return NextResponse.json({ success: true });
}
