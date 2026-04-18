import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  questionId: z.string(),
  videoS3Key: z.string(),
  durationSec: z.number().int().min(0),
  mimeType: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { questionId, videoS3Key, durationSec } = parsed.data;

  const answer = await prisma.answer.upsert({
    where: { questionId },
    create: {
      questionId,
      videoS3Key,
      durationSec,
      sttStatus: "pending",
    },
    update: {
      videoS3Key,
      durationSec,
      sttStatus: "pending",
      transcript: null,
    },
  });

  return NextResponse.json({ answerId: answer.id });
}
