import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "google") return false;
      if (!user.email) return false;

      const existing = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!existing) {
        // 신규 사용자: 온보딩 전 상태로 생성
        await prisma.user.create({
          data: {
            email: user.email,
            name: user.name ?? user.email.split("@")[0],
            image: user.image ?? null,
            role: "STUDENT",
            onboarded: false,
          },
        });
      } else if (user.image && existing.image !== user.image) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { image: user.image },
        });
      }

      return true;
    },
    async jwt({ token, user, trigger }) {
      // 로그인 직후 또는 세션 갱신 시 DB에서 최신 정보 로드
      if (user?.email || trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { email: (user?.email ?? token.email) as string },
        });
        if (dbUser) {
          token.sub = dbUser.id;
          token.role = dbUser.role;
          token.academyId = dbUser.academyId;
          token.isIndividual = dbUser.isIndividual;
          token.onboarded = dbUser.onboarded;
        }
      }
      return token;
    },
  },
});
