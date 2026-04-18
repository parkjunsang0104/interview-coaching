import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { DashboardCharts } from "@/components/dashboard/charts";
import { Video, Clock, TrendingUp } from "lucide-react";

const SCHOOL_TYPE_LABELS: Record<string, string> = {
  FOREIGN_LANGUAGE: "외고",
  INTERNATIONAL: "국제고",
  AUTONOMOUS: "자사고",
  SCIENCE_GIFTED: "영재학교",
};

const STATUS_LABELS: Record<string, string> = {
  CREATED: "생성됨",
  QUESTIONS_READY: "질문 준비",
  IN_PROGRESS: "진행 중",
  PROCESSING: "처리 중",
  COMPLETED: "완료",
  FAILED: "실패",
};

export default async function StudentDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") redirect("/login");

  const userId = session.user.id;

  const [allSessions, completedSessions] = await Promise.all([
    prisma.interviewSession.findMany({
      where: { userId },
      include: {
        sessionFeedback: { select: { avgTotalScore: true } },
        personalStatement: { select: { schoolType: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.interviewSession.findMany({
      where: { userId, status: "COMPLETED" },
      include: { sessionFeedback: true },
      orderBy: { completedAt: "asc" },
    }),
  ]);

  const scoreHistory = completedSessions
    .filter((s) => s.sessionFeedback)
    .map((s, idx) => ({
      name: `${idx + 1}회차`,
      종합: Math.round(s.sessionFeedback!.avgTotalScore),
      내용: Math.round(s.sessionFeedback!.avgContentScore),
      논리: Math.round(s.sessionFeedback!.avgLogicScore),
      완성도: Math.round(s.sessionFeedback!.avgCompletenessScore),
      표현력: Math.round(s.sessionFeedback!.avgExpressionScore),
    }));

  const avgScore =
    completedSessions.length > 0
      ? Math.round(
          completedSessions
            .filter((s) => s.sessionFeedback)
            .reduce((sum, s) => sum + s.sessionFeedback!.avgTotalScore, 0) /
            completedSessions.filter((s) => s.sessionFeedback).length
        )
      : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">대시보드</h1>
          <p className="text-muted-foreground mt-1">안녕하세요, {session.user.name}님!</p>
        </div>
        <Link href="/interview/new">
          <Button className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            새 면접 시작
          </Button>
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allSessions.length}</p>
                <p className="text-xs text-muted-foreground">전체 면접 횟수</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgScore ?? "-"}</p>
                <p className="text-xs text-muted-foreground">평균 종합 점수</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedSessions.length}</p>
                <p className="text-xs text-muted-foreground">완료된 면접</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 점수 추이 차트 */}
      {scoreHistory.length > 0 ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">점수 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardCharts data={scoreHistory} />
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8 border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Video className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>아직 완료된 면접이 없습니다.</p>
            <p className="text-sm mt-1">첫 번째 면접을 시작해보세요!</p>
          </CardContent>
        </Card>
      )}

      {/* 최근 면접 기록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">최근 면접 기록</CardTitle>
        </CardHeader>
        <CardContent>
          {allSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              면접 기록이 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {allSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {SCHOOL_TYPE_LABELS[s.personalStatement.schoolType]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                    <Badge
                      className={`text-xs ${s.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                    >
                      {STATUS_LABELS[s.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    {s.sessionFeedback && (
                      <span className="text-sm font-bold text-blue-700">
                        {Math.round(s.sessionFeedback.avgTotalScore)}점
                      </span>
                    )}
                    {s.status === "COMPLETED" ? (
                      <Link href={`/interview/${s.id}/feedback`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          결과 보기
                        </Button>
                      </Link>
                    ) : s.status === "QUESTIONS_READY" ? (
                      <Link href={`/interview/${s.id}/session`}>
                        <Button size="sm" className="text-xs">
                          이어하기
                        </Button>
                      </Link>
                    ) : null}
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
