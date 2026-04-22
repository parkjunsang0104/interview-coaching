import OpenAI from "openai";
import fs from "fs";
import path from "path";
import os from "os";

let _openai: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<{ text: string; confidence?: number }> {
  const ext = mimeType.includes("mp4") ? "mp4" : "webm";
  const tmpPath = path.join(os.tmpdir(), `audio_${Date.now()}.${ext}`);

  try {
    fs.writeFileSync(tmpPath, audioBuffer);
    const file = fs.createReadStream(tmpPath);

    const transcription = await getClient().audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "ko",
      response_format: "verbose_json",
    });

    const verboseResult = transcription as unknown as {
      text: string;
      segments?: Array<{ avg_logprob: number }>;
    };

    let avgConfidence: number | undefined;
    if (verboseResult.segments && verboseResult.segments.length > 0) {
      const avgLogProb =
        verboseResult.segments.reduce((sum, s) => sum + s.avg_logprob, 0) /
        verboseResult.segments.length;
      avgConfidence = Math.exp(avgLogProb);
    }

    return {
      text: verboseResult.text,
      confidence: avgConfidence,
    };
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  }
}
