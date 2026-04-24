import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LandingHero } from "@/components/landing-hero";

export default async function RootPage() {
  const session = await auth();

  if (session?.user) {
    const u = session.user as typeof session.user & {
      onboarded?: boolean;
      isIndividual?: boolean;
      academyId?: string | null;
    };
    const isOnboarded = u.onboarded || u.isIndividual || !!u.academyId;

    if (!isOnboarded) redirect("/onboarding");
    if (u.role === "STUDENT") redirect("/student/dashboard");
    redirect("/teacher/dashboard");
  }

  return <LandingHero />;
}
