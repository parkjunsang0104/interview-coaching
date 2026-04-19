import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ academyId: string }> }
) {
  const { academyId } = await params;
  const session = await auth();
  if (!session?.user || session.user.academyId !== academyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const academy = await prisma.academy.findUnique({
    where: { id: academyId },
    select: { id: true, name: true, code: true, isActive: true },
  });

  if (!academy) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(academy);
}
