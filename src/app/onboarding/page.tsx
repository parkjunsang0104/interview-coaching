"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap, User, Sparkles, LogOut } from "lucide-react";

type Mode = "academy" | "individual" | null;

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [mode, setMode] = useState<Mode>(null);
  const [academyCode, setAcademyCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (mode === "academy" && academyCode.trim().length === 0) {
      toast.error("학원 코드를 입력해주세요.");
      return;
    }
    if (!mode) return;

    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "academy"
            ? { type: "academy", academyCode: academyCode.trim().toUpperCase() }
            : { type: "individual" }
        ),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "오류가 발생했습니다.");
        return;
      }

      toast.success(
        mode === "academy"
          ? `${json.academyName} 학원 소속으로 등록되었습니다.`
          : "개인 사용자로 등록되었습니다."
      );

      await update();
      router.push("/student/dashboard");
      router.refresh();
    } catch {
      toast.error("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-[#B40023] rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-[#FCF0D6]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">환영합니다{session?.user?.name ? `, ${session.user.name}님` : ""}!</h1>
            <p className="text-xs text-gray-500">계정 정보를 완성해주세요</p>
          </div>
        </div>

        <Card className="border-[#E8DFC4] shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">사용 유형을 선택하세요</CardTitle>
            <CardDescription>언제든 변경할 수 있어요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* 학원 소속 */}
            <button
              type="button"
              onClick={() => setMode("academy")}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                mode === "academy"
                  ? "border-[#B40023] bg-[#FCF0D6]"
                  : "border-[#E8DFC4] bg-white hover:border-[#B40023]/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    mode === "academy" ? "bg-[#B40023]" : "bg-[#FCF0D6]"
                  }`}
                >
                  <GraduationCap
                    className={`w-5 h-5 ${mode === "academy" ? "text-[#FCF0D6]" : "text-[#B40023]"}`}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">학원 소속</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    학원에서 받은 고유 코드가 있어요
                  </p>
                </div>
              </div>
            </button>

            {mode === "academy" && (
              <div className="pl-2 pr-1 pt-1 pb-2 space-y-2 animate-in fade-in-50">
                <Label htmlFor="academyCode" className="text-xs text-gray-600">
                  학원 코드
                </Label>
                <Input
                  id="academyCode"
                  value={academyCode}
                  onChange={(e) => setAcademyCode(e.target.value)}
                  placeholder="예: DEMO001"
                  className="uppercase tracking-wider font-mono border-[#E8DFC4] focus-visible:ring-[#B40023]"
                  autoFocus
                />
              </div>
            )}

            {/* 개인 사용 */}
            <button
              type="button"
              onClick={() => setMode("individual")}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                mode === "individual"
                  ? "border-[#B40023] bg-[#FCF0D6]"
                  : "border-[#E8DFC4] bg-white hover:border-[#B40023]/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    mode === "individual" ? "bg-[#B40023]" : "bg-[#FCF0D6]"
                  }`}
                >
                  <User
                    className={`w-5 h-5 ${mode === "individual" ? "text-[#FCF0D6]" : "text-[#B40023]"}`}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">개인 사용</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    학원 없이 개인적으로 면접 연습을 합니다
                  </p>
                </div>
              </div>
            </button>

            <Button
              onClick={handleSubmit}
              disabled={!mode || loading}
              className="w-full h-11 bg-[#B40023] hover:bg-[#8a001b] text-[#FCF0D6] mt-2"
            >
              {loading ? "처리 중..." : "시작하기"}
            </Button>
          </CardContent>
        </Card>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-6 mx-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#B40023] transition-colors"
        >
          <LogOut className="w-3 h-3" />
          다른 계정으로 로그인
        </button>
      </div>
    </div>
  );
}
