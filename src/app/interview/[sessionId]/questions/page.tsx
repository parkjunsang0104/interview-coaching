"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ChevronRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

const CATEGORY_LABELS: Record<string, string> = {
  MOTIVATION: "지원동기",
  CHARACTER: "인성",
  ACTIVITY: "활동",
  FUTURE_PLAN: "미래계획",
  SITUATION: "상황대처",
  COMPREHENSIVE: "종합",
};

const CATEGORY_COLORS: Record<string, string> = {
  MOTIVATION: "bg-red-100 text-red-600",
  CHARACTER: "bg-green-100 text-green-700",
  ACTIVITY: "bg-yellow-100 text-yellow-700",
  FUTURE_PLAN: "bg-purple-100 text-purple-700",
  SITUATION: "bg-red-100 text-red-700",
  COMPREHENSIVE: "bg-gray-100 text-gray-700",
};

interface Question {
  id: string;
  orderIndex: number;
  category: string;
  text: string;
}

export default function QuestionsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/questions`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json.error ?? "질문 생성에 실패했습니다.";
        toast.error(msg);
        setError(msg);
        return;
      }
      setQuestions(json.questions ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "오류가 발생했습니다.";
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">AI가 면접 질문을 생성하고 있습니다</h2>
        <p className="text-muted-foreground">자기소개서를 분석하여 맞춤 질문을 만드는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link
        href="/student/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        대시보드로
      </Link>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="w-6 h-6 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-xs font-bold">1</span>
          <span className="text-gray-400">자기소개서 입력</span>
          <span className="text-gray-300">›</span>
          <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
          <span className="font-medium text-red-500">질문 확인</span>
          <span className="text-gray-300">›</span>
          <span>면접 진행</span>
          <span className="text-gray-300">›</span>
          <span>피드백</span>
        </div>
        <h1 className="text-2xl font-bold">AI 생성 면접 질문</h1>
        <p className="text-muted-foreground mt-1">
          자기소개서를 분석하여 6개의 맞춤 질문이 생성되었습니다. 미리 확인 후 면접을 시작하세요.
        </p>
      </div>

      {error && questions.length === 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-red-800 mb-2">질문 생성에 실패했습니다</p>
          <p className="text-xs text-red-600 mb-3 whitespace-pre-wrap">{error}</p>
          <Button size="sm" variant="outline" onClick={load}>
            다시 시도
          </Button>
        </div>
      )}

      <div className="space-y-3 mb-8">
        {questions.map((q) => (
          <Card key={q.id} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600 shrink-0 mt-0.5">
                  {q.orderIndex}
                </span>
                <div className="flex-1">
                  <Badge
                    className={`${CATEGORY_COLORS[q.category]} border-0 text-xs mb-2`}
                  >
                    {CATEGORY_LABELS[q.category]}
                  </Badge>
                  <p className="text-sm leading-relaxed">{q.text}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">
        <p className="font-medium mb-1">면접 시작 전 안내</p>
        <ul className="space-y-1 text-red-600 text-xs">
          <li>• 카메라와 마이크 사용 권한이 필요합니다</li>
          <li>• 각 질문에 1~3분 이내로 답변하세요</li>
          <li>• 조용하고 밝은 장소에서 진행하세요</li>
        </ul>
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={questions.length === 0}
        onClick={() => router.push(`/interview/${sessionId}/session`)}
      >
        면접 시작하기
        <ChevronRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
