import fs from "fs/promises";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), ".uploads");

export function isLocalKey(key: string) {
  return key.startsWith("local/");
}

export function isS3Configured() {
  const id = process.env.AWS_ACCESS_KEY_ID ?? "";
  const secret = process.env.AWS_SECRET_ACCESS_KEY ?? "";
  return id.length > 10 && !id.startsWith("your-") && secret.length > 10 && !secret.startsWith("your-");
}

export async function saveLocalFile(key: string, buffer: Buffer): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const filePath = path.join(UPLOADS_DIR, key.replace(/\//g, "_"));
  await fs.writeFile(filePath, buffer);
}

export async function readLocalFile(key: string): Promise<Buffer> {
  const filePath = path.join(UPLOADS_DIR, key.replace(/\//g, "_"));
  return fs.readFile(filePath);
}
