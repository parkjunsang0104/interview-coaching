import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/shared/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let academyName: string | undefined;
  if (session.user.academyId) {
    const academy = await prisma.academy.findUnique({
      where: { id: session.user.academyId },
      select: { name: true },
    });
    academyName = academy?.name;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        role={session.user.role}
        userName={session.user.name}
        academyName={academyName}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
