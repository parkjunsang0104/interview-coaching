"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  return (
    <Card className="shadow-lg border-[#E8DFC4]">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-[#B40023] rounded-xl flex items-center justify-center mb-2">
          <Sparkles className="w-6 h-6 text-[#FCF0D6]" />
        </div>
        <CardTitle className="text-2xl text-gray-800">회원가입</CardTitle>
        <CardDescription className="text-gray-600">
          구글 계정으로 시작하고, 학원 정보를 입력해주세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="bg-[#FCF0D6] rounded-xl p-4 space-y-2.5 border border-[#E8DFC4]">
          <p className="text-xs font-semibold text-gray-700 mb-2">가입 후 다음 단계:</p>
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <CheckCircle2 className="w-4 h-4 text-[#B40023] shrink-0 mt-0.5" />
            <span>학원 소속이면 <strong>학원 고유 코드</strong>를 입력</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <CheckCircle2 className="w-4 h-4 text-[#B40023] shrink-0 mt-0.5" />
            <span>개인 사용자는 <strong>개인</strong>으로 바로 시작</span>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
          className="w-full h-12 bg-white border border-[#E8DFC4] text-gray-800 hover:bg-[#FCF0D6] hover:border-[#B40023]/30 shadow-sm"
        >
          <GoogleIcon />
          <span className="ml-2 font-medium">Google 계정으로 가입하기</span>
        </Button>

        <p className="text-center text-sm text-gray-600">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-[#B40023] hover:underline font-medium">
            로그인
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}
