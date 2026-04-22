import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let _s3: S3Client | null = null;
function getClient(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({
      region: process.env.AWS_REGION ?? "ap-northeast-2",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  return _s3;
}

function bucket() {
  return process.env.AWS_S3_BUCKET ?? "";
}

const ENV = process.env.APP_ENV ?? "development";

export function buildS3Key(params: {
  academyId: string;
  userId: string;
  sessionId: string;
  questionIndex: number;
  fileType: "video" | "audio";
  ext: string;
}): string {
  return `${ENV}/academies/${params.academyId}/students/${params.userId}/sessions/${params.sessionId}/questions/q${params.questionIndex}/${params.fileType}.${params.ext}`;
}

export async function getPresignedUploadUrl(
  s3Key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: s3Key,
    ContentType: contentType,
  });
  return getSignedUrl(getClient(), command, { expiresIn: 3600 });
}

export async function getPresignedDownloadUrl(s3Key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: bucket(), Key: s3Key });
  return getSignedUrl(getClient(), command, { expiresIn: 900 });
}

export async function deleteObject(s3Key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: bucket(), Key: s3Key }));
}

export async function getObjectBuffer(s3Key: string): Promise<Buffer> {
  const response = await getClient().send(
    new GetObjectCommand({ Bucket: bucket(), Key: s3Key })
  );
  const stream = response.Body as NodeJS.ReadableStream;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
