import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildS3Key, getPresignedUploadUrl } from "@/lib/s3";
import { z } from "zod";

const schema = z.object({
  sessionId: z.string(),
  questionIndex: z.number().int().min(1).max(6),
  mimeType: z.string(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { sessionId, questionIndex, mimeType } = parsed.data;
  const ext = mimeType.includes("mp4") ? "mp4" : "webm";

  const s3Key = buildS3Key({
    academyId: session.user.academyId ?? "no-academy",
    userId: session.user.id,
    sessionId,
    questionIndex,
    fileType: "video",
    ext,
  });

  const uploadUrl = await getPresignedUploadUrl(s3Key, mimeType);

  return NextResponse.json({ uploadUrl, s3Key });
}
