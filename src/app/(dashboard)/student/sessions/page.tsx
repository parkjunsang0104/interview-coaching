import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { Video, ChevronRight, Plus } from "lucide-react";

const SCHOOL_TYPE_LABELS: Record<string, string> = {
  FOREIGN_LANGUAGE: "외고",
  INTERNATIONAL: "국제고",
  AUTONOMOUS: "자사고",
  SCIENCE_GIFTED: "영재학교",
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  CREATED: { label: "시작 전", color: "bg-gray-100 text-gray-600" },
  QUESTIONS_READY: { label: "질문 준비됨", color: "bg-yellow-100 text-yellow-700" },
  IN_PROGRESS: { label: "진행 중", color: "bg-blue-100 text-blue-700" },
  PROCESSING: { label: "분석 중", color: "bg-purple-100 text-purple-700" },
  COMPLETED: { label: "완료", color: "bg-green-100 text-green-700" },
  FAILED: { label: "실패", color: "bg-red-100 text-red-700" },
};

export default async function StudentSessionsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") redirect("/login");

  const sessions = await prisma.interviewSession.findMany({
    where: { userId: session.user.id },
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
      questions: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">면접 기록</h1>
          <p className="text-muted-foreground mt-1">
            총 {sessions.length}회의 면접 기록입니다
          </p>
        </div>
        <Link href="/interview/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            새 면접 시작
          </Button>
        </Link>
      </div>

      {sessions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">아직 면접 기록이 없습니다</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              첫 번째 면접을 시작해보세요!
            </p>
            <Link href="/interview/new">
              <Button>면접 시작하기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const meta = STATUS_META[s.status] ?? STATUS_META.CREATED;
            const score = s.sessionFeedback
              ? Math.round(s.sessionFeedback.avgTotalScore)
              : null;

            return (
              <Card key={s.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                        <Video className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {SCHOOL_TYPE_LABELS[s.personalStatement.schoolType]}
                          </Badge>
                          <Badge className={`text-xs border-0 ${meta.color}`}>
                            {meta.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(s.createdAt).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          질문 {s.questions.length}개
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {score !== null && (
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-700">{score}</p>
                          <p className="text-xs text-muted-foreground">종합 점수</p>
                        </div>
                      )}

                      {s.sessionFeedback && (
                        <div className="hidden sm:grid grid-cols-4 gap-2 text-center text-xs">
                          {[
                            { label: "내용", val: s.sessionFeedback.avgContentScore },
                            { label: "논리", val: s.sessionFeedback.avgLogicScore },
                            { label: "완성도", val: s.sessionFeedback.avgCompletenessScore },
                            { label: "표현력", val: s.sessionFeedback.avgExpressionScore },
                          ].map((item) => (
                            <div key={item.label}>
                              <p className="font-semibold">{Math.round(item.val)}</p>
                              <p className="text-muted-foreground">{item.label}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5">
                        {s.status === "COMPLETED" && (
                          <Link href={`/interview/${s.id}/feedback`}>
                            <Button size="sm" variant="outline" className="w-full text-xs gap-1">
                              결과 보기 <ChevronRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        )}
                        {(s.status === "QUESTIONS_READY" || s.status === "IN_PROGRESS") && (
                          <Link href={`/interview/${s.id}/session`}>
                            <Button size="sm" className="w-full text-xs gap-1">
                              이어하기 <ChevronRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        )}
                        {s.status === "CREATED" && (
                          <Link href={`/interview/${s.id}/questions`}>
                            <Button size="sm" variant="outline" className="w-full text-xs gap-1">
                              질문 생성 <ChevronRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        )}
                        {s.status === "COMPLETED" && (
                          <a
                            href={`/api/reports/${s.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="ghost" className="w-full text-xs text-muted-foreground">
                              PDF 저장
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
