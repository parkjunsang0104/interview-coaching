import type { UserRole } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      academyId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    academyId: string | null;
  }
}
