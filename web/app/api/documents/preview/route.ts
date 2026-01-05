import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3/client";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });
  const accessToken = req.cookies.get("access_token")?.value;
  if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const payload = verifyToken<{ firmId: string }>(accessToken);
  if (!key.startsWith(`${payload.firmId}/`)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const cmd = new GetObjectCommand({ Bucket: "documents", Key: key });
  try {
    const obj = await s3Client.send(cmd);
    const contentType = obj.ContentType || "application/octet-stream";
    const bodyStream = obj.Body as ReadableStream<Uint8Array> | null;
    return new Response(bodyStream as unknown as BodyInit, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch object" }, { status: 502 });
  }
}
