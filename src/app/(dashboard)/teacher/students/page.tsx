import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

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
        where: { status: "COMPLETED" },
        include: { sessionFeedback: { select: { avgTotalScore: true } } },
        orderBy: { completedAt: "desc" },
        take: 1,
      },
      _count: { select: { sessions: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">학생 관리</h1>
        <p className="text-muted-foreground mt-1">
          총 {students.length}명의 학생이 등록되어 있습니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">학생 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              등록된 학생이 없습니다. 초대 코드를 발급하여 학생을 초대하세요.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {students.map((student) => {
                const latestScore =
                  student.sessions[0]?.sessionFeedback?.avgTotalScore;
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {student.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          면접 {student._count.sessions}회
                        </p>
                        {latestScore && (
                          <p className="text-sm font-bold text-blue-700">
                            최근 {Math.round(latestScore)}점
                          </p>
                        )}
                      </div>
                      <Badge
                        className={`text-xs ${student.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {student.isActive ? "활성" : "비활성"}
                      </Badge>
                      <Link href={`/teacher/students/${student.id}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          상세 보기
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
