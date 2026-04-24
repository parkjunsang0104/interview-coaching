"use client";

import { useRouter } from "next/navigation";
import { ParticleHero } from "@/components/ui/animated-hero";

export function LandingHero() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full">
      <ParticleHero
        title="1inch"
        subtitle="특목자사고 면접 코칭 플랫폼"
        description="AI 기반 면접 코칭— 지원 학교와 자기소개서 기반 맞춤 질문에 실시간 피드백까지"
        particleCount={12}
        interactiveHint="마우스를 움직여 보세요"
        navItems={[
          { label: "HOME", onClick: () => router.push("/") },
          { label: "회원가입", onClick: () => router.push("/register") },
          { label: "요금제", onClick: () => router.push("/pricing") },
          { label: "문의하기", onClick: () => router.push("/contact") },
        ]}
        primaryButton={{
          text: "시작하기",
          onClick: () => router.push("/login"),
        }}
        secondaryButton={{
          text: "회원가입",
          onClick: () => router.push("/register"),
        }}
      />
    </div>
  );
}


