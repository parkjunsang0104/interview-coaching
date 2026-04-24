import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/generated/prisma/client";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.academyId = (token.academyId as string | null) ?? null;
        (session.user as { isIndividual?: boolean }).isIndividual =
          Boolean(token.isIndividual);
        (session.user as { onboarded?: boolean }).onboarded =
          Boolean(token.onboarded);
      }
      return session;
    },
  },
};
