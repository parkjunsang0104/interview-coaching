import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { Users, Video, TrendingUp, ClipboardList } from "lucide-react";
import { InviteCodeSection } from "@/components/dashboard/invite-code-section";
import { getSchoolShortName } from "@/lib/school-data";

export default async function TeacherDashboardPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  const academyId = session.user.academyId;
  if (!academyId) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        소속 학원 정보가 없습니다. 관리자에게 문의하세요.
      </div>
    );
  }

  const [studentCount, recentSessions, academy] = await Promise.all([
    prisma.user.count({
      where: { academyId, role: "STUDENT", isActive: true },
    }),
    prisma.interviewSession.findMany({
      where: { user: { academyId } },
      include: {
        user: { select: { name: true } },
        personalStatement: { select: { targetSchool: true } },
        sessionFeedback: { select: { avgTotalScore: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.academy.findUnique({ where: { id: academyId } }),
  ]);

  const completedCount = recentSessions.filter(
    (s) => s.status === "COMPLETED"
  ).length;

  const avgScore =
    recentSessions.filter((s) => s.sessionFeedback).length > 0
      ? Math.round(
          recentSessions
            .filter((s) => s.sessionFeedback)
            .reduce((sum, s) => sum + s.sessionFeedback!.avgTotalScore, 0) /
            recentSessions.filter((s) => s.sessionFeedback).length
        )
      : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">교사 대시보드</h1>
          <p className="text-muted-foreground mt-1">{academy?.name}</p>
        </div>
        <Link href="/teacher/students">
          <Button variant="outline" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            학생 관리
          </Button>
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{studentCount}</p>
                <p className="text-xs text-muted-foreground">등록된 학생</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-xs text-muted-foreground">완료된 면접</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgScore ?? "-"}</p>
                <p className="text-xs text-muted-foreground">학원 평균 점수</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 최근 면접 활동 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              최근 면접 활동
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  아직 면접 기록이 없습니다.
                </p>
              ) : (
                recentSessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{s.user.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">
                          {getSchoolShortName(s.personalStatement.targetSchool)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(s.createdAt).toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.sessionFeedback && (
                        <span className="text-sm font-bold text-red-600">
                          {Math.round(s.sessionFeedback.avgTotalScore)}점
                        </span>
                      )}
                      {s.status === "COMPLETED" && (
                        <Link href={`/interview/${s.id}/feedback`}>
                          <Button variant="ghost" size="sm" className="text-xs h-7">
                            보기
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 초대 코드 발급 */}
        <InviteCodeSection academyId={academyId} />
      </div>
    </div>
  );
}
