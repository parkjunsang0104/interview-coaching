"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useCameraStream } from "@/hooks/useCameraStream";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import {
  CameraOff,
  Mic,
  Square,
  ChevronRight,
  Loader2,
  CheckCircle,
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  MOTIVATION: "지원동기",
  CHARACTER: "인성",
  ACTIVITY: "활동",
  FUTURE_PLAN: "미래계획",
  SITUATION: "상황대처",
  COMPREHENSIVE: "종합",
};

const CATEGORY_COLORS: Record<string, string> = {
  MOTIVATION: "bg-blue-100 text-blue-700 border-blue-200",
  CHARACTER: "bg-green-100 text-green-700 border-green-200",
  ACTIVITY: "bg-yellow-100 text-yellow-700 border-yellow-200",
  FUTURE_PLAN: "bg-purple-100 text-purple-700 border-purple-200",
  SITUATION: "bg-red-100 text-red-700 border-red-200",
  COMPREHENSIVE: "bg-gray-100 text-gray-700 border-gray-200",
};

type ProcessingStep = "idle" | "uploading" | "transcribing" | "feedback" | "done";

interface Question {
  id: string;
  orderIndex: number;
  category: string;
  text: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function uploadAudio(
  url: string,
  blob: Blob,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", blob.type || "audio/webm");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(blob);
  });
}

async function pollUntilDone(
  url: string,
  checkFn: (data: unknown) => boolean,
  intervalMs = 2000,
  maxAttempts = 30
): Promise<unknown> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(url);
    const data = await res.json();
    if (checkFn(data)) return data;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Timeout waiting for processing");
}

export default function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [processStep, setProcessStep] = useState<ProcessingStep>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [questionElapsed, setQuestionElapsed] = useState(0);

  const { stream, error: camError, startCamera } = useCameraStream();
  const { isRecording, duration, startRecording, stopRecording, reset } = useMediaRecorder(stream);

  // Callback ref: 비디오 엘리먼트가 마운트되면 즉시 스트림 연결
  const videoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      if (el && stream) {
        el.srcObject = stream;
        el.play().catch(() => {});
      }
    },
    [stream]
  );

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/questions`)
      .then((r) => r.json())
      .then((d) => setQuestions(d.questions ?? []))
      .catch(() => toast.error("질문을 불러오지 못했습니다."));
  }, [sessionId]);

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  // 전체 타이머: 페이지 마운트 이후 계속 증가
  useEffect(() => {
    const id = setInterval(() => setTotalElapsed((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // 현재 질문 타이머: 질문이 바뀌면 0으로 리셋 후 재시작
  useEffect(() => {
    setQuestionElapsed(0);
    const id = setInterval(() => setQuestionElapsed((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [currentIdx]);

  const currentQuestion = questions[currentIdx];

  const handleStopAndProcess = useCallback(async () => {
    if (!currentQuestion) return;
    const { blob, mimeType, duration: dur } = await stopRecording();

    setProcessStep("uploading");
    setUploadProgress(0);

    try {
      const presignRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionIndex: currentQuestion.orderIndex,
          mimeType: mimeType || "audio/webm",
        }),
      });
      const { uploadUrl, s3Key } = await presignRes.json();
      await uploadAudio(uploadUrl, blob, setUploadProgress);

      const answerRes = await fetch(`/api/sessions/${sessionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          videoS3Key: s3Key,
          durationSec: dur,
          mimeType,
        }),
      });
      const { answerId: aid } = await answerRes.json();

      setProcessStep("transcribing");
      await fetch(`/api/sessions/${sessionId}/answers/${aid}/transcribe`, { method: "POST" });
      await pollUntilDone(
        `/api/sessions/${sessionId}/answers/${aid}/transcribe`,
        (d) => (d as { status: string }).status === "done" || (d as { status: string }).status === "failed"
      );

      setProcessStep("feedback");
      await fetch(`/api/sessions/${sessionId}/answers/${aid}/feedback`, { method: "POST" });

      setProcessStep("done");
    } catch (err) {
      console.error(err);
      toast.error("처리 중 오류가 발생했습니다.");
      setProcessStep("idle");
    }
  }, [currentQuestion, sessionId, stopRecording]);

  const handleNextQuestion = useCallback(() => {
    if (currentIdx >= questions.length - 1) {
      router.push(`/interview/${sessionId}/feedback`);
      return;
    }
    setCurrentIdx((i) => i + 1);
    setProcessStep("idle");
    reset();
  }, [currentIdx, questions.length, router, sessionId, reset]);

  if (!questions.length) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const isProcessing = processStep !== "idle" && processStep !== "done";

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* 상단 진행 바 */}
      <div className="flex items-center gap-4 px-6 py-3 bg-gray-800 border-b border-gray-700">
        <span className="text-sm text-gray-400 shrink-0">
          질문 {currentIdx + 1} / {questions.length}
        </span>
        <div className="flex gap-1.5 flex-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < currentIdx
                  ? "bg-green-400"
                  : i === currentIdx
                  ? "bg-blue-400"
                  : "bg-gray-600"
              }`}
            />
          ))}
        </div>
      </div>

      {/* 메인 영역 — 중앙 정렬 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-3xl flex flex-col items-center">
          {/* 질문 (카메라 위) */}
          {currentQuestion && (
            <div className="w-full mb-6 text-center relative">
              <Badge className={`${CATEGORY_COLORS[currentQuestion.category]} border text-xs mb-3`}>
                {CATEGORY_LABELS[currentQuestion.category]}
              </Badge>
              <h2
                className="text-xl md:text-2xl font-semibold leading-relaxed text-white px-16 mx-auto"
                style={{
                  wordBreak: "keep-all",
                  overflowWrap: "break-word",
                  lineBreak: "strict",
                  maxWidth: "48rem",
                }}
              >
                {currentQuestion.text}
              </h2>

              {/* 타이머 — 우측 상단 (2개) */}
              <div className="absolute top-0 right-0 flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-gray-800/80 border border-gray-700 px-3 py-1.5 rounded-full">
                  <span className="text-[10px] text-gray-400 font-medium">현재 질문</span>
                  <span
                    className={`text-sm font-mono font-bold ${
                      isRecording && questionElapsed > 180 ? "text-red-300" : "text-white"
                    }`}
                  >
                    {formatTime(questionElapsed)}
                  </span>
                  {isRecording && (
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse ml-0.5" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 bg-gray-800/80 border border-gray-700 px-3 py-1.5 rounded-full">
                  <span className="text-[10px] text-gray-400 font-medium">총 시간</span>
                  <span className="text-sm font-mono font-bold text-gray-200">
                    {formatTime(totalElapsed)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 카메라 (정 가운데) */}
          <div className="relative w-full max-w-2xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gray-700">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            {!stream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500 bg-black">
                <CameraOff className="w-10 h-10" />
                <p className="text-xs text-center px-4">
                  {camError ?? "카메라를 시작하는 중..."}
                </p>
              </div>
            )}

            {/* 카메라 상단 라벨 */}
            <div className="absolute top-3 left-3">
              <span className="text-xs bg-gray-900/70 text-gray-300 px-2.5 py-1 rounded-full">
                미리보기 (영상은 저장되지 않습니다)
              </span>
            </div>

            {/* 음성 녹음 인디케이터 — 카메라 하단 */}
            {isRecording && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5">
                <div className="flex items-center justify-center gap-3">
                  <div className="flex gap-0.5 items-end h-8">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-red-400 rounded-full animate-pulse"
                        style={{
                          height: `${30 + Math.random() * 70}%`,
                          animationDelay: `${i * 40}ms`,
                          animationDuration: "0.6s",
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-red-300 font-medium">음성 녹음 중</span>
                </div>
              </div>
            )}
          </div>

          {/* 처리 상태 */}
          {isProcessing && (
            <div className="w-full max-w-2xl mt-6 space-y-3 bg-gray-800 rounded-xl p-5">
              {processStep === "uploading" && (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    음성 파일 업로드 중... {uploadProgress}%
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </>
              )}
              {processStep === "transcribing" && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  음성을 텍스트로 변환하는 중...
                </div>
              )}
              {processStep === "feedback" && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI 피드백 생성 중...
                </div>
              )}
            </div>
          )}

          {/* 답변 완료 */}
          {processStep === "done" && (
            <div className="w-full max-w-2xl mt-6 bg-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
                <CheckCircle className="w-4 h-4" />
                분석 완료
              </div>
              <p className="text-base text-gray-100 leading-relaxed">
                답변 감사합니다
              </p>
            </div>
          )}

          {/* 컨트롤 버튼 */}
          <div className="w-full max-w-2xl mt-8 flex items-center justify-center">
            {processStep === "idle" && !isRecording && (
              <Button
                onClick={startRecording}
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white h-12 px-8"
                disabled={!stream}
              >
                <Mic className="w-5 h-5 mr-2" />
                녹음 시작
              </Button>
            )}
            {isRecording && (
              <Button
                onClick={handleStopAndProcess}
                size="lg"
                variant="outline"
                className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700 h-12 px-8"
              >
                <Square className="w-5 h-5 mr-2" />
                녹음 정지 & 제출
              </Button>
            )}
            {processStep === "done" && (
              <Button
                onClick={handleNextQuestion}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 h-12 px-8"
              >
                {currentIdx >= questions.length - 1 ? "피드백 보기" : (
                  <>다음 질문 <ChevronRight className="w-5 h-5 ml-1" /></>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
