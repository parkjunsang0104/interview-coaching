import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildS3Key, getPresignedUploadUrl } from "@/lib/s3";
import { isS3Configured } from "@/lib/local-storage";
import { z } from "zod";
import { nanoid } from "nanoid";

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

  if (!isS3Configured()) {
    const s3Key = `local/${nanoid()}.${ext}`;
    const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
    const uploadUrl = `${baseUrl}/api/upload/local?key=${encodeURIComponent(s3Key)}`;
    return NextResponse.json({ uploadUrl, s3Key });
  }

  const s3Key = buildS3Key({
    academyId: session.user.academyId ?? "no-academy",
    userId: session.user.id,
    sessionId,
    questionIndex,
    fileType: "audio",
    ext,
  });

  const uploadUrl = await getPresignedUploadUrl(s3Key, mimeType);

  return NextResponse.json({ uploadUrl, s3Key });
}
