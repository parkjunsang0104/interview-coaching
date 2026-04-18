"use client";

import { useState, useRef, useCallback } from "react";

function getSupportedMimeType(): string {
  const types = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

export function useMediaRecorder(stream: MediaStream | null) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(() => {
    if (!stream) return;
    chunksRef.current = [];
    setRecordedBlob(null);
    setDuration(0);

    const type = getSupportedMimeType();
    setMimeType(type);

    const recorder = new MediaRecorder(stream, { mimeType: type || undefined });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: type || "video/webm" });
      setRecordedBlob(blob);
      if (timerRef.current) clearInterval(timerRef.current);
    };

    recorder.start(5000); // 5초 청크
    setIsRecording(true);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, [stream]);

  const stopRecording = useCallback((): Promise<{ blob: Blob; mimeType: string; duration: number }> => {
    return new Promise((resolve) => {
      if (!recorderRef.current || recorderRef.current.state === "inactive") {
        resolve({ blob: new Blob(), mimeType, duration });
        return;
      }

      const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const currentMimeType = mimeType;

      recorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: currentMimeType || "video/webm" });
        setRecordedBlob(blob);
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
        resolve({ blob, mimeType: currentMimeType, duration: finalDuration });
      };

      recorderRef.current.stop();
    });
  }, [mimeType, duration]);

  const reset = useCallback(() => {
    setRecordedBlob(null);
    setDuration(0);
    setIsRecording(false);
    chunksRef.current = [];
  }, []);

  return { isRecording, duration, recordedBlob, mimeType, startRecording, stopRecording, reset };
}
