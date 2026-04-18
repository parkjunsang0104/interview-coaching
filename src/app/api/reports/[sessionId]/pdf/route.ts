import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";
import React from "react";

export const maxDuration = 60;

const SCHOOL_TYPE_LABELS: Record<string, string> = {
  FOREIGN_LANGUAGE: "외국어고등학교(외고)",
  INTERNATIONAL: "국제고등학교(국제고)",
  AUTONOMOUS: "자율형사립고(자사고)",
  SCIENCE_GIFTED: "과학영재학교",
};

const CATEGORY_LABELS: Record<string, string> = {
  MOTIVATION: "지원동기",
  CHARACTER: "인성",
  ACTIVITY: "활동",
  FUTURE_PLAN: "미래계획",
  SITUATION: "상황대처",
  COMPREHENSIVE: "종합",
};

Font.register({
  family: "NotoSans",
  src: "https://fonts.gstatic.com/s/notosanskr/v36/PbyxFmXiEBPT4ITbgNA5Cgm20xz64px_1hVWr0wuPNGmlQNMEfD4.0.woff2",
});

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "NotoSans", fontSize: 10, color: "#1a1a1a" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#6b7280", marginBottom: 20 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 8, color: "#1d4ed8" },
  card: { backgroundColor: "#f9fafb", padding: 12, borderRadius: 6, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  label: { color: "#6b7280" },
  score: { fontWeight: "bold", color: "#1d4ed8" },
  text: { lineHeight: 1.6, marginBottom: 4 },
  tag: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    padding: "2 6",
    borderRadius: 4,
    fontSize: 8,
    marginBottom: 4,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e5e7eb", marginVertical: 10 },
  feedbackBox: { backgroundColor: "#eff6ff", padding: 8, borderRadius: 4, marginBottom: 6 },
  feedbackLabel: { fontWeight: "bold", fontSize: 9, marginBottom: 3, color: "#1d4ed8" },
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [interviewSession, sessionFeedback, questions] = await Promise.all([
    prisma.interviewSession.findFirst({
      where: { id: sessionId },
      include: {
        user: { select: { name: true } },
        personalStatement: true,
      },
    }),
    prisma.sessionFeedback.findUnique({ where: { sessionId } }),
    prisma.question.findMany({
      where: { sessionId },
      include: { answer: { include: { feedback: true } } },
      orderBy: { orderIndex: "asc" },
    }),
  ]);

  if (!interviewSession) {
    return NextResponse.json({ error: "세션을 찾을 수 없습니다." }, { status: 404 });
  }

  const ps = interviewSession.personalStatement;
  const schoolLabel = SCHOOL_TYPE_LABELS[ps.schoolType] ?? ps.schoolType;
  const dateStr = new Date(interviewSession.createdAt).toLocaleDateString("ko-KR");

  const doc = React.createElement(
    Document,
    {},
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      // 헤더
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.title }, "면접 코칭 결과 리포트"),
        React.createElement(Text, { style: styles.subtitle },
          `${interviewSession.user.name} | ${schoolLabel} | ${dateStr}`
        )
      ),
      React.createElement(View, { style: styles.divider }),

      // 종합 점수
      sessionFeedback && React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, "종합 점수"),
        React.createElement(View, { style: styles.card },
          ...[
            ["내용 적절성", sessionFeedback.avgContentScore],
            ["논리성", sessionFeedback.avgLogicScore],
            ["완성도", sessionFeedback.avgCompletenessScore],
            ["표현력", sessionFeedback.avgExpressionScore],
            ["종합", sessionFeedback.avgTotalScore],
          ].map(([label, score]) =>
            React.createElement(View, { style: styles.row, key: String(label) },
              React.createElement(Text, { style: styles.label }, String(label)),
              React.createElement(Text, { style: styles.score }, `${Math.round(Number(score))}점`)
            )
          )
        ),
        React.createElement(Text, { style: styles.text }, sessionFeedback.overallSummary),
        React.createElement(View, { style: styles.feedbackBox },
          React.createElement(Text, { style: styles.feedbackLabel }, "잘한 점"),
          React.createElement(Text, { style: styles.text }, sessionFeedback.overallStrengths)
        ),
        React.createElement(View, { style: styles.feedbackBox },
          React.createElement(Text, { style: styles.feedbackLabel }, "개선할 점"),
          React.createElement(Text, { style: styles.text }, sessionFeedback.overallImprovements)
        )
      ),

      React.createElement(View, { style: styles.divider }),

      // 질문별 상세
      React.createElement(Text, { style: styles.sectionTitle }, "질문별 상세 피드백"),
      ...questions.map((q) =>
        React.createElement(View, { style: { marginBottom: 14 }, key: q.id },
          React.createElement(Text, { style: styles.tag }, CATEGORY_LABELS[q.category]),
          React.createElement(Text, { style: { fontWeight: "bold", marginBottom: 4, fontSize: 10 } }, q.text),
          React.createElement(View, { style: { ...styles.card, backgroundColor: "#f3f4f6" } },
            React.createElement(Text, { style: { color: "#6b7280", marginBottom: 2, fontSize: 9 } }, "내 답변"),
            React.createElement(Text, { style: styles.text }, q.answer?.transcript ?? "(답변 없음)")
          ),
          q.answer?.feedback && React.createElement(View, {},
            React.createElement(View, { style: styles.row },
              ...[
                ["내용", q.answer.feedback.contentScore],
                ["논리", q.answer.feedback.logicScore],
                ["완성도", q.answer.feedback.completenessScore],
                ["표현력", q.answer.feedback.expressionScore],
                ["종합", q.answer.feedback.totalScore],
              ].map(([l, v]) =>
                React.createElement(Text, { key: String(l), style: { fontSize: 9 } },
                  `${l}: ${v}점`
                )
              )
            ),
            React.createElement(View, { style: styles.feedbackBox },
              React.createElement(Text, { style: styles.feedbackLabel }, "잘한 점"),
              React.createElement(Text, { style: styles.text }, q.answer.feedback.strengths)
            ),
            React.createElement(View, { style: styles.feedbackBox },
              React.createElement(Text, { style: styles.feedbackLabel }, "개선할 점"),
              React.createElement(Text, { style: styles.text }, q.answer.feedback.improvements)
            ),
            React.createElement(View, { style: styles.feedbackBox },
              React.createElement(Text, { style: styles.feedbackLabel }, "모범 답변 방향"),
              React.createElement(Text, { style: styles.text }, q.answer.feedback.modelDirection)
            )
          )
        )
      )
    )
  );

  const pdfBuffer = await renderToBuffer(doc);
  const arrayBuffer = pdfBuffer.buffer.slice(
    pdfBuffer.byteOffset,
    pdfBuffer.byteOffset + pdfBuffer.byteLength
  ) as ArrayBuffer;

  return new Response(arrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="interview-report-${sessionId}.pdf"`,
    },
  });
}
