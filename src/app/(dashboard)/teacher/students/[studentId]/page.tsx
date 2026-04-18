import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Video, TrendingUp } from "lucide-react";

const SCHOOL_TYPE_LABELS: Record<string, string> = {
  FOREIGN_LANGUAGE: "외고",
  INTERNATIONAL: "국제고",
  AUTONOMOUS: "자사고",
  SCIENCE_GIFTED: "영재학교",
};

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const session = await auth();
  if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  const student = await prisma.user.findFirst({
    where: {
      id: studentId,
      role: "STUDENT",
      academyId: session.user.academyId ?? undefined,
    },
    include: {
      sessions: {
        include: {
          personalStatement: { select: { schoolType: true } },
          sessionFeedback: {
            select: {
              avgTotalScore: true,
              avgContentScore: true,
              avgLogicScore: true,
              avgCompletenessScore: true,
              avgExpressionScore: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!student) notFound();

  const completedSessions = student.sessions.filter(
    (s) => s.status === "COMPLETED" && s.sessionFeedback
  );

  const avgTotal =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce(
            (sum, s) => sum + s.sessionFeedback!.avgTotalScore,
            0
          ) / completedSessions.length
        )
      : null;

  const scoreItems = [
    { label: "내용 적절성", key: "avgContentScore" },
    { label: "논리성", key: "avgLogicScore" },
    { label: "완성도", key: "avgCompletenessScore" },
    { label: "표현력", key: "avgExpressionScore" },
  ] as const;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/teacher/students">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            학생 목록
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">{student.name}</span>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* 학생 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">학생 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-blue-700">
                  {student.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-semibold">{student.name}</p>
                <p className="text-sm text-muted-foreground">{student.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm border-t pt-3">
              <span className="text-muted-foreground">계정 상태</span>
              <Badge className={student.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                {student.isActive ? "활성" : "비활성"}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">가입일</span>
              <span>{new Date(student.createdAt).toLocaleDateString("ko-KR")}</span>
            </div>
          </CardContent>
        </Card>

        {/* 면접 통계 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="w-4 h-4" />
              면접 통계
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">전체 면접</span>
              <span className="font-bold">{student.sessions.length}회</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">완료된 면접</span>
              <span className="font-bold">{completedSessions.length}회</span>
            </div>
            <div className="flex items-center justify-between text-sm border-t pt-3">
              <span className="text-muted-foreground">평균 종합 점수</span>
              <span className="text-xl font-bold text-blue-700">
                {avgTotal ?? "-"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 항목별 평균 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              항목별 평균
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {completedSessions.length > 0
              ? scoreItems.map((item) => {
                  const avg = Math.round(
                    completedSessions.reduce(
                      (sum, s) => sum + s.sessionFeedback![item.key],
                      0
                    ) / completedSessions.length
                  );
                  return (
                    <div key={item.key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{avg}점</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${avg}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  완료된 면접이 없습니다
                </p>
              )}
          </CardContent>
        </Card>
      </div>

      {/* 면접 기록 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">면접 기록</CardTitle>
        </CardHeader>
        <CardContent>
          {student.sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              면접 기록이 없습니다
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {student.sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {SCHOOL_TYPE_LABELS[s.personalStatement.schoolType]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                    <Badge
                      className={`text-xs border-0 ${s.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                    >
                      {s.status === "COMPLETED" ? "완료" : s.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    {s.sessionFeedback && (
                      <span className="font-bold text-blue-700">
                        {Math.round(s.sessionFeedback.avgTotalScore)}점
                      </span>
                    )}
                    {s.status === "COMPLETED" && (
                      <Link href={`/interview/${s.id}/feedback`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          결과 보기
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
