import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "면접 코치 | 특목고 면접 준비 플랫폼",
  description: "AI 기반 특목고 면접 코칭 프로그램 — 자기소개서 분석, 맞춤 질문, 실시간 피드백",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          {children}
        </SessionProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
