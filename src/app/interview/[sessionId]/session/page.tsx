"use client";

import { use, useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useCameraStream } from "@/hooks/useCameraStream";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
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

function uploadToS3(
  url: string,
  blob: Blob,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", blob.type || "video/webm");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`S3 upload failed: ${xhr.status}`)));
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
  const [transcript, setTranscript] = useState<string>("");
  const [answerId, setAnswerId] = useState<string>("");
  const [showFeedbackReady, setShowFeedbackReady] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(true);

  const { stream, isEnabled, error: camError, startCamera, toggleCamera } = useCameraStream();
  const { isRecording, duration, startRecording, stopRecording, reset } = useMediaRecorder(stream);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/questions`)
      .then((r) => r.json())
      .then((d) => setQuestions(d.questions ?? []))
      .catch(() => toast.error("질문을 불러오지 못했습니다."));
  }, [sessionId]);

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const currentQuestion = questions[currentIdx];

  const handleStopAndProcess = useCallback(async () => {
    if (!currentQuestion) return;
    const { blob, mimeType, duration: dur } = await stopRecording();

    setProcessStep("uploading");
    setUploadProgress(0);

    try {
      // 1. presigned URL 획득
      const presignRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionIndex: currentQuestion.orderIndex,
          mimeType: mimeType || "video/webm",
        }),
      });
      const { uploadUrl, s3Key } = await presignRes.json();

      // 2. S3 직접 업로드 (XHR for progress)
      await uploadToS3(uploadUrl, blob, setUploadProgress);

      // 3. Answer 저장
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
      setAnswerId(aid);

      // 4. STT 트리거 & 폴링
      setProcessStep("transcribing");
      await fetch(`/api/sessions/${sessionId}/answers/${aid}/transcribe`, { method: "POST" });

      const sttResult = await pollUntilDone(
        `/api/sessions/${sessionId}/answers/${aid}/transcribe`,
        (d) => (d as { status: string }).status === "done" || (d as { status: string }).status === "failed"
      ) as { status: string; transcript?: string };

      setTranscript(sttResult.transcript ?? "");

      // 5. 피드백 트리거 & 폴링
      setProcessStep("feedback");
      await fetch(`/api/sessions/${sessionId}/answers/${aid}/feedback`, { method: "POST" });

      setProcessStep("done");
      setShowFeedbackReady(true);
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
    setTranscript("");
    setAnswerId("");
    setShowFeedbackReady(false);
    reset();
  }, [currentIdx, questions.length, router, sessionId, reset]);

  if (!questions.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const isProcessing = processStep !== "idle" && processStep !== "done";

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* 상단 진행 바 */}
      <div className="flex items-center gap-4 px-6 py-3 bg-gray-800 border-b border-gray-700">
        <span className="text-sm text-gray-400">
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
        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span
              className={`text-sm font-mono font-bold ${
                duration > 180 ? "text-red-400" : "text-white"
              }`}
            >
              {formatTime(duration)}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 gap-0">
        {/* 카메라 패널 */}
        {cameraVisible && (
          <div className="relative w-80 bg-black flex-shrink-0">
            {stream ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
                <CameraOff className="w-10 h-10" />
                <p className="text-xs text-center px-4">
                  {camError ?? "카메라를 시작하는 중..."}
                </p>
              </div>
            )}
            {/* 카메라 컨트롤 */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
              <button
                onClick={toggleCamera}
                className="w-9 h-9 bg-gray-800/80 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors"
                title={isEnabled ? "카메라 끄기" : "카메라 켜기"}
              >
                {isEnabled ? (
                  <Camera className="w-4 h-4" />
                ) : (
                  <CameraOff className="w-4 h-4 text-red-400" />
                )}
              </button>
              <button
                onClick={() => setCameraVisible(false)}
                className="px-3 h-9 bg-gray-800/80 hover:bg-gray-700 rounded-full text-xs transition-colors"
              >
                숨기기
              </button>
            </div>
          </div>
        )}

        {/* 면접 패널 */}
        <div className="flex-1 flex flex-col p-8">
          {!cameraVisible && (
            <button
              onClick={() => setCameraVisible(true)}
              className="mb-4 self-start flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <Camera className="w-4 h-4" />
              카메라 보기
            </button>
          )}

          {/* 질문 */}
          <div className="flex-1">
            {currentQuestion && (
              <>
                <Badge
                  className={`${CATEGORY_COLORS[currentQuestion.category]} border text-xs mb-4`}
                >
                  {CATEGORY_LABELS[currentQuestion.category]}
                </Badge>
                <h2 className="text-2xl font-semibold leading-relaxed mb-8 text-white">
                  {currentQuestion.text}
                </h2>
              </>
            )}

            {/* 처리 상태 */}
            {isProcessing && (
              <div className="space-y-4 bg-gray-800 rounded-xl p-6">
                {processStep === "uploading" && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      영상 업로드 중... {uploadProgress}%
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

            {/* STT 결과 + 완료 */}
            {processStep === "done" && (
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 text-green-400 text-sm mb-3">
                    <CheckCircle className="w-4 h-4" />
                    분석 완료
                  </div>
                  <p className="text-sm text-gray-300 font-medium mb-2">내 답변 (음성 인식)</p>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {transcript || "(음성 인식 결과 없음)"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 하단 버튼 */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Mic className="w-4 h-4" />
              {isRecording ? (
                <span className="text-red-400">녹음 중 — 답변이 끝나면 정지를 누르세요</span>
              ) : processStep === "idle" ? (
                <span>준비가 되면 녹음을 시작하세요</span>
              ) : null}
            </div>

            <div className="flex gap-3">
              {processStep === "idle" && !isRecording && (
                <Button
                  onClick={startRecording}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={!stream}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  녹음 시작
                </Button>
              )}
              {isRecording && (
                <Button
                  onClick={handleStopAndProcess}
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-gray-700"
                >
                  <Square className="w-4 h-4 mr-2" />
                  녹음 정지
                </Button>
              )}
              {processStep === "done" && (
                <Button onClick={handleNextQuestion} className="bg-blue-600 hover:bg-blue-700">
                  {currentIdx >= questions.length - 1 ? (
                    "피드백 보기"
                  ) : (
                    <>
                      다음 질문
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
