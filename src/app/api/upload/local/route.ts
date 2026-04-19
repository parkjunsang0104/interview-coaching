import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveLocalFile } from "@/lib/local-storage";

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });

  const buffer = Buffer.from(await req.arrayBuffer());
  await saveLocalFile(key, buffer);

  return NextResponse.json({ ok: true });
}
