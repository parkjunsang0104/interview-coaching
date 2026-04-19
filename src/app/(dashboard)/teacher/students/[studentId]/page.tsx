import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Video, TrendingUp, GraduationCap } from "lucide-react";
import { SessionTranscript } from "@/components/dashboard/session-transcript";
import { getSchoolShortName, getSchoolName } from "@/lib/school-data";

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
          personalStatement: { select: { targetSchool: true } },
          sessionFeedback: {
            select: {
              avgTotalScore: true,
              avgContentScore: true,
              avgLogicScore: true,
              avgCompletenessScore: true,
              avgExpressionScore: true,
            },
          },
          questions: {
            include: {
              answer: {
                select: {
                  transcript: true,
                  durationSec: true,
                  feedback: {
                    select: {
                      totalScore: true,
                      contentScore: true,
                      logicScore: true,
                      completenessScore: true,
                      expressionScore: true,
                      strengths: true,
                      improvements: true,
                    },
                  },
                },
              },
            },
            orderBy: { orderIndex: "asc" },
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

  // 지원학교 집계
  const schoolCounts = student.sessions.reduce<Record<string, number>>((acc, s) => {
    const id = s.personalStatement.targetSchool;
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

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
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-pink-600">
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
              <span className="text-xl font-bold text-pink-600">
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
                          className="h-full bg-pink-400 rounded-full"
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

      {/* 지원학교 */}
      {Object.keys(schoolCounts).length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              지원학교
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(schoolCounts).map(([id, count]) => (
                <div
                  key={id}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-pink-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{getSchoolName(id)}</p>
                    <p className="text-xs text-muted-foreground">{String(count)}회 면접</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
              {student.sessions.map((s, idx) => (
                <div key={s.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-mono w-6">
                        #{student.sessions.length - idx}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {getSchoolShortName(s.personalStatement.targetSchool)}
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
                        <span className="font-bold text-pink-600">
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

                  {/* 대화 대본 (펼치기) */}
                  {s.questions.length > 0 && (
                    <div className="mt-2 ml-9">
                      <SessionTranscript
                        sessionId={s.id}
                        questions={s.questions.map((q) => ({
                          id: q.id,
                          orderIndex: q.orderIndex,
                          category: q.category,
                          text: q.text,
                          answer: q.answer
                            ? {
                                transcript: q.answer.transcript,
                                durationSec: q.answer.durationSec,
                                feedback: q.answer.feedback
                                  ? {
                                      totalScore: q.answer.feedback.totalScore,
                                      contentScore: q.answer.feedback.contentScore,
                                      logicScore: q.answer.feedback.logicScore,
                                      completenessScore: q.answer.feedback.completenessScore,
                                      expressionScore: q.answer.feedback.expressionScore,
                                      strengths: q.answer.feedback.strengths,
                                      improvements: q.answer.feedback.improvements,
                                    }
                                  : null,
                              }
                            : null,
                        }))}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
