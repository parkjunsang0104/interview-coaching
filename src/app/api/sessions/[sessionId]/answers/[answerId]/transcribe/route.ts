import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getObjectBuffer } from "@/lib/s3";
import { transcribeAudio } from "@/lib/whisper";
import { isLocalKey, readLocalFile } from "@/lib/local-storage";

export const maxDuration = 60;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string; answerId: string }> }
) {
  const { answerId } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    select: { id: true, videoS3Key: true, sttStatus: true },
  });

  if (!answer?.videoS3Key) {
    return NextResponse.json({ error: "업로드된 영상이 없습니다." }, { status: 400 });
  }

  if (answer.sttStatus === "done") {
    return NextResponse.json({ status: "done" });
  }

  await prisma.answer.update({
    where: { id: answerId },
    data: { sttStatus: "processing" },
  });

  try {
    const buffer = isLocalKey(answer.videoS3Key)
      ? await readLocalFile(answer.videoS3Key)
      : await getObjectBuffer(answer.videoS3Key);
    const mimeType = answer.videoS3Key.endsWith(".mp4") ? "video/mp4"
      : answer.videoS3Key.endsWith(".webm") ? "video/webm"
      : "audio/webm";
    const result = await transcribeAudio(buffer, mimeType);

    await prisma.answer.update({
      where: { id: answerId },
      data: {
        transcript: result.text,
        sttStatus: "done",
        sttConfidence: result.confidence,
      },
    });

    return NextResponse.json({ status: "done", transcript: result.text });
  } catch (err) {
    await prisma.answer.update({
      where: { id: answerId },
      data: { sttStatus: "failed" },
    });
    console.error("STT error:", err);
    return NextResponse.json({ error: "STT 처리에 실패했습니다." }, { status: 500 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string; answerId: string }> }
) {
  const { answerId } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    select: { sttStatus: true, transcript: true },
  });

  if (!answer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ status: answer.sttStatus, transcript: answer.transcript });
}
