import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const academyId = session.user.academyId;
  if (!academyId) {
    return NextResponse.json({ students: [] });
  }

  const students = await prisma.user.findMany({
    where: {
      academyId,
      role: "STUDENT",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ students });
}
