"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, MessageSquare, User } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  MOTIVATION: "지원동기",
  CHARACTER: "인성",
  ACTIVITY: "활동",
  FUTURE_PLAN: "미래계획",
  SITUATION: "상황대처",
  COMPREHENSIVE: "종합",
};

const CATEGORY_COLORS: Record<string, string> = {
  MOTIVATION: "bg-blue-50 text-blue-700 border-blue-200",
  CHARACTER: "bg-green-50 text-green-700 border-green-200",
  ACTIVITY: "bg-amber-50 text-amber-700 border-amber-200",
  FUTURE_PLAN: "bg-purple-50 text-purple-700 border-purple-200",
  SITUATION: "bg-red-50 text-red-700 border-red-200",
  COMPREHENSIVE: "bg-gray-50 text-gray-700 border-gray-200",
};

interface QuestionWithAnswer {
  id: string;
  orderIndex: number;
  category: string;
  text: string;
  answer: {
    transcript: string | null;
    durationSec: number | null;
    feedback: {
      totalScore: number;
      contentScore: number;
      logicScore: number;
      completenessScore: number;
      expressionScore: number;
      strengths: string;
      improvements: string;
    } | null;
  } | null;
}

interface SessionTranscriptProps {
  sessionId: string;
  questions: QuestionWithAnswer[];
}

export function SessionTranscript({ sessionId, questions }: SessionTranscriptProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (questions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">질문 데이터가 없습니다.</p>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs gap-1.5 h-7 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2"
      >
        <MessageSquare className="w-3 h-3" />
        대화 대본 {isExpanded ? "접기" : "보기"}
        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </Button>

      {isExpanded && (
        <div className="mt-3 space-y-4 pl-1">
          {questions
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((q) => (
              <div key={q.id} className="border border-gray-100 rounded-lg overflow-hidden">
                {/* 질문 */}
                <div className="bg-gray-50 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageSquare className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`text-[10px] px-1.5 py-0 border ${CATEGORY_COLORS[q.category] ?? CATEGORY_COLORS.COMPREHENSIVE}`}>
                          {CATEGORY_LABELS[q.category] ?? q.category}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">Q{q.orderIndex + 1}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 leading-relaxed">{q.text}</p>
                    </div>
                  </div>
                </div>

                {/* 답변 */}
                <div className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3 h-3 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-medium text-green-700">학생 답변</span>
                        {q.answer?.durationSec && (
                          <span className="text-[10px] text-muted-foreground">
                            {Math.floor(q.answer.durationSec / 60)}분 {q.answer.durationSec % 60}초
                          </span>
                        )}
                      </div>
                      {q.answer?.transcript ? (
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                          {q.answer.transcript}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">답변 대본이 없습니다.</p>
                      )}

                      {/* 개별 피드백 점수 */}
                      {q.answer?.feedback && (
                        <div className="mt-3 p-3 bg-blue-50/50 rounded-lg">
                          <div className="grid grid-cols-4 gap-2 mb-2">
                            {[
                              { label: "내용", score: q.answer.feedback.contentScore },
                              { label: "논리", score: q.answer.feedback.logicScore },
                              { label: "완성도", score: q.answer.feedback.completenessScore },
                              { label: "표현력", score: q.answer.feedback.expressionScore },
                            ].map((item) => (
                              <div key={item.label} className="text-center">
                                <p className="text-lg font-bold text-blue-700">{item.score}</p>
                                <p className="text-[10px] text-muted-foreground">{item.label}</p>
                              </div>
                            ))}
                          </div>
                          {q.answer.feedback.strengths && (
                            <div className="mt-2">
                              <p className="text-[10px] font-medium text-green-700 mb-0.5">강점</p>
                              <p className="text-xs text-gray-600 leading-relaxed">{q.answer.feedback.strengths}</p>
                            </div>
                          )}
                          {q.answer.feedback.improvements && (
                            <div className="mt-1.5">
                              <p className="text-[10px] font-medium text-amber-700 mb-0.5">개선점</p>
                              <p className="text-xs text-gray-600 leading-relaxed">{q.answer.feedback.improvements}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
