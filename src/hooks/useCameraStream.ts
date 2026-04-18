"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function useCameraStream() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<
    "unknown" | "granted" | "denied"
  >("unknown");
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsEnabled(true);
      setPermissionState("granted");
      setError(null);
    } catch (err) {
      const e = err as Error;
      if (e.name === "NotAllowedError") {
        setPermissionState("denied");
        setError("카메라/마이크 접근이 거부되었습니다. 브라우저 설정에서 허용해주세요.");
      } else {
        setError("카메라를 시작할 수 없습니다: " + e.message);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsEnabled(false);
  }, []);

  const toggleCamera = useCallback(() => {
    if (isEnabled) {
      if (streamRef.current) {
        const videoTrack = streamRef.current.getVideoTracks()[0];
        if (videoTrack) videoTrack.enabled = !videoTrack.enabled;
        setIsEnabled(videoTrack?.enabled ?? false);
      }
    } else {
      if (streamRef.current) {
        const videoTrack = streamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = true;
          setIsEnabled(true);
        }
      } else {
        startCamera();
      }
    }
  }, [isEnabled, startCamera]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return { stream, isEnabled, error, permissionState, startCamera, stopCamera, toggleCamera };
}
