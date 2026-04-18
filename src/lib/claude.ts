import Anthropic from "@anthropic-ai/sdk";
import type { SchoolType } from "@/generated/prisma/client";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SCHOOL_TYPE_LABELS: Record<SchoolType, string> = {
  FOREIGN_LANGUAGE: "외국어고등학교(외고)",
  INTERNATIONAL: "국제고등학교(국제고)",
  AUTONOMOUS: "자율형사립고(자사고)",
  SCIENCE_GIFTED: "과학영재학교",
};

export interface GeneratedQuestion {
  category:
    | "MOTIVATION"
    | "CHARACTER"
    | "ACTIVITY"
    | "FUTURE_PLAN"
    | "SITUATION"
    | "COMPREHENSIVE";
  text: string;
}

export interface AnswerFeedbackResult {
  contentScore: number;
  logicScore: number;
  completenessScore: number;
  expressionScore: number;
  totalScore: number;
  strengths: string;
  improvements: string;
  modelDirection: string;
}

export interface SessionSummaryResult {
  avgContentScore: number;
  avgLogicScore: number;
  avgCompletenessScore: number;
  avgExpressionScore: number;
  avgTotalScore: number;
  overallSummary: string;
  overallStrengths: string;
  overallImprovements: string;
}

export async function generateQuestions(params: {
  schoolType: SchoolType;
  motivation: string;
  strengths: string;
  weaknesses: string;
  activities: Array<{ title: string; description: string; period: string }>;
}): Promise<GeneratedQuestion[]> {
  const schoolLabel = SCHOOL_TYPE_LABELS[params.schoolType];
  const activitiesText = params.activities
    .map(
      (a, i) => `  ${i + 1}. ${a.title} (${a.period}): ${a.description}`
    )
    .join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: `당신은 한국 특목고 면접 전문 코치입니다. ${schoolLabel} 입시 면접에 특화되어 있습니다.
자기소개서를 분석하여 실제 면접에서 나올 법한 심층 질문을 생성해야 합니다.
반드시 JSON 배열만 출력하고, 다른 텍스트는 포함하지 마세요.`,
    messages: [
      {
        role: "user",
        content: `다음 자기소개서를 바탕으로 ${schoolLabel} 면접 질문 6개를 생성해주세요.

[자기소개서]
- 지원동기: ${params.motivation}
- 강점: ${params.strengths}
- 약점/단점: ${params.weaknesses}
- 주요 활동:
${activitiesText}

각 카테고리별로 정확히 1개씩, 총 6개의 질문을 다음 JSON 형식으로 출력하세요:
[
  {"category": "MOTIVATION", "text": "지원동기 관련 질문"},
  {"category": "CHARACTER", "text": "인성 관련 질문"},
  {"category": "ACTIVITY", "text": "활동 관련 질문"},
  {"category": "FUTURE_PLAN", "text": "미래계획 관련 질문"},
  {"category": "SITUATION", "text": "상황대처 관련 질문"},
  {"category": "COMPREHENSIVE", "text": "종합 관련 질문"}
]

규칙:
1. 질문은 자기소개서 내용에 구체적으로 연결되어야 합니다
2. 존댓말(습니다체)로 작성하세요
3. 각 질문은 2~3문장 이내로 명확하게 작성하세요
4. ${schoolLabel}의 특성과 인재상을 반영하세요`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Claude가 올바른 JSON을 반환하지 않았습니다");

  return JSON.parse(jsonMatch[0]) as GeneratedQuestion[];
}

export async function generateAnswerFeedback(params: {
  question: string;
  category: string;
  transcript: string;
  schoolType: SchoolType;
}): Promise<AnswerFeedbackResult> {
  const schoolLabel = SCHOOL_TYPE_LABELS[params.schoolType];

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: `당신은 한국 특목고 면접 전문 평가관입니다. ${schoolLabel} 면접 답변을 객관적으로 평가합니다.
반드시 JSON 객체만 출력하고, 다른 텍스트는 포함하지 마세요.`,
    messages: [
      {
        role: "user",
        content: `다음 면접 답변을 평가해주세요.

[질문] ${params.question}
[학생 답변] ${params.transcript || "(답변 없음)"}

아래 JSON 형식으로 평가 결과를 출력하세요. 각 점수는 0~100 정수입니다:
{
  "contentScore": 내용적절성 점수,
  "logicScore": 논리성 점수,
  "completenessScore": 완성도 점수,
  "expressionScore": 표현력 점수,
  "totalScore": 종합 점수(위 4개의 가중평균, 내용적절성 30% + 논리성 30% + 완성도 20% + 표현력 20%),
  "strengths": "잘한 점 (구체적으로 2~3가지)",
  "improvements": "개선할 점 (구체적으로 2~3가지)",
  "modelDirection": "모범 답변 방향 (핵심 포인트 제시, 실제 예시 포함)"
}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude가 올바른 JSON을 반환하지 않았습니다");

  const result = JSON.parse(jsonMatch[0]);
  return result as AnswerFeedbackResult;
}

export async function generateSessionSummary(
  qaPairs: Array<{ question: string; transcript: string; totalScore: number }>
): Promise<SessionSummaryResult> {
  const qaText = qaPairs
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.transcript || "(답변 없음)"}\n점수: ${qa.totalScore}`)
    .join("\n\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: `당신은 한국 특목고 면접 전문 코치입니다. 전체 면접 세션을 종합 평가합니다.
반드시 JSON 객체만 출력하고, 다른 텍스트는 포함하지 마세요.`,
    messages: [
      {
        role: "user",
        content: `다음 면접 세션 전체를 종합 평가해주세요.

${qaText}

아래 JSON 형식으로 출력하세요:
{
  "avgContentScore": 평균내용점수,
  "avgLogicScore": 평균논리성점수,
  "avgCompletenessScore": 평균완성도점수,
  "avgExpressionScore": 평균표현력점수,
  "avgTotalScore": 평균종합점수,
  "overallSummary": "전체 면접 종합 평가 (3~4문장)",
  "overallStrengths": "전반적으로 잘한 점 (2~3가지)",
  "overallImprovements": "전반적으로 개선할 점과 다음 준비 방향 (2~3가지)"
}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude가 올바른 JSON을 반환하지 않았습니다");

  return JSON.parse(jsonMatch[0]) as SessionSummaryResult;
}
