import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { Users } from "lucide-react";
import { StudentsList, type StudentRow } from "@/components/dashboard/students-list";

export default async function TeacherStudentsPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  const academyId = session.user.academyId;
  if (!academyId) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        소속 학원 정보가 없습니다.
      </div>
    );
  }

  const students = await prisma.user.findMany({
    where: { academyId, role: "STUDENT" },
    include: {
      sessions: {
        select: {
          status: true,
          createdAt: true,
          completedAt: true,
          sessionFeedback: { select: { avgTotalScore: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const rows: StudentRow[] = students.map((u) => {
    const completed = u.sessions.filter(
      (s) => s.status === "COMPLETED" && s.sessionFeedback
    );
    const scores = completed.map((s) => s.sessionFeedback!.avgTotalScore);

    const latestAt = u.sessions[0]
      ? (u.sessions[0].completedAt ?? u.sessions[0].createdAt).toISOString()
      : null;

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
      totalSessions: u.sessions.length,
      completedSessions: completed.length,
      latestInterviewAt: latestAt,
      avgScore:
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null,
      maxScore: scores.length > 0 ? Math.round(Math.max(...scores)) : null,
    };
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 bg-gradient-to-br from-red-400 to-red-500 rounded-2xl flex items-center justify-center shadow-sm">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">학생 관리</h1>
          <p className="text-sm text-red-500 mt-0.5">
            총 {rows.length}명의 학생이 등록되어 있습니다
          </p>
        </div>
      </div>

      <Card className="border-red-100/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">학생 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentsList students={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
