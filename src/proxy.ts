import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login", "/register", "/api/auth"];

type AuthReq = NextRequest & {
  auth: {
    user?: {
      role?: string;
      onboarded?: boolean;
      isIndividual?: boolean;
      academyId?: string | null;
    };
  } | null;
};

export default auth(function proxy(req: AuthReq) {
  const { pathname } = req.nextUrl;

  // 완전 공개 경로 (로그인 불필요)
  const isPublic =
    pathname === "/" ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const session = req.auth;
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { role, onboarded, isIndividual, academyId } = session.user;
  const isOnboarded = onboarded || isIndividual || !!academyId;

  // 온보딩 API / 페이지는 언제나 접근 허용 (로그인만 되어있으면)
  if (pathname.startsWith("/onboarding") || pathname.startsWith("/api/onboarding")) {
    if (isOnboarded) {
      // 이미 온보딩 완료 → 대시보드로
      return NextResponse.redirect(new URL("/student/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // 로그인은 했지만 온보딩 미완료 → 온보딩으로 강제 이동
  if (!isOnboarded) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  if (pathname.startsWith("/teacher") && role !== "TEACHER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/student/dashboard", req.url));
  }

  if (pathname.startsWith("/student") && role !== "STUDENT") {
    return NextResponse.redirect(new URL("/teacher/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
