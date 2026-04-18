import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { z } from "zod";

const schema = z.object({
  expiresInDays: z.number().int().min(1).max(365).default(30),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ academyId: string }> }
) {
  const { academyId } = await params;
  const session = await auth();
  if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role === "TEACHER" && session.user.academyId !== academyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const expiresInDays = parsed.success ? parsed.data.expiresInDays : 30;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const inviteCode = await prisma.inviteCode.create({
    data: {
      code: nanoid(10).toUpperCase(),
      academyId,
      createdById: session.user.id,
      expiresAt,
      status: "ACTIVE",
    },
  });

  return NextResponse.json({ inviteCode }, { status: 201 });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ academyId: string }> }
) {
  const { academyId } = await params;
  const session = await auth();
  if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const codes = await prisma.inviteCode.findMany({
    where: { academyId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ codes });
}
