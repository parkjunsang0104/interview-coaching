"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Star, TrendingUp, AlertCircle, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";

const CATEGORY_LABELS: Record<string, string> = {
  MOTIVATION: "지원동기",
  CHARACTER: "인성",
  ACTIVITY: "활동",
  FUTURE_PLAN: "미래계획",
  SITUATION: "상황대처",
  COMPREHENSIVE: "종합",
};

const SCORE_ITEMS = [
  { key: "contentScore", label: "내용 적절성" },
  { key: "logicScore", label: "논리성" },
  { key: "completenessScore", label: "완성도" },
  { key: "expressionScore", label: "표현력" },
];

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 80 ? "bg-green-500" : score >= 60 ? "bg-pink-400" : "bg-orange-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-bold">{score}점</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

interface SessionFeedback {
  avgContentScore: number;
  avgLogicScore: number;
  avgCompletenessScore: number;
  avgExpressionScore: number;
  avgTotalScore: number;
  overallSummary: string;
  overallStrengths: string;
  overallImprovements: string;
}

interface AnswerFeedback {
  contentScore: number;
  logicScore: number;
  completenessScore: number;
  expressionScore: number;
  totalScore: number;
  strengths: string;
  improvements: string;
  modelDirection: string;
}

interface Question {
  id: string;
  orderIndex: number;
  category: string;
  text: string;
  answer?: {
    transcript?: string;
    feedback?: AnswerFeedback;
  };
}

export default function FeedbackPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sessionFeedback, setSessionFeedback] = useState<SessionFeedback | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    async function load() {
      try {
        // 세션 피드백 생성
        setGenerating(true);
        await fetch(`/api/sessions/${sessionId}/feedback`, { method: "POST" });

        const res = await fetch(`/api/sessions/${sessionId}/feedback`);
        const data = await res.json();
        setSessionFeedback(data.feedback);
        setQuestions(data.questions ?? []);
      } catch {
        toast.error("피드백을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
        setGenerating(false);
      }
    }
    load();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {generating ? "AI가 종합 평가를 생성하고 있습니다" : "피드백을 불러오는 중..."}
        </h2>
        <p className="text-muted-foreground">잠시만 기다려주세요...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link
        href="/student/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        대시보드로
      </Link>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span className="text-gray-400">면접 완료</span>
          </div>
          <h1 className="text-2xl font-bold">면접 피드백 결과</h1>
          <p className="text-muted-foreground mt-1">AI가 분석한 종합 평가입니다</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Download className="w-4 h-4 mr-2" />
          PDF 저장
        </Button>
      </div>

      {sessionFeedback && (
        <>
          {/* 종합 점수 카드 */}
          <Card className="mb-6 border-2 border-pink-100 bg-pink-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-pink-600">
                    {Math.round(sessionFeedback.avgTotalScore)}
                  </div>
                  <div className="text-sm text-pink-500 mt-1">종합 점수</div>
                </div>
                <div className="flex-1 space-y-3">
                  <ScoreBar label="내용 적절성" score={Math.round(sessionFeedback.avgContentScore)} />
                  <ScoreBar label="논리성" score={Math.round(sessionFeedback.avgLogicScore)} />
                  <ScoreBar label="완성도" score={Math.round(sessionFeedback.avgCompletenessScore)} />
                  <ScoreBar label="표현력" score={Math.round(sessionFeedback.avgExpressionScore)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 종합 평가 */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-gray-500">
                  <Star className="w-4 h-4 text-yellow-500" />
                  종합 평가
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{sessionFeedback.overallSummary}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  잘한 점
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-green-700">
                  {sessionFeedback.overallStrengths}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
                  <AlertCircle className="w-4 h-4" />
                  개선할 점
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-orange-700">
                  {sessionFeedback.overallImprovements}
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* 질문별 상세 피드백 */}
      <h2 className="text-lg font-semibold mb-4">질문별 상세 피드백</h2>
      <Tabs defaultValue={questions[0]?.id ?? ""}>
        <TabsList className="grid grid-cols-6 mb-4 h-auto">
          {questions.map((q) => (
            <TabsTrigger key={q.id} value={q.id} className="text-xs py-2">
              Q{q.orderIndex}
            </TabsTrigger>
          ))}
        </TabsList>
        {questions.map((q) => (
          <TabsContent key={q.id} value={q.id}>
            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Badge className="text-xs shrink-0">
                    {CATEGORY_LABELS[q.category]}
                  </Badge>
                  <p className="text-sm font-medium leading-relaxed">{q.text}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* 내 답변 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">내 답변</p>
                  <p className="text-sm leading-relaxed">
                    {q.answer?.transcript ?? "(답변 없음)"}
                  </p>
                </div>

                {q.answer?.feedback ? (
                  <>
                    {/* 점수 */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500">점수</p>
                      <div className="grid grid-cols-2 gap-2">
                        {SCORE_ITEMS.map((item) => (
                          <ScoreBar
                            key={item.key}
                            label={item.label}
                            score={q.answer!.feedback![item.key as keyof AnswerFeedback] as number}
                          />
                        ))}
                      </div>
                      <div className="text-right text-sm">
                        종합:{" "}
                        <span className="font-bold text-pink-600">
                          {q.answer.feedback.totalScore}점
                        </span>
                      </div>
                    </div>

                    {/* 피드백 섹션 */}
                    <div className="space-y-3">
                      <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                        <p className="text-xs font-medium text-green-700 mb-1">잘한 점</p>
                        <p className="text-sm text-green-800">{q.answer.feedback.strengths}</p>
                      </div>
                      <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                        <p className="text-xs font-medium text-orange-700 mb-1">개선할 점</p>
                        <p className="text-sm text-orange-800">{q.answer.feedback.improvements}</p>
                      </div>
                      <div className="bg-pink-50 border border-pink-100 rounded-lg p-3">
                        <p className="text-xs font-medium text-pink-600 mb-1">모범 답변 방향</p>
                        <p className="text-sm text-pink-700">{q.answer.feedback.modelDirection}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">피드백이 아직 준비되지 않았습니다.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex gap-3 mt-8">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => router.push("/interview/new")}
        >
          새 면접 시작
        </Button>
        <Button className="flex-1" onClick={() => router.push("/student/dashboard")}>
          대시보드로 이동
        </Button>
      </div>
    </div>
  );
}
