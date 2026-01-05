/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { deleteObject } from "@/lib/s3/client";
import { verifyToken } from "@/lib/auth/jwt";
import { requireActiveSubscription } from "@/lib/subscription/guard";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const accessToken = req.cookies.get("access_token")?.value;
    if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
    const { id } = await ctx.params;
    const [row] = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.firmId, payload.firmId))).limit(1);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const accessToken = req.cookies.get("access_token")?.value;
    if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
    const { id } = await ctx.params;

    const { allowed: subAllowed, errorResponse } = await requireActiveSubscription();
    if (!subAllowed) return errorResponse;

    const body = await req.json();
    const updateData: Partial<typeof documents.$inferInsert> = {
      title: body.title,
      description: body.description,
      documentType: body.documentType,
      documentDate: body.documentDate || null,
    };
    const [row] = await db.update(documents).set(updateData).where(and(eq(documents.id, id), eq(documents.firmId, payload.firmId))).returning();
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const accessToken = req.cookies.get("access_token")?.value;
    if (!accessToken) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const payload = verifyToken<{ userId: string; role: string; firmId: string }>(accessToken);
    const { id } = await ctx.params;

    const { allowed, errorResponse } = await requireActiveSubscription();
    if (!allowed) return errorResponse;

    const existing = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.firmId, payload.firmId))).limit(1);
    if (!existing || existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const doc = existing[0] as any;
    await db.delete(documents).where(eq(documents.id, id));
    const key = doc.fileUrl as string;
    if (key && !key.startsWith("http")) {
      try { await deleteObject("documents", key); } catch { }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
