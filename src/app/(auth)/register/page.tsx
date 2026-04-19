"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      password: (form.elements.namedItem("password") as HTMLInputElement).value,
      academyCode: (form.elements.namedItem("academyCode") as HTMLInputElement).value,
    };

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "회원가입에 실패했습니다.");
        return;
      }

      toast.success(`${json.academyName} 학원 소속으로 가입되었습니다. 로그인해주세요.`);
      router.push("/login");
    } catch {
      toast.error("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center mb-2">
          <span className="text-white text-xl font-bold">면</span>
        </div>
        <CardTitle className="text-2xl">회원가입</CardTitle>
        <CardDescription>학원에서 안내받은 학원 코드로 가입하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="academyCode">학원 코드</Label>
            <Input
              id="academyCode"
              name="academyCode"
              placeholder="예: DEMO001"
              className="uppercase tracking-wider font-mono"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input id="name" name="name" placeholder="홍길동" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="example@email.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="6자리 이상"
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "가입 중..." : "회원가입"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-pink-500 hover:underline font-medium">
            로그인
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
