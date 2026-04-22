import OpenAI from "openai";
import { getSchoolById, getSchoolCategoryLabel, getSchoolName } from "@/lib/school-data";

let _openai: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

const MODEL = "gpt-4o-mini";

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

function schoolContext(targetSchool: string): string {
  const school = getSchoolById(targetSchool);
  if (school) {
    return `${school.name} (${getSchoolCategoryLabel(targetSchool)})`;
  }
  return targetSchool;
}

export async function generateQuestions(params: {
  targetSchool: string;
  motivation: string;
  character: string;
  selfDirected: string;
  futurePlan: string;
  activities: Array<{ title: string; description: string; period: string; category?: string }>;
}): Promise<GeneratedQuestion[]> {
  const schoolLabel = schoolContext(params.targetSchool);
  const activitiesText = params.activities
    .map((a, i) => `  ${i + 1}. ${a.title} (${a.period}): ${a.description}`)
    .join("\n");

  const res = await getClient().chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `당신은 한국 특목고 면접 전문 코치입니다. ${schoolLabel} 입시 면접에 특화되어 있습니다.
자기소개서를 분석하여 실제 면접에서 나올 법한 심층 질문을 생성합니다.
반드시 { "questions": [...] } 형식의 JSON 객체만 출력하세요.`,
      },
      {
        role: "user",
        content: `다음 자기소개서를 바탕으로 ${schoolLabel} 면접 질문 6개를 생성해주세요.

[자기소개서]
- 지원동기: ${params.motivation}
- 인성: ${params.character}
- 자기주도성: ${params.selfDirected}
- 미래계획: ${params.futurePlan}
- 주요 활동:
${activitiesText}

각 카테고리별로 정확히 1개씩, 총 6개의 질문을 다음 JSON 형식으로 출력하세요:
{
  "questions": [
    {"category": "MOTIVATION", "text": "지원동기 관련 질문"},
    {"category": "CHARACTER", "text": "인성 관련 질문"},
    {"category": "ACTIVITY", "text": "활동 관련 질문"},
    {"category": "FUTURE_PLAN", "text": "미래계획 관련 질문"},
    {"category": "SITUATION", "text": "상황대처 관련 질문"},
    {"category": "COMPREHENSIVE", "text": "종합 관련 질문"}
  ]
}

규칙:
1. 질문은 자기소개서 내용에 구체적으로 연결되어야 합니다
2. 존댓말(습니다체)로 작성하세요
3. 각 질문은 2~3문장 이내로 명확하게 작성하세요
4. ${schoolLabel}의 특성과 인재상을 반영하세요`,
      },
    ],
  });

  const text = res.choices[0]?.message?.content ?? "";
  const parsed = JSON.parse(text) as { questions: GeneratedQuestion[] };
  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    throw new Error("AI가 올바른 JSON을 반환하지 않았습니다");
  }
  return parsed.questions;
}

export async function generateAnswerFeedback(params: {
  question: string;
  category: string;
  transcript: string;
  targetSchool: string;
}): Promise<AnswerFeedbackResult> {
  const schoolLabel = schoolContext(params.targetSchool);

  const res = await getClient().chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `당신은 한국 특목고 면접 전문 평가관입니다. ${schoolLabel} 면접 답변을 객관적으로 평가합니다.

**절대 규칙:**
- 오직 학생이 말한 답변(transcript) 내용만을 근거로 평가합니다.
- 자기소개서, 지원동기, 학생의 배경 등 답변 외부 정보는 전혀 참조하거나 언급하지 않습니다.
- 피드백 문장(strengths, improvements)에 "자기소개서에 ~라고 썼는데" 같은 문구를 절대 포함하지 않습니다.

반드시 JSON 객체만 출력하세요.`,
      },
      {
        role: "user",
        content: `다음 면접 답변을 평가해주세요.

[질문] ${params.question}
[학생 답변] ${params.transcript || "(답변 없음)"}

**평가 기준 (6가지 지표를 종합):**
1. 질문의 의도: 질문의 배경과 맥락에 맞게 핵심을 짚어 답했는가
2. 답변의 논리성: 주장과 근거가 논리적으로 연결되는가
3. 답변의 구체성: 추상적 선언이 아닌 구체적 사례·상황·숫자가 포함되었는가
4. 답변의 진정성: 본인의 진심과 가치관이 느껴지는가
5. 답변의 진솔함: 꾸미지 않고 있는 그대로 솔직하게 답했는가
6. 답변의 연결성: 답변 내 경험·깨달음·결론이 일관되게 이어지는가

위 6가지를 종합해 아래 JSON 형식으로 출력하세요. 각 점수는 0~100 정수입니다:
{
  "contentScore": 내용 점수(기준 1·3 종합 — 질문 의도 부합도와 구체성),
  "logicScore": 논리 점수(기준 2·6 종합 — 논리성과 내적 연결성),
  "completenessScore": 진정성 점수(기준 4 — 진정성·가치관 표현),
  "expressionScore": 진솔함 점수(기준 5 — 솔직함·자연스러운 표현),
  "totalScore": 종합 점수(위 4개 평균을 정수로),
  "strengths": "잘한 점 — 학생이 실제 답변에서 말한 내용만 근거로 2~3가지. 자기소개서 언급 금지.",
  "improvements": "개선할 점 — 학생이 실제 답변에서 말한(또는 말하지 않은) 내용만 근거로 2~3가지. 자기소개서 언급 금지.",
  "modelDirection": "모범 답변 방향 — 이 질문에 대해 더 좋은 답변이 갖추어야 할 요소 제시"
}

**다시 한번 강조**: strengths와 improvements는 학생이 이 질문에 실제로 말한 내용(transcript)만을 인용·분석해야 합니다. 답변 외 정보를 가져오지 마세요.`,
      },
    ],
  });

  const text = res.choices[0]?.message?.content ?? "";
  return JSON.parse(text) as AnswerFeedbackResult;
}

export async function generateSessionSummary(
  qaPairs: Array<{ question: string; transcript: string; totalScore: number }>
): Promise<SessionSummaryResult> {
  const qaText = qaPairs
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.transcript || "(답변 없음)"}\n점수: ${qa.totalScore}`)
    .join("\n\n");

  const res = await getClient().chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `당신은 한국 특목고 면접 전문 코치입니다. 전체 면접 세션을 종합 평가합니다.
반드시 JSON 객체만 출력하세요.`,
      },
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

  const text = res.choices[0]?.message?.content ?? "";
  return JSON.parse(text) as SessionSummaryResult;
}

export { getSchoolCategoryLabel as schoolLabelFor } from "@/lib/school-data";
export { getSchoolName } from "@/lib/school-data";
