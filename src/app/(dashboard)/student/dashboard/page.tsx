import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { DashboardCharts } from "@/components/dashboard/charts";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { Video, History, ChevronRight, Calendar, Sparkles } from "lucide-react";
import { getSchoolShortName } from "@/lib/school-data";

const STATUS_META: Record<string, { label: string; color: string }> = {
  CREATED: { label: "시작 전", color: "bg-gray-100 text-gray-600" },
  QUESTIONS_READY: { label: "질문 준비", color: "bg-yellow-100 text-yellow-700" },
  IN_PROGRESS: { label: "진행 중", color: "bg-red-100 text-red-600" },
  PROCESSING: { label: "분석 중", color: "bg-purple-100 text-purple-700" },
  COMPLETED: { label: "완료", color: "bg-green-100 text-green-700" },
  FAILED: { label: "실패", color: "bg-red-100 text-red-700" },
};

export default async function StudentDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") redirect("/login");

  const userId = session.user.id;

  const [totalCount, recentSessions, completedSessions] = await Promise.all([
    prisma.interviewSession.count({ where: { userId } }),
    prisma.interviewSession.findMany({
      where: { userId },
      include: {
        sessionFeedback: { select: { avgTotalScore: true } },
        personalStatement: { select: { targetSchool: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
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

  const scored = completedSessions.filter((s) => s.sessionFeedback);
  const avgScore =
    scored.length > 0
      ? Math.round(
          scored.reduce((sum, s) => sum + s.sessionFeedback!.avgTotalScore, 0) /
            scored.length
        )
      : null;

  const maxScore =
    scored.length > 0
      ? Math.round(Math.max(...scored.map((s) => s.sessionFeedback!.avgTotalScore)))
      : null;

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-red-400 to-red-500 rounded-2xl flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              안녕하세요, {session.user.name}님!
            </h1>
            <p className="text-sm text-red-500 mt-0.5">오늘도 멋진 하루 보내세요 ✨</p>
          </div>
        </div>
        <Link href="/interview/new">
          <Button className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-500 hover:from-red-600 hover:to-red-600 shadow-md shadow-red-200/50 h-11 px-5">
            <Video className="w-4 h-4" />
            새 면접 시작
          </Button>
        </Link>
      </div>

      {/* 시각화 통계 (1~3번 항목) */}
      <StatsOverview
        totalCount={totalCount}
        completedCount={scored.length}
        avgScore={avgScore}
        maxScore={maxScore}
      />

      {/* 점수 추이 차트 */}
      {scoreHistory.length > 0 ? (
        <Card className="mb-8 border-red-100/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Video className="w-4 h-4 text-red-500" />
              </div>
              점수 추이
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardCharts data={scoreHistory} />
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8 border-dashed border-red-200 bg-red-50/30">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Video className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-gray-700 font-medium">아직 완료된 면접이 없습니다</p>
            <p className="text-sm text-red-500 mt-1">첫 번째 면접을 시작해보세요!</p>
          </CardContent>
        </Card>
      )}

      {/* 4번 항목: 이전/최근 면접 기록 History */}
      <Card className="border-red-100/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <History className="w-4 h-4 text-red-500" />
              </div>
              면접 기록 History
            </CardTitle>
            <Link href="/student/sessions">
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs gap-1">
                전체 보기 <ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentSessions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 mx-auto mb-3 text-red-200" />
              <p className="text-sm text-muted-foreground">면접 기록이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentSessions.map((s, idx) => {
                const meta = STATUS_META[s.status] ?? STATUS_META.CREATED;
                const score = s.sessionFeedback
                  ? Math.round(s.sessionFeedback.avgTotalScore)
                  : null;
                const isHighest = maxScore !== null && score === maxScore;

                return (
                  <div
                    key={s.id}
                    className="group flex items-center gap-4 p-3.5 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-all"
                  >
                    {/* 회차 */}
                    <div className="flex flex-col items-center gap-0.5 shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-red-100 flex items-center justify-center text-red-700 font-bold text-sm">
                        {recentSessions.length - idx}
                      </div>
                      <span className="text-[10px] text-gray-400">회차</span>
                    </div>

                    {/* 메인 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">
                          {getSchoolShortName(s.personalStatement.targetSchool)}
                        </span>
                        <Badge className={`text-[10px] border-0 ${meta.color}`}>
                          {meta.label}
                        </Badge>
                        {isHighest && (
                          <Badge className="text-[10px] border-0 bg-amber-100 text-amber-700">
                            🏆 최고점
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(s.createdAt).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    {/* 점수 */}
                    {score !== null && (
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-red-600 leading-none">
                          {score}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">종합 점수</p>
                      </div>
                    )}

                    {/* 액션 */}
                    <div className="shrink-0">
                      {s.status === "COMPLETED" ? (
                        <Link href={`/interview/${s.id}/feedback`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                          >
                            결과 <ChevronRight className="w-3 h-3 ml-0.5" />
                          </Button>
                        </Link>
                      ) : s.status === "QUESTIONS_READY" || s.status === "IN_PROGRESS" ? (
                        <Link href={`/interview/${s.id}/session`}>
                          <Button size="sm" className="text-xs">
                            이어하기
                          </Button>
                        </Link>
                      ) : s.status === "CREATED" ? (
                        <Link href={`/interview/${s.id}/questions`}>
                          <Button variant="outline" size="sm" className="text-xs">
                            질문 생성
                          </Button>
                        </Link>
                      ) : null}
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
